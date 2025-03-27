from fastapi import APIRouter, HTTPException, Depends, Query as QueryParam
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel
from core.retriever import Retriever
from core.llm_interface import RAGPromptManager, create_llm_provider
from core.dependencies import get_retriever, get_prompt_manager, get_vector_store
from core.vector_store import VectorStore

router = APIRouter()

class QueryInput(BaseModel):
    query: str
    top_k: int = 15
    top_n: int = 5
    temperature: float = 0.1
    max_tokens: int = 500
    collection_names: Optional[List[str]] = None

class CollectionQueryInput(BaseModel):
    query: str
    collection_name: str
    top_k: int = 15
    top_n: int = 5
    
class MultiCollectionQueryInput(BaseModel):
    query: str
    collection_names: List[str]
    top_k: int = 15 
    top_n: int = 5
    merge_strategy: str = "score"  # Options: "score", "round_robin"
    
class SourceMetadata(BaseModel):
    filename: str
    chunk_id: Optional[int] = None
    collection: str
    score: float
    document_type: Optional[str] = None
    
class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    
class CollectionSummary(BaseModel):
    name: str
    document_count: int
    document_types: Dict[str, int]

@router.post("/rag")
async def query_rag(
    query_input: QueryInput,
    retriever: Retriever = Depends(get_retriever),
    prompt_manager: RAGPromptManager = Depends(get_prompt_manager)
) -> QueryResponse:
    """
    Process a RAG query:
    1. Retrieve relevant documents
    2. Rerank documents
    3. Generate answer using LLM
    """
    # Get relevant documents (optionally from multiple collections)
    documents = retriever.query(
        query=query_input.query,
        top_k=query_input.top_k,
        top_n=query_input.top_n,
        collection_names=query_input.collection_names
    )
    
    if not documents:
        return QueryResponse(
            answer="No relevant documents found for your query.",
            sources=[]
        )
    
    # Generate answer using LLM
    result = prompt_manager.generate_answer(
        query=query_input.query,
        documents=documents,
        temperature=query_input.temperature,
        max_tokens=query_input.max_tokens
    )
    
    # Enhance source information
    sources = result.get("sources", [])
    for source in sources:
        if "metadata" in source:
            metadata = source["metadata"]
            # Add the collection name to the source for clarity
            source["collection"] = metadata.get("source_collection", metadata.get("collection_name", "unknown"))
    
    return QueryResponse(**result)

@router.post("/retrieve")
async def retrieve_documents(
    query_input: QueryInput,
    retriever: Retriever = Depends(get_retriever)
) -> Dict[str, Any]:
    """Retrieve and rerank documents without LLM generation."""
    documents = retriever.query(
        query=query_input.query,
        top_k=query_input.top_k,
        top_n=query_input.top_n,
        collection_names=query_input.collection_names
    )
    
    # Format the response
    formatted_docs = []
    for doc in documents:
        # Extract key metadata for display
        metadata = doc.get("metadata", {})
        source = {
            "text": doc.get("text", ""),
            "score": doc.get("score", 0.0),
            "collection": metadata.get("source_collection", metadata.get("collection_name", "unknown")),
            "filename": metadata.get("original_filename", "unknown"),
            "chunk_id": metadata.get("chunk_id", 0),
            "document_type": metadata.get("document_type", "unknown"),
        }
        formatted_docs.append(source)
    
    return {
        "query": query_input.query,
        "collections_searched": query_input.collection_names,
        "documents": formatted_docs
    }

