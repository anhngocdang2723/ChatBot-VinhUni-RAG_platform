"""
Query Service - Handles hybrid search and retrieval from Pinecone.
Integrates query processing with Pinecone's hybrid search and reranking.
"""

import logging
from typing import List, Dict, Any, Optional

from core.pinecone.pinecone_service import PineconeService
from core.document_processing.query_processor import QueryProcessor

logger = logging.getLogger(__name__)

class QueryService:
    """
    Service for processing queries and retrieving relevant documents.
    Uses Pinecone's hybrid search (dense + sparse) with reranking.
    """
    
    def __init__(self, pinecone_service: PineconeService):
        """
        Initialize Query Service.
        
        Args:
            pinecone_service: Pinecone service instance
        """
        self.pinecone_service = pinecone_service
        logger.info("QueryService initialized")
    
    def query(
        self,
        query: str,
        top_k: int = 15,
        top_n: int = 5,
        namespace: str = "default",
        metadata_filter: Optional[Dict[str, Any]] = None,
        use_reranking: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Process a query and retrieve relevant documents.
        
        Args:
            query: User's question
            top_k: Number of results from each index (dense/sparse)
            top_n: Final number of results after reranking
            namespace: Pinecone namespace to search
            metadata_filter: Optional metadata filters
            use_reranking: Whether to use reranking
            
        Returns:
            List of relevant documents with scores and metadata
        """
        try:
            # Preprocess query
            processed_query = QueryProcessor.clean_query(query)
            logger.info(f"Original query: {query}")
            logger.info(f"Processed query: {processed_query}")
            
            # Perform hybrid search
            search_results = self.pinecone_service.hybrid_search(
                query=processed_query,
                top_k=top_k,
                namespace=namespace,
                metadata_filter=metadata_filter
            )
            
            if not search_results:
                logger.warning("No results found from hybrid search")
                return []
            
            # Optionally rerank results
            if use_reranking and len(search_results) > 0:
                reranked_results = self.pinecone_service.rerank_results(
                    query=processed_query,
                    results=search_results,
                    top_n=top_n
                )
                
                # Format reranked results
                documents = self._format_reranked_results(reranked_results)
            else:
                # Format search results without reranking
                documents = self._format_search_results(search_results[:top_n])
            
            logger.info(f"Retrieved {len(documents)} documents for query")
            return documents
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            raise
    
    def _format_reranked_results(
        self,
        reranked_results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Format reranked results from Pinecone v7.
        
        Args:
            reranked_results: Results from Pinecone reranker (already dict format from PineconeService)
            
        Returns:
            Formatted documents
        """
        formatted_docs = []
        
        for result in reranked_results:
            doc = result.get("document") or {}
            
            # Skip if doc is None or empty
            if not doc:
                logger.warning(f"Skipping result with empty document: {result}")
                continue
            
            formatted_doc = {
                "text": doc.get("chunk_text", ""),
                "score": result.get("score", 0.0),
                "metadata": {
                    "document_id": doc.get("_id", ""),
                    "original_filename": doc.get("original_filename", doc.get("file_name", "unknown")),
                    "document_type": doc.get("document_type", "unknown"),
                    "chunk_id": doc.get("chunk_id", 0),
                    "total_chunks": doc.get("total_chunks", 0),
                    "upload_date": doc.get("upload_date", ""),
                }
            }
            
            # Add any additional metadata
            for key, value in doc.items():
                if key not in ["_id", "chunk_text", "original_filename", "file_name", 
                              "document_type", "chunk_id", "total_chunks", "upload_date"]:
                    formatted_doc["metadata"][key] = value
            
            formatted_docs.append(formatted_doc)
        
        return formatted_docs
    
    def _format_search_results(
        self,
        search_results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Format search results from Pinecone v7 hybrid search.
        Results are already converted to dicts by PineconeService._hit_to_dict()
        
        Args:
            search_results: Search results (dict format from PineconeService)
            
        Returns:
            Formatted documents for LLM
        """
        formatted_docs = []
        
        for result in search_results:
            # Results are already dicts with _id, _score, fields
            fields = result.get("fields", {})
            
            formatted_doc = {
                "text": fields.get("chunk_text", ""),
                "score": result.get("_score", 0.0),
                "metadata": {
                    "document_id": result.get("_id", ""),
                    "original_filename": fields.get("original_filename", fields.get("file_name", "unknown")),
                    "document_type": fields.get("document_type", "unknown"),
                    "chunk_id": fields.get("chunk_id", 0),
                    "total_chunks": fields.get("total_chunks", 0),
                    "upload_date": fields.get("upload_date", ""),
                }
            }
            
            # Add any additional metadata
            for key, value in fields.items():
                if key not in ["chunk_text", "original_filename", "file_name",
                              "document_type", "chunk_id", "total_chunks", "upload_date"]:
                    formatted_doc["metadata"][key] = value
            
            formatted_docs.append(formatted_doc)
        
        return formatted_docs
    
    def retrieve_only(
        self,
        query: str,
        top_k: int = 15,
        top_n: int = 5,
        namespace: str = "default",
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Retrieve documents without LLM generation.
        Returns formatted documents for display.
        
        Args:
            query: User's question
            top_k: Number of results from each index
            top_n: Final number of results
            namespace: Pinecone namespace
            metadata_filter: Optional metadata filters
            
        Returns:
            Dictionary with query and retrieved documents
        """
        documents = self.query(
            query=query,
            top_k=top_k,
            top_n=top_n,
            namespace=namespace,
            metadata_filter=metadata_filter,
            use_reranking=True
        )
        
        # Format for display
        formatted_docs = []
        for doc in documents:
            formatted_docs.append({
                "text": doc["text"][:500] + "..." if len(doc["text"]) > 500 else doc["text"],
                "score": round(doc["score"], 4),
                "filename": doc["metadata"]["original_filename"],
                "document_type": doc["metadata"]["document_type"],
                "chunk_id": doc["metadata"]["chunk_id"],
            })
        
        return {
            "query": query,
            "namespace": namespace,
            "documents": formatted_docs
        }
    
    def get_namespace_stats(self, namespace: str = "default") -> Dict[str, Any]:
        """
        Get statistics for a namespace.
        
        Args:
            namespace: Namespace to get stats for
            
        Returns:
            Statistics dictionary
        """
        try:
            stats = self.pinecone_service.get_index_stats()
            
            # Extract namespace stats
            dense_stats = stats.get("dense", {})
            sparse_stats = stats.get("sparse", {})
            
            namespace_info = {
                "namespace": namespace,
                "dense_vector_count": dense_stats.get("namespaces", {}).get(namespace, {}).get("vector_count", 0),
                "sparse_vector_count": sparse_stats.get("namespaces", {}).get(namespace, {}).get("vector_count", 0),
                "total_vectors": (
                    dense_stats.get("namespaces", {}).get(namespace, {}).get("vector_count", 0) +
                    sparse_stats.get("namespaces", {}).get(namespace, {}).get("vector_count", 0)
                )
            }
            
            return namespace_info
            
        except Exception as e:
            logger.error(f"Error getting namespace stats: {str(e)}")
            return {"error": str(e)}
