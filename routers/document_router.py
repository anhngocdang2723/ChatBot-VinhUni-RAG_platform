from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks, Query, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator
from core.pinecone.pinecone_service import PineconeService
from core.document_processing.document_processor import DocumentProcessor
from core.utils.dependencies import get_pinecone_service, get_document_processor
from core.llm.config import CollectionConfig, ChunkingConfig, get_settings
import logging
import os
import shutil
import json
from datetime import datetime, timedelta
import uuid
import time
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from core.database.database import get_db
from core.database.models import Document
from sqlalchemy import or_, and_
import hashlib

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Rate limiting settings
RATE_LIMIT_DURATION = 3600  # 1 hour in seconds
MAX_REQUESTS_PER_HOUR = 100
rate_limit_store = {}  # Store IP -> {count: int, reset_time: float}

# File validation settings
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt', '.xlsx', '.csv', '.html', '.htm'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Collection settings
DEFAULT_COLLECTION = CollectionConfig.STORAGE_NAME

def check_rate_limit(request: Request) -> bool:
    """Check if request is within rate limits."""
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Clean up expired entries
    expired = [ip for ip, data in rate_limit_store.items() 
              if current_time > data['reset_time']]
    for ip in expired:
        del rate_limit_store[ip]
    
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = {
            'count': 1,
            'reset_time': current_time + RATE_LIMIT_DURATION
        }
        return True
    
    client_data = rate_limit_store[client_ip]
    if current_time > client_data['reset_time']:
        # Reset counter if time window has passed
        client_data['count'] = 1
        client_data['reset_time'] = current_time + RATE_LIMIT_DURATION
        return True
    
    if client_data['count'] >= MAX_REQUESTS_PER_HOUR:
        return False
    
    client_data['count'] += 1
    return True

def validate_file(file: UploadFile) -> None:
    """Validate file type and size."""
    # Check file extension
    filename = file.filename or "unknown"
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset file position
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE/1024/1024:.1f}MB"
        )

class DocumentInput(BaseModel):
    texts: List[str]
    metadata: Optional[List[Dict[str, Any]]] = None

class FileUploadResponse(BaseModel):
    filename: str
    status: str
    file_id: str
    chunks_count: int
    collection_name: str
    message: str

class ChunkingParams(BaseModel):
    chunk_size: int = Field(
        default=ChunkingConfig.DEFAULT_CHUNK_SIZE,
        ge=ChunkingConfig.MIN_CHUNK_SIZE,
        le=ChunkingConfig.MAX_CHUNK_SIZE
    )
    chunk_overlap: int = Field(
        default=ChunkingConfig.DEFAULT_CHUNK_OVERLAP,
        ge=ChunkingConfig.MIN_CHUNK_OVERLAP,
        le=ChunkingConfig.MAX_CHUNK_OVERLAP
    )

    @validator('chunk_overlap')
    def validate_overlap(cls, v, values):
        if 'chunk_size' in values and v >= values['chunk_size']:
            raise ValueError('chunk_overlap must be less than chunk_size')
        return v

class CollectionResponse(BaseModel):
    name: str
    vectors_count: int
    status: str

class DocumentInfo(BaseModel):
    doc_id: str
    file_name: str
    document_type: str
    chunk_id: int
    total_chunks: int
    processed_date: str
    file_size: Optional[int] = None
    metadata: Dict[str, Any]

class DocumentSummary(BaseModel):
    total_documents: int
    document_types: Dict[str, int]
    collections: List[str]
    recent_uploads: List[Dict[str, Any]]

# Track document processing status
document_processing_status = {}

# Removed /store endpoint - documents should be uploaded via /upload endpoint

async def calculate_file_hash(file_content: bytes) -> str:
    """Calculate SHA-256 hash of file content."""
    return hashlib.sha256(file_content).hexdigest()

