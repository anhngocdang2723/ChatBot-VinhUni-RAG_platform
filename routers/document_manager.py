from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from core.vector_store import VectorStore
from core.dependencies import get_vector_store
import logging
import os
import shutil
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class CollectionInfo(BaseModel):
    name: str
    status: str = "active"  # Default status
    document_count: Optional[int] = 0
    document_types: Optional[Dict[str, int]] = None
    creation_date: Optional[str] = None

class DocumentCount(BaseModel):
    collection_name: str
    count: int
    document_types: Dict[str, int]

class DocumentDeleteResponse(BaseModel):
    success: bool
    deleted_count: int
    message: str

class CollectionStats(BaseModel):
    total_collections: int
    total_documents: int
    collections: List[CollectionInfo]

@router.get("/collections", response_model=List[CollectionInfo])
async def list_collections(
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[CollectionInfo]:
    """Get basic information about all available collections."""
    try:
        # Get basic collection info
        collections = vector_store.list_collections()
        
        # Convert to CollectionInfo format
        enhanced_collections = [
            CollectionInfo(
                name=collection['name'],
                creation_date=datetime.now().isoformat()  # This is an approximation
            )
            for collection in collections
        ]
        
        return enhanced_collections
    except Exception as e:
        logger.error(f"Error listing collections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing collections: {str(e)}")

@router.get("/collections/{collection_name}", response_model=CollectionInfo)
async def get_collection_info(
    collection_name: str,
    vector_store: VectorStore = Depends(get_vector_store)
) -> CollectionInfo:
    """Get detailed information about a specific collection."""
    try:
        # Get all collections
        collections = vector_store.list_collections()
        
        # Find the requested collection
        collection_info = next((c for c in collections if c['name'] == collection_name), None)
        
        if not collection_info:
            raise HTTPException(status_code=404, detail=f"Collection {collection_name} not found")
        
        return CollectionInfo(
            name=collection_info['name'],
            status="active",
            creation_date=datetime.now().isoformat(),
            document_count=0,  # We can add document counting later if needed
            document_types=None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting collection info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting collection info: {str(e)}")

@router.post("/collections/{collection_name}/rename")
async def rename_collection(
    collection_name: str,
    new_name: str,
    vector_store: VectorStore = Depends(get_vector_store)
) -> Dict[str, str]:
    """Rename a collection."""
    try:
        # Check if source collection exists
        collections = vector_store.list_collections()
        if not any(c['name'] == collection_name for c in collections):
            raise HTTPException(status_code=404, detail=f"Collection {collection_name} not found")
            
        # Check if target name already exists
        if any(c['name'] == new_name for c in collections):
            raise HTTPException(status_code=400, detail=f"Collection {new_name} already exists")
        
        # Rename collection (implementation depends on vector store capabilities)
        success = vector_store.rename_collection(collection_name, new_name)
        
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to rename collection {collection_name}")
            
        return {
            "message": f"Collection {collection_name} successfully renamed to {new_name}",
            "old_name": collection_name,
            "new_name": new_name
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renaming collection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error renaming collection: {str(e)}")

@router.delete("/collections/{collection_name}")
async def delete_collection(
    collection_name: str,
    vector_store: VectorStore = Depends(get_vector_store)
) -> Dict[str, str]:
    """Delete a collection."""
    try:
        success = vector_store.delete_collection(collection_name)
        
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to delete collection {collection_name}")
            
        return {
            "message": f"Collection {collection_name} successfully deleted"
        }
    except Exception as e:
        logger.error(f"Error deleting collection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting collection: {str(e)}")

@router.delete("/documents")
async def delete_documents(
    file_id: Optional[str] = Query(None),
    collection_name: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    vector_store: VectorStore = Depends(get_vector_store)
) -> DocumentDeleteResponse:
    """
    Delete documents based on filter criteria.
    At least one filter parameter must be provided.
    """
    try:
        # Ensure at least one filter is provided
        if not file_id and not collection_name and not document_type:
            raise HTTPException(
                status_code=400, 
                detail="At least one filter (file_id, collection_name, or document_type) must be provided"
            )
        
        # Build filter
        metadata_filter = {}
        if file_id:
            metadata_filter["file_id"] = file_id
        if document_type:
            metadata_filter["document_type"] = document_type
            
        # If collection_name is provided, switch to that collection
        original_collection = None
        if collection_name:
            original_collection = vector_store.collection_name
            success = vector_store.switch_collection(collection_name)
            if not success:
                raise HTTPException(status_code=404, detail=f"Collection {collection_name} not found")
        
        # Delete documents matching the filter
        deleted_count = vector_store.delete_by_metadata(metadata_filter)
        
        # Switch back to original collection if needed
        if original_collection:
            vector_store.switch_collection(original_collection)
            
        return DocumentDeleteResponse(
            success=True,
            deleted_count=deleted_count,
            message=f"Successfully deleted {deleted_count} documents"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting documents: {str(e)}")

@router.get("/stats", response_model=CollectionStats)
async def get_collection_stats(
    vector_store: VectorStore = Depends(get_vector_store)
) -> CollectionStats:
    """Get aggregate statistics about all collections."""
    try:
        collections_info = await list_collections(vector_store)
        
        total_collections = len(collections_info)
        total_documents = sum(c.document_count or 0 for c in collections_info)
        
        return CollectionStats(
            total_collections=total_collections,
            total_documents=total_documents,
            collections=collections_info
        )
    except Exception as e:
        logger.error(f"Error getting collection stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting collection stats: {str(e)}") 