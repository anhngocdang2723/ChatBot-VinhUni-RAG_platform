from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from core.vector_store import VectorStore
from core.document_processor import DocumentProcessor
from core.dependencies import get_vector_store
import logging
import os
import shutil
from datetime import datetime
import uuid

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

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

class ChunkingConfig(BaseModel):
    chunk_size: int = 1000
    chunk_overlap: int = 200

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

@router.post("/upload", response_model=FileUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
    collection_name: Optional[str] = Form(None),
    vector_store: VectorStore = Depends(get_vector_store)
):
    """
    Upload a document file (PDF, DOCX, TXT, etc.) for processing and storage.
    The file will be processed with specified chunking parameters and stored in vector db.
    Each file will be stored in its own Qdrant collection named after the file for multi-collection RAG support.
    """
    try:
        # Set upload directory
        upload_dir = "data/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate a unique filename to avoid collisions
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_id = str(uuid.uuid4())[:8]
        original_filename = file.filename
        file_extension = os.path.splitext(original_filename)[1].lower()
        safe_filename = f"{timestamp}_{file_id}{file_extension}"
        file_path = os.path.join(upload_dir, safe_filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate collection name based on the filename (without extension)
        if not collection_name:
            base_filename = os.path.splitext(original_filename)[0]
            # Ensure the collection name is valid for Qdrant (only alphanumeric, hyphens, and underscores)
            collection_name = "".join(c if c.isalnum() or c in ['-', '_'] else '_' for c in base_filename)
            # Add timestamp to ensure uniqueness
            collection_name = f"{collection_name}_{timestamp}"
            # Limit length to avoid potential issues with Qdrant
            collection_name = collection_name[:40]  # Qdrant has a length limit
        
        # Create or switch to the collection in Qdrant
        success = vector_store.switch_collection(collection_name)
        if not success:
            logger.error(f"Failed to create/switch to collection: {collection_name}")
            raise HTTPException(status_code=500, detail=f"Failed to create collection: {collection_name}")
            
        current_collection = vector_store.current_collection
        
        # Initialize document processor
        document_processor = DocumentProcessor(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            upload_dir=upload_dir
        )
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Initialize status tracking with enhanced metadata
        document_processing_status[file_id] = {
            "status": "processing",
            "filename": original_filename,
            "start_time": datetime.now().isoformat(),
            "chunks_count": 0,
            "collection_name": current_collection,
            "file_path": file_path,
            "file_size": file_size,
            "file_extension": file_extension,
            "upload_timestamp": timestamp
        }
        
        # Process document in background
        background_tasks.add_task(
            process_and_store_document,
            file_path=file_path,
            original_filename=original_filename,
            file_id=file_id,
            vector_store=vector_store,
            document_processor=document_processor
        )
        
        return FileUploadResponse(
            filename=original_filename,
            status="processing",
            file_id=file_id,
            chunks_count=0,  # Will be updated after processing
            collection_name=current_collection,
            message=f"File uploaded successfully. Processing started in the background. Collection: {current_collection}"
        )
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
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
    document_processor: DocumentProcessor
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
                "file_basename": os.path.splitext(original_filename)[0]
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