@router.get("/collections/available")
async def list_available_collections(
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[CollectionSummary]:
    """List all available collections for querying with document counts."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Get collections directly from vector store
        logger.info("Retrieving collections list from vector store")
        collections = vector_store.list_collections()
        logger.info(f"Found {len(collections)} collections in vector store")
        
        # If no collections found, return empty list with debug info
        if not collections:
            logger.warning("No collections found in the vector store")
            return []
            
        # Get document counts for each collection
        original_collection = vector_store.collection_name
        collection_summaries = []
        
        for collection in collections:
            collection_name = collection["name"]
            logger.info(f"Processing collection: {collection_name}")
            
            try:
                # Switch to collection to get documents
                success = vector_store.switch_collection(collection_name)
                if not success:
                    logger.warning(f"Failed to switch to collection {collection_name}, skipping")
                    continue
                
                try:
                    # Get document counts by type - use direct count if possible
                    if "points_count" in collection:
                        points_count = collection["points_count"]
                        logger.info(f"Collection {collection_name} has {points_count} points (from metadata)")
                        collection_summaries.append(
                            CollectionSummary(
                                name=collection_name,
                                document_count=points_count,
                                document_types={"unknown": points_count}
                            )
                        )
                    else:
                        # Fall back to searching for documents
                        docs = []
                        try:
                            docs = vector_store.search_by_metadata({}, limit=1000)
                            logger.info(f"Retrieved {len(docs)} documents from collection {collection_name}")
                        except Exception as search_e:
                            logger.error(f"Error getting documents from {collection_name}: {str(search_e)}")
                            docs = []
                        
                        # Count document types
                        doc_ids = set()
                        doc_types = {}
                        
                        for doc in docs:
                            metadata = doc.get("metadata", {})
                            doc_id = metadata.get("file_id")
                            if doc_id:
                                doc_ids.add(doc_id)
                            
                            doc_type = metadata.get("document_type", "unknown")
                            doc_types[doc_type] = doc_types.get(doc_type, 0) + 1
                        
                        collection_summaries.append(
                            CollectionSummary(
                                name=collection_name,
                                document_count=len(doc_ids) if doc_ids else len(docs),
                                document_types=doc_types if doc_types else {"unknown": len(docs)}
                            )
                        )
                except Exception as count_e:
                    logger.error(f"Error getting document counts for {collection_name}: {str(count_e)}")
                    # Still include the collection with zero counts
                    collection_summaries.append(
                        CollectionSummary(
                            name=collection_name,
                            document_count=0,
                            document_types={}
                        )
                    )
            except Exception as e:
                logger.error(f"Error processing collection {collection_name}: {str(e)}")
                # Include the collection with error status
                collection_summaries.append(
                    CollectionSummary(
                        name=collection_name,
                        document_count=-1,  # Indicate error
                        document_types={"error": 1}
                    )
                )
        
        # Switch back to original collection
        vector_store.switch_collection(original_collection)
        logger.info(f"Returning {len(collection_summaries)} collection summaries")
        
        return collection_summaries
    except Exception as e:
        logger.error(f"Error listing available collections: {str(e)}")
        return []

@router.post("/multi-collection")
async def query_multiple_collections(
    query_input: MultiCollectionQueryInput,
    retriever: Retriever = Depends(get_retriever)
) -> Dict[str, Any]:
    """
    Query multiple collections and return combined results.
    This endpoint allows specifying how results should be merged from different collections.
    """
    # Validate that collections exist
    vector_store = retriever.vector_store
    available_collections = [c["name"] for c in vector_store.list_collections()]
    
    # Filter out collections that don't exist
    valid_collections = [c for c in query_input.collection_names if c in available_collections]
    
    if not valid_collections:
        return {
            "query": query_input.query,
            "error": "None of the specified collections exist",
            "documents": []
        }
    
    # Get search results from each collection
    documents = retriever.query(
        query=query_input.query,
        top_k=query_input.top_k,
        top_n=query_input.top_n,
        collection_names=valid_collections
    )
    
    # Format the response with collection information
    formatted_docs = []
    for doc in documents:
        metadata = doc.get("metadata", {})
        source = {
            "text": doc.get("text", ""),
            "score": doc.get("score", 0.0),
            "collection": metadata.get("source_collection", metadata.get("collection_name", "unknown")),
            "filename": metadata.get("original_filename", "unknown"),
            "chunk_id": metadata.get("chunk_id", 0),
            "document_type": metadata.get("document_type", "unknown"),
        }
        formatted_docs.append(source)
    
    return {
        "query": query_input.query,
        "collections_searched": valid_collections,
        "merge_strategy": query_input.merge_strategy,
        "documents": formatted_docs
    }

@router.get("/collections/raw")
async def list_raw_collections(
    vector_store: VectorStore = Depends(get_vector_store)
) -> List[Dict[str, Any]]:
    """
    Get raw list of collections without additional processing or metadata.
    This is a simpler endpoint that just returns what Qdrant reports.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Directly get collections from vector store
        collections = vector_store.list_collections()
        logger.info(f"Found {len(collections)} raw collections")
        
        # Return the raw collection data
        return collections
    except Exception as e:
        logger.error(f"Error listing raw collections: {str(e)}")
        return [] 