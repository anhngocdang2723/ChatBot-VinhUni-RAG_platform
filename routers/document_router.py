from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks, Query, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator
from core.document_processing.vector_store import VectorStore
from core.document_processing.document_processor import DocumentProcessor
from core.utils.dependencies import get_vector_store
from core.llm.config import settings, ChunkingConfig
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

def check_rate_limit(request: Request) -> bool:
    """Check if request is within rate limits."""
    client_ip = request.client.host
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
    file_ext = os.path.splitext(file.filename)[1].lower()
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
    metadata: List[Dict[str, Any]] = None

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

@router.post("/store")
async def store_documents(
    doc_input: DocumentInput,
    vector_store: VectorStore = Depends(get_vector_store)
) -> Dict[str, Any]:
    """Store documents in the vector database."""
    try:
        logger.info(f"Storing {len(doc_input.texts)} documents")
        success = vector_store.store_documents(
            texts=doc_input.texts,
            metadata_list=doc_input.metadata
        )
        if not success:
            logger.error("Failed to store documents")
            raise HTTPException(status_code=500, detail="Failed to store documents")
        logger.info("Documents stored successfully")
        return {"status": "success", "message": f"Stored {len(doc_input.texts)} documents"}
    except Exception as e:
        logger.error(f"Error storing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error storing documents: {str(e)}")

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
                'document_type': existing_doc.document_type.value if existing_doc.document_type else None,
                'department': existing_doc.department.value if existing_doc.department else None,
                'upload_date': existing_doc.created_at.isoformat() if existing_doc.created_at else None,
                'match_type': []
            }
            
            # Determine why it's considered a duplicate
            if existing_doc.file_name == file_name:
                duplicate_info['match_type'].append('file_name')
            if existing_doc.display_name == file_name:
                duplicate_info['match_type'].append('display_name')
            if existing_doc.file_hash == file_hash and existing_doc.file_size == file_size:
                duplicate_info['match_type'].append('content')
            if existing_doc.reference_number and existing_doc.reference_number == metadata.get('reference_number'):
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
    vector_store: VectorStore = Depends(get_vector_store),
    db: Session = Depends(get_db)
):
    """
    Upload a document file (PDF, DOCX, TXT, etc.) for processing and storage.
    The file will be processed with specified chunking parameters and stored in vector db.
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
        original_filename = file.filename
        file_extension = os.path.splitext(original_filename)[1].lower()
        safe_filename = f"{timestamp}_{file_id}{file_extension}"
        temp_path = os.path.join(temp_dir, safe_filename)
        final_path = os.path.join(upload_dir, safe_filename)
        
        # Save uploaded file to temp location first
        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Move to final location if save was successful
            shutil.move(temp_path, final_path)
        except Exception as e:
            # Clean up temp file if it exists
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )

        # Always use the fixed collection from settings
        success = vector_store.switch_collection(settings.collection_config.STORAGE_NAME)
        if not success:
            # Clean up saved file
            if os.path.exists(final_path):
                os.remove(final_path)
            raise HTTPException(status_code=500, detail="Failed to switch to main collection")
            
        current_collection = vector_store.current_collection
        
        # Initialize document processor with validated chunking parameters
        document_processor = DocumentProcessor(
            chunk_size=chunking_params.chunk_size,
            chunk_overlap=chunking_params.chunk_overlap,
            upload_dir=upload_dir
        )
        
        # Initialize status tracking with enhanced metadata
        document_processing_status[file_id] = {
            "status": "processing",
            "filename": original_filename,
            "start_time": datetime.now().isoformat(),
            "chunks_count": 0,
            "collection_name": current_collection,
            "file_path": final_path,
            "file_size": file_size,
            "file_extension": file_extension,
            "upload_timestamp": timestamp,
        }
        
        # Process document in background
        background_tasks.add_task(
            process_and_store_document,
            file_path=final_path,
            original_filename=original_filename,
            file_id=file_id,
            vector_store=vector_store,
            document_processor=document_processor,
            metadata=document_processing_status[file_id]
        )
        
        return FileUploadResponse(
            filename=original_filename,
            status="processing",
            file_id=file_id,
            chunks_count=0,
            collection_name=current_collection,
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

@router.get("/documents", response_model=List[DocumentInfo])
async def get_documents(
    file_name: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    file_id: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[DocumentInfo]:
    """Get list of documents with optional filtering."""
    try:
        # Build metadata filter
        metadata_filter = {}
        if file_name:
            metadata_filter["file_name"] = file_name
        if document_type:
            metadata_filter["document_type"] = document_type
        if file_id:
            metadata_filter["file_id"] = file_id
            
        # Search for documents
        documents = vector_store.search_by_metadata(
            metadata_filter=metadata_filter,
            limit=limit,
            offset=offset
        )
        
        # Convert to DocumentInfo objects
        document_infos = []
        for doc in documents:
            try:
                document_infos.append(DocumentInfo(
                    doc_id=doc.get("doc_id", ""),
                    file_name=doc.get("file_name", ""),
                    document_type=doc.get("document_type", ""),
                    chunk_id=doc.get("chunk_id", 0),
                    total_chunks=doc.get("total_chunks", 0),
                    processed_date=doc.get("processed_date", ""),
                    file_size=doc.get("file_size", 0),
                    metadata=doc
                ))
            except Exception as e:
                logger.warning(f"Error converting document to DocumentInfo: {str(e)}")
                
        return document_infos
        
    except Exception as e:
        logger.error(f"Error retrieving documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")

async def process_and_store_document(
    file_path: str,
    original_filename: str,
    file_id: str,
    vector_store: VectorStore,
    document_processor: DocumentProcessor,
    metadata: Dict[str, Any]
):
    """
    Process a document and store it in the vector database.
    This function is meant to be run in the background.
    """
    try:
        logger.info(f"Processing document: {original_filename}")
        
        # Process the file
        chunks, metadata_list = document_processor.process_file(file_path)
        
        if not chunks:
            logger.error(f"No text extracted from {original_filename}")
            document_processing_status[file_id]["status"] = "failed"
            document_processing_status[file_id]["error"] = "No text could be extracted from the document"
            return
        
        # Get file info for metadata
        file_info = os.stat(file_path)
        file_size = file_info.st_size
        file_extension = os.path.splitext(original_filename)[1].lower()
        document_type = file_extension.lstrip(".")
        creation_time = datetime.now().isoformat()
        collection_name = vector_store.current_collection
        
        # Add enhanced metadata to each chunk
        for i, metadata in enumerate(metadata_list):
            metadata.update({
                "original_filename": original_filename,
                "processed_date": creation_time,
                "file_id": file_id,
                "document_type": document_type,
                "file_size": file_size,
                "chunk_id": i,
                "total_chunks": len(chunks),
                "collection_name": collection_name,
                "creation_time": creation_time,
                "last_updated": creation_time,
                # Add additional metadata that helps with multi-collection RAG queries
                "source_collection": collection_name,
                "file_basename": os.path.splitext(original_filename)[0],
                **metadata  # Include provided metadata
            })
        
        # Store the chunks in the vector database
        success = vector_store.store_documents(
            collection_name=collection_name,
            texts=chunks,
            metadata_list=metadata_list
        )
        
        if success:
            logger.info(f"Successfully stored {len(chunks)} chunks from {original_filename} in collection '{collection_name}'")
            document_processing_status[file_id].update({
                "status": "completed",
                "chunks_count": len(chunks),
                "end_time": datetime.now().isoformat(),
                "collection_name": collection_name
            })
        else:
            logger.error(f"Failed to store chunks from {original_filename}")
            document_processing_status[file_id].update({
                "status": "failed",
                "error": "Failed to store document chunks in the vector database"
            })
            
    except Exception as e:
        logger.error(f"Error processing document {original_filename}: {str(e)}")
        document_processing_status[file_id].update({
            "status": "failed",
            "error": str(e)
        })

@router.get("/collections")
async def list_collections(
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[CollectionResponse]:
    """List all available collections."""
    collections = vector_store.list_collections()
    return [CollectionResponse(**col) for col in collections]

@router.post("/collections/{collection_name}/switch")
async def switch_collection(
    collection_name: str,
    vector_store: VectorStore = Depends(get_vector_store)
) -> Dict[str, str]:
    """Switch to a different collection."""
    success = vector_store.switch_collection(collection_name)
    if not success:
        raise HTTPException(status_code=404, detail=f"Collection {collection_name} not found")
    return {"status": "success", "message": f"Switched to collection: {collection_name}"}

@router.delete("/collections/{collection_name}")
async def delete_collection(
    collection_name: str,
    vector_store: VectorStore = Depends(get_vector_store)
) -> Dict[str, str]:
    """Delete a collection."""
    success = vector_store.delete_collection(collection_name)
    if not success:
        raise HTTPException(status_code=404, detail=f"Collection {collection_name} not found")
    return {"status": "success", "message": f"Deleted collection: {collection_name}"}

@router.get("/summary", response_model=DocumentSummary)
async def get_documents_summary(
    vector_store: VectorStore = Depends(get_vector_store)
) -> DocumentSummary:
    """Get a summary of documents in the system."""
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
        
        # Get collection information
        collections = vector_store.list_collections()
        collection_names = [col["name"] for col in collections]
        
        # Get document type statistics by querying with empty filter
        # This is a simplified approach, a more optimized approach would use
        # aggregation queries if supported by the vector DB
        all_docs = vector_store.search_by_metadata({}, limit=1000)
        
        document_types = {}
        for doc in all_docs:
            doc_type = doc.get("document_type", "unknown")
            if doc_type in document_types:
                document_types[doc_type] += 1
            else:
                document_types[doc_type] = 1
        
        return DocumentSummary(
            total_documents=len(all_docs),
            document_types=document_types,
            collections=collection_names,
            recent_uploads=recent_uploads
        )
    except Exception as e:
        logger.error(f"Error generating document summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating document summary: {str(e)}")

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    vector_store: VectorStore = Depends(get_vector_store)
):
    """Delete a specific document and all its chunks."""
    try:
        # Always use the fixed collection
        success = vector_store.switch_collection(settings.collection_config.STORAGE_NAME)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to switch to main collection")
            
        # Delete all points with this document_id
        success = vector_store.delete_document_points(document_id)
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to delete document {document_id}")
            
        return {
            "status": "success",
            "message": f"Document {document_id} successfully deleted"
        }
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
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
                "impact_date": doc.impact_date.isoformat() if doc.impact_date else None,
                "effective_date": doc.effective_date.isoformat() if doc.effective_date else None,
                "expiry_date": doc.expiry_date.isoformat() if doc.expiry_date else None,
                "total_chunks": doc.total_chunks,
                "point_start": doc.point_start,
                "point_end": doc.point_end,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
                "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
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