async def check_file_exists(
    db: Session,
    file_name: str,
    file_size: int,
    file_content: bytes,
    metadata: Dict[str, Any]
) -> Optional[Document]:
    """
    Check if file already exists in PostgreSQL based on multiple criteria.
    Returns the existing document if found, None otherwise.
    """
    try:
        # Calculate file hash
        file_hash = await calculate_file_hash(file_content)
        
        # Build complex query to check for duplicates
        query = db.query(Document).filter(
            or_(
                # Check exact file name match
                Document.file_name == file_name,
                # Check display name match
                Document.display_name == file_name,
                # Check content hash match with same file size
                and_(
                    Document.file_hash == file_hash,
                    Document.file_size == file_size
                )
            )
        )
        
        # Add metadata filters if available
        if metadata:
            if reference_number := metadata.get('reference_number'):
                query = query.filter(Document.reference_number == reference_number)
            if document_type := metadata.get('document_type'):
                query = query.filter(Document.document_type == document_type)
            if department := metadata.get('department'):
                query = query.filter(Document.department == department)
        
        existing_doc = query.first()
        
        if existing_doc:
            # Return detailed information about the duplicate
            duplicate_info = {
                'document_id': existing_doc.document_id,
                'file_name': existing_doc.file_name,
                'display_name': existing_doc.display_name,
                'reference_number': existing_doc.reference_number,
                'document_type': getattr(existing_doc.document_type, 'value', None) if existing_doc.document_type else None,  # type: ignore
                'department': getattr(existing_doc.department, 'value', None) if existing_doc.department else None,  # type: ignore
                'upload_date': existing_doc.created_at.isoformat() if getattr(existing_doc, 'created_at', None) else None,
                'match_type': []
            }
            
            # Determine why it's considered a duplicate
            if existing_doc.file_name == file_name:  # type: ignore
                duplicate_info['match_type'].append('file_name')
            if existing_doc.display_name == file_name:  # type: ignore
                duplicate_info['match_type'].append('display_name')
            if existing_doc.file_hash == file_hash and existing_doc.file_size == file_size:  # type: ignore
                duplicate_info['match_type'].append('content')
            if existing_doc.reference_number and existing_doc.reference_number == metadata.get('reference_number'):  # type: ignore
                duplicate_info['match_type'].append('reference_number')
            
            logger.warning(f"Duplicate document found: {duplicate_info}")
            raise HTTPException(
                status_code=409,
                detail={
                    'message': 'Duplicate document found',
                    'existing_document': duplicate_info
                }
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking file existence: {str(e)}")
        return None

@router.post("/upload", response_model=FileUploadResponse)
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    chunk_size: int = Form(ChunkingConfig.DEFAULT_CHUNK_SIZE),
    chunk_overlap: int = Form(ChunkingConfig.DEFAULT_CHUNK_OVERLAP),
    metadata: Optional[str] = Form(None),
    document_processor: DocumentProcessor = Depends(get_document_processor),
    db: Session = Depends(get_db)
):
    """
    Upload a document file (PDF, DOCX, TXT, etc.) for processing and storage.
    The file will be processed with specified chunking parameters and stored in Pinecone.
    """
    try:
        # Check rate limit
        if not check_rate_limit(request):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Validate file
        validate_file(file)
        
        # Read file content for hash calculation
        file_content = await file.read()
        file_size = len(file_content)
        
        # Parse metadata if provided
        try:
            metadata_dict = json.loads(metadata) if metadata else {}
        except json.JSONDecodeError:
            metadata_dict = {}
        
        # Check if file already exists
        if file.filename:
            await check_file_exists(db, file.filename, file_size, file_content, metadata_dict)
        
        # Reset file position for later use
        await file.seek(0)
        
        # Validate chunking parameters
        chunking_params = ChunkingParams(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        # Set upload directory
        upload_dir = os.path.join("data", "uploads")
        temp_dir = os.path.join("data", "temp")
        os.makedirs(upload_dir, exist_ok=True)
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate a unique filename to avoid collisions
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_id = str(uuid.uuid4())[:8]
        original_filename = file.filename or "unknown"
        file_extension = os.path.splitext(original_filename)[1].lower() if original_filename else ".txt"
        safe_filename = f"{timestamp}_{file_id}{file_extension}"
        temp_path = os.path.join(temp_dir, safe_filename)
        final_path = os.path.join(upload_dir, safe_filename)
        
        # Save file to disk for background processing (file object closes after request)
        with open(temp_path, "wb") as f:
            f.write(file_content)
        
        # Initialize status tracking with enhanced metadata
        document_processing_status[file_id] = {
            "status": "processing",
            "filename": original_filename,
            "start_time": datetime.now().isoformat(),
            "chunks_count": 0,
            "collection_name": CollectionConfig.STORAGE_NAME,
            "file_size": file_size,
            "file_extension": file_extension,
            "upload_timestamp": timestamp,
        }
        
        # Process document in background - pass file path instead of file object
        background_tasks.add_task(
            process_and_store_document,
            file_path=temp_path,
            original_filename=original_filename,
            file_id=file_id,
            document_processor=document_processor,
            custom_metadata=metadata_dict
        )
        
        return FileUploadResponse(
            filename=original_filename,
            status="processing",
            file_id=file_id,
            chunks_count=0,
            collection_name=CollectionConfig.STORAGE_NAME,
            message=f"File uploaded successfully. Processing started in the background."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        # Ensure temp files are cleaned up
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        if 'final_path' in locals() and os.path.exists(final_path):
            os.remove(final_path)
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("/status/{file_id}")
async def get_document_status(file_id: str) -> Dict[str, Any]:
    """Get the status of document processing for a given file ID."""
    if file_id not in document_processing_status:
        raise HTTPException(status_code=404, detail=f"No document found with ID: {file_id}")
    
    return document_processing_status[file_id]

# /documents endpoint removed - use /postgresql/documents instead for document listing

async def process_and_store_document(
    file_path: str,
    original_filename: str,
    file_id: str,
    document_processor: DocumentProcessor,
    custom_metadata: Dict[str, Any]
):
    """
    Process a document and store it in Pinecone.
    This function is meant to be run in the background.
    Reads from saved file path instead of UploadFile object.
    """
    try:
        logger.info(f"Processing document: {original_filename}")
        
        # Process and upload file to Pinecone from file path
        # This handles: extract text → chunk → format → Pinecone auto-embed → store
        result = await document_processor.process_and_upload_file_from_path(
            file_path=file_path,
            original_filename=original_filename,
            namespace=CollectionConfig.STORAGE_NAME,
            additional_metadata={"file_id": file_id, **custom_metadata}
        )
        
        if result.get("status") == "success":
            chunks_count = result.get("chunks_count", 0)
            logger.info(f"Successfully stored {chunks_count} chunks from {original_filename}")
            document_processing_status[file_id].update({
                "status": "completed",
                "chunks_count": chunks_count,
                "end_time": datetime.now().isoformat(),
                "collection_name": CollectionConfig.STORAGE_NAME,
                "document_id": result.get("document_id")
            })
        else:
            error_msg = result.get("error", "Unknown error")
            logger.error(f"Failed to process {original_filename}: {error_msg}")
            document_processing_status[file_id].update({
                "status": "failed",
                "error": error_msg
            })
            
    except Exception as e:
        logger.error(f"Error processing document {original_filename}: {str(e)}")
        document_processing_status[file_id].update({
            "status": "failed",
            "error": str(e)
        })
    finally:
        # Move file from temp to uploads folder for permanent storage
        if os.path.exists(file_path):
            try:
                upload_dir = os.path.join("data", "uploads")
                os.makedirs(upload_dir, exist_ok=True)
                
                # Generate filename for permanent storage
                filename = os.path.basename(file_path)
                final_path = os.path.join(upload_dir, filename)
                
                # Move file to uploads
                shutil.move(file_path, final_path)
                logger.info(f"Moved file to permanent storage: {final_path}")
            except Exception as e:
                logger.warning(f"Failed to move temp file to uploads: {e}")
                # Clean up temp file if move fails
                try:
                    os.remove(file_path)
                except:
                    pass

# Collection endpoints removed - Pinecone uses single index with namespaces

@router.get("/summary", response_model=DocumentSummary)
async def get_documents_summary(
    db: Session = Depends(get_db)
) -> DocumentSummary:
    """Get a summary of documents in the system from PostgreSQL."""
    try:
        # Get recent uploads from processing status
        recent_uploads = []
        for file_id, status in document_processing_status.items():
            recent_uploads.append({
                "file_id": file_id,
                "file_name": status.get("filename", ""),
                "status": status.get("status", ""),
                "upload_time": status.get("start_time", ""),
                "chunks_count": status.get("chunks_count", 0),
                "collection": status.get("collection_name", "")
            })
        
        # Sort by upload time (most recent first)
        recent_uploads.sort(key=lambda x: x.get("upload_time", ""), reverse=True)
        recent_uploads = recent_uploads[:10]  # Show only the 10 most recent
        
        # Get document statistics from PostgreSQL
        all_docs = db.query(Document).all()
        
        document_types = {}
        for doc in all_docs:
            doc_type = getattr(doc.document_type, 'value', str(doc.document_type)) if doc.document_type else "unknown"  # type: ignore
            if doc_type in document_types:
                document_types[doc_type] += 1
            else:
                document_types[doc_type] = 1
        
        return DocumentSummary(
            total_documents=len(all_docs),
            document_types=document_types,
            collections=[CollectionConfig.STORAGE_NAME],  # Single collection in Pinecone
            recent_uploads=recent_uploads
        )
    except Exception as e:
        logger.error(f"Error generating document summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating document summary: {str(e)}")

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    pinecone_service: PineconeService = Depends(get_pinecone_service),
    db: Session = Depends(get_db)
):
    """Delete a specific document and all its chunks from Pinecone and PostgreSQL."""
    try:
        # First, get document metadata from PostgreSQL to find point range
        db_doc = db.query(Document).filter(Document.document_id == document_id).first()
        
        if not db_doc:
            raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
        
        # Build list of IDs to delete from Pinecone (document_id-chunk_0, document_id-chunk_1, etc.)
        if db_doc.point_start is not None and db_doc.point_end is not None:
            ids_to_delete = [f"{document_id}-chunk_{i}" for i in range(int(db_doc.point_start), int(db_doc.point_end) + 1)]  # type: ignore
            
            # Delete from Pinecone
            pinecone_service.delete_vectors(
                ids=ids_to_delete,
                namespace=CollectionConfig.STORAGE_NAME
            )
            logger.info(f"Deleted {len(ids_to_delete)} vectors from Pinecone")
        else:
            logger.warning(f"No point range found for document {document_id}, skipping Pinecone deletion")
        
        # Delete from PostgreSQL
        db.delete(db_doc)
        db.commit()
        logger.info(f"Deleted document {document_id} from PostgreSQL")
        
        return {
            "status": "success",
            "message": f"Document {document_id} successfully deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class PostgreSQLDocument(BaseModel):
    id: int
    document_id: str
    display_name: str
    file_name: str
    file_type: str
    document_type: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    reference_number: Optional[str] = None
    impact_date: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    total_chunks: Optional[int] = None
    point_start: Optional[int] = None
    point_end: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    created_by: Optional[int] = None
    file_hash: Optional[str] = None
    file_size: Optional[int] = None

    class Config:
        from_attributes = True  # This enables ORM mode

class PostgreSQLDocumentResponse(BaseModel):
    total: int
    items: List[PostgreSQLDocument]

@router.get("/postgresql/documents", response_model=PostgreSQLDocumentResponse)
async def get_postgresql_documents(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    document_type: Optional[str] = None,
    department: Optional[str] = None
) -> PostgreSQLDocumentResponse:
    """Get documents from PostgreSQL with optional filtering."""
    try:
        # Build query
        query = db.query(Document)
        
        # Apply filters if provided and not empty strings
        if document_type and document_type.strip():
            query = query.filter(Document.document_type == document_type)
        if department and department.strip():
            query = query.filter(Document.department == department)
            
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute query
        documents = query.all()
        
        # Convert to dict and handle datetime serialization
        result = []
        for doc in documents:
            doc_dict = {
                "id": doc.id,
                "document_id": doc.document_id,
                "display_name": doc.display_name,
                "file_name": doc.file_name,
                "file_type": doc.file_type,
                "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else doc.document_type,
                "department": doc.department.value if hasattr(doc.department, 'value') else doc.department,
                "description": doc.description,
                "reference_number": doc.reference_number,
                "impact_date": doc.impact_date.isoformat() if getattr(doc, 'impact_date', None) else None,
                "effective_date": doc.effective_date.isoformat() if getattr(doc, 'effective_date', None) else None,
                "expiry_date": doc.expiry_date.isoformat() if getattr(doc, 'expiry_date', None) else None,
                "total_chunks": doc.total_chunks,
                "point_start": doc.point_start,
                "point_end": doc.point_end,
                "created_at": doc.created_at.isoformat() if getattr(doc, 'created_at', None) else None,
                "updated_at": doc.updated_at.isoformat() if getattr(doc, 'updated_at', None) else None,
                "created_by": doc.created_by,
                "file_hash": doc.file_hash,
                "file_size": doc.file_size
            }
            result.append(doc_dict)
            
        return PostgreSQLDocumentResponse(
            total=total_count,
            items=result
        )
        
    except Exception as e:
        logger.error(f"Error getting documents from PostgreSQL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 