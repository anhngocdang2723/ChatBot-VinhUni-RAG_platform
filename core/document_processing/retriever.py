from typing import List, Dict, Optional, Any
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, MatchAny, Range, SearchParams
from qdrant_client import models
import logging
import time
import torch
import os
from core.llm.config import CollectionConfig
from core.document_processing.model_singleton import model_singleton
from concurrent.futures import ThreadPoolExecutor

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class Retriever:
    """
    Handles document retrieval and reranking operations.
    Supports hybrid search combining metadata filtering and semantic search.
    All operations are performed on the fixed Truong Dai hoc Vinh collection.
    """
    
    def __init__(
        self,
        qdrant_url: str,
        qdrant_api_key: str,
        verbose: bool = False
    ):
        self.verbose = verbose
        
        # Use models from singleton
        self.device = model_singleton.device
        self.query_encoder = model_singleton.embedding_model
        self.reranker = model_singleton.reranking_model
        
        # Initialize Qdrant client
        try:
            logger.info(f"Connecting to Qdrant at {qdrant_url}")
            self.client = QdrantClient(
                url=qdrant_url,
                api_key=qdrant_api_key,
                timeout=60.0
            )
            logger.info("Connected to Qdrant successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            raise

    def _create_metadata_filter(self, metadata_filters: Dict[str, Any]) -> Optional[Filter]:
        """
        Create a Qdrant filter from metadata conditions.
        Supports exact match, range queries, and list matches.
        """
        if not metadata_filters:
            return None
            
        filter_conditions = []
        
        for key, value in metadata_filters.items():
            try:
                # Handle nested fields in record_fields
                if key.startswith("record_fields."):
                    field_path = f"metadata.{key}"
                else:
                    field_path = f"metadata.{key}"
                
                # Handle different types of conditions
                if isinstance(value, dict):
                    # Range query
                    range_conditions = []
                    if "gt" in value:
                        range_conditions.append(
                            FieldCondition(
                                key=field_path,
                                range=Range(
                                    gt=value["gt"]
                                )
                            )
                        )
                    if "gte" in value:
                        range_conditions.append(
                            FieldCondition(
                                key=field_path,
                                range=Range(
                                    gte=value["gte"]
                                )
                            )
                        )
                    if "lt" in value:
                        range_conditions.append(
                            FieldCondition(
                                key=field_path,
                                range=Range(
                                    lt=value["lt"]
                                )
                            )
                        )
                    if "lte" in value:
                        range_conditions.append(
                            FieldCondition(
                                key=field_path,
                                range=Range(
                                    lte=value["lte"]
                                )
                            )
                        )
                    filter_conditions.extend(range_conditions)
                    
                elif isinstance(value, (list, tuple)):
                    # Match any value in list
                    filter_conditions.append(
                        FieldCondition(
                            key=field_path,
                            match=MatchAny(
                                any=value
                            )
                        )
                    )
                    
                elif isinstance(value, (int, float)):
                    # Exact match for numbers
                    filter_conditions.append(
                        FieldCondition(
                            key=field_path,
                            match=MatchValue(
                                value=value
                            )
                        )
                    )
                    
                elif isinstance(value, str):
                    # Text match
                    filter_conditions.append(
                        FieldCondition(
                            key=field_path,
                            match=MatchValue(
                                value=value
                            )
                        )
                    )
                    
            except Exception as e:
                logger.error(f"Error creating filter for {key}: {str(e)}")
                continue
        
        if filter_conditions:
            return Filter(
                must=filter_conditions
            )
        
        return None

    def retrieve_documents(
        self,
        query: str,
        collection_name: Optional[str] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
        top_k: int = 15,
        score_threshold: float = 0.0,
        timeout: int = 30  # Add timeout parameter
    ) -> List[Dict]:
        """
        Retrieve documents using hybrid search with pre-filtering.
        Always uses the fixed collection regardless of input collection name.
        
        Args:
            query: Search query text
            collection_name: Collection name (ignored, always uses fixed collection)
            metadata_filters: Optional metadata filters
            top_k: Number of results to return
            score_threshold: Minimum similarity score threshold
            timeout: Maximum time in seconds to wait for results
            
        Returns:
            List of document results with scores and metadata
        """
        try:
            start_time = time.time()
            
            # Input validation
            if not query or not query.strip():
                raise ValueError("Empty query")
            
            if len(query) > 1000:
                query = query[:1000]
                logger.warning("Query truncated to 1000 characters")
            
            # Always use fixed collection
            collection_name = CollectionConfig.STORAGE_NAME
            
            if self.verbose:
                logger.info("Starting retrieval process...")
                
            # Step 1: Pre-filtering based on metadata if filters provided
            if metadata_filters:
                if self.verbose:
                    logger.info(f"Applying pre-filters: {metadata_filters}")
                    
                search_filter = self._create_metadata_filter(metadata_filters)
                if not search_filter:
                    logger.warning("Invalid metadata filters, proceeding without pre-filtering")
            else:
                search_filter = None
                
            # Step 2: Generate query embedding
            if self.verbose:
                logger.info("Generating query embedding...")
            
            try:
                with torch.no_grad():
                    query_embedding = self.query_encoder.encode(
                        query,
                        convert_to_numpy=True,
                        show_progress_bar=False,
                        device=self.device
                    )
            except Exception as e:
                logger.error(f"Error generating query embedding: {str(e)}")
                return []
            
            # Step 3: Vector search with optional pre-filtering
            if self.verbose:
                logger.info(f"Performing vector search in collection {collection_name}")
                if search_filter:
                    logger.info("Using combined pre-filtering and vector search")
                    
            try:
                results = self.client.search(
                    collection_name=collection_name,
                    query_vector=query_embedding.tolist(),
                    limit=top_k * 2,  # Get more results for reranking
                    score_threshold=score_threshold,
                    query_filter=search_filter,
                    timeout=timeout
                )
                
                if not results:
                    logger.info("No results found with pre-filtering and vector search")
                    return []
                    
                logger.info(f"Retrieved {len(results)} documents")
                
            except Exception as e:
                logger.error(f"Error during vector search: {str(e)}")
                return []
                
            # Step 4: Format results for reranking
            formatted_results = []
            for result in results:
                try:
                    # Extract text and metadata
                    payload = result.payload
                    text = payload.get("text", "")
                    metadata = payload.get("metadata", {})
                    
                    # Truncate text if too long for reranker
                    if len(text) > 512:
                        text = text[:512]
                    
                    # Add to formatted results
                    formatted_results.append({
                        "text": text,
                        "metadata": metadata,
                        "score": float(result.score),
                        "id": str(result.id)
                    })
                except Exception as e:
                    logger.error(f"Error formatting result: {str(e)}")
                    continue
                    
            # Step 5: Rerank results
            if formatted_results:
                if self.verbose:
                    logger.info(f"Reranking {len(formatted_results)} documents")
                
                try:
                    with torch.no_grad():
                        # Prepare pairs for reranking
                        rerank_pairs = [(query, doc["text"]) for doc in formatted_results]
                        rerank_scores = self.reranker.predict(
                            rerank_pairs,
                            batch_size=8,  # Adjust based on available memory
                            show_progress_bar=False
                        )
                        
                        # Add rerank scores and sort
                        for idx, score in enumerate(rerank_scores):
                            formatted_results[idx]["rerank_score"] = float(score)
                        
                        # Sort by rerank score and take top_k
                        formatted_results.sort(key=lambda x: x["rerank_score"], reverse=True)
                        formatted_results = formatted_results[:top_k]
                        
                except Exception as e:
                    logger.error(f"Error during reranking: {str(e)}")
                    # Fall back to vector search scores if reranking fails
                    formatted_results.sort(key=lambda x: x["score"], reverse=True)
                    formatted_results = formatted_results[:top_k]
                
                if self.verbose:
                    logger.info(f"Final results after reranking: {len(formatted_results)}")
            
            # Add timing information
            end_time = time.time()
            elapsed_time = end_time - start_time
            
            # Add timing info to results
            for result in formatted_results:
                result["retrieval_time"] = elapsed_time
            
            if self.verbose:
                logger.info(f"Total retrieval time: {elapsed_time:.2f}s")
                
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error in retrieve_documents: {str(e)}")
            return []

    def query(
        self, 
        query: str,
        collection_name: Optional[str] = None,
        collection_names: Optional[List[str]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
        top_k: int = 15,
        top_n: int = 5,
        merge_strategy: str = "score"
    ) -> List[Dict]:
        """
        Query documents from one or multiple collections.
        
        Args:
            query: Search query text
            collection_name: Single collection to search in (deprecated, use collection_names)
            collection_names: List of collections to search in
            metadata_filters: Dictionary of metadata conditions
            top_k: Number of results to retrieve per collection
            top_n: Number of results to return after reranking
            merge_strategy: How to merge results from multiple collections ("score" or "round_robin")
        """
        # Handle collection name parameters
        if collection_name and not collection_names:
            collection_names = [collection_name]
        elif not collection_names:
            raise ValueError("Either collection_name or collection_names must be provided")

        all_results = []
        
        # Query each collection
        for coll_name in collection_names:
            try:
                results = self.retrieve_documents(
                    query=query,
                    collection_name=coll_name,
                    metadata_filters=metadata_filters,
                    top_k=top_k
                )
                all_results.extend(results)
            except Exception as e:
                logger.error(f"Error querying collection {coll_name}: {str(e)}")
                continue

        if not all_results:
            return []

        # Rerank all results together
        rerank_pairs = [(query, doc["text"]) for doc in all_results]
        rerank_scores = self.reranker.predict(rerank_pairs)

        # Add rerank scores to results
        for idx, score in enumerate(rerank_scores):
            all_results[idx]["rerank_score"] = float(score)

        # Sort by rerank score
        all_results.sort(key=lambda x: x["rerank_score"], reverse=True)

        # Apply merge strategy
        if merge_strategy == "round_robin" and len(collection_names) > 1:
            # Group by collection
            collection_groups = {}
            for result in all_results:
                coll = result.get("metadata", {}).get("collection_name", "unknown")
                if coll not in collection_groups:
                    collection_groups[coll] = []
                collection_groups[coll].append(result)

            # Merge using round robin
            merged_results = []
            while len(merged_results) < top_n and any(collection_groups.values()):
                for coll in collection_names:
                    if coll in collection_groups and collection_groups[coll]:
                        merged_results.append(collection_groups[coll].pop(0))
                        if len(merged_results) >= top_n:
                            break
            all_results = merged_results
        else:
            # Just take top_n results sorted by score
            all_results = all_results[:top_n]

        return all_results 

    def search_documents(
        self,
        query: str,
        metadata_filters: Optional[Dict[str, Any]] = None,
        top_k: int = 10,
        score_threshold: float = 0.0,
        timeout: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Search implementation with standard parameters.
        """
        try:
            start_time = time.time()
            
            # Input validation
            if not query or not query.strip():
                raise ValueError("Empty query")
            
            if len(query) > 1000:
                query = query[:1000]
                logger.warning("Query truncated to 1000 characters")
            
            # Always use fixed collection
            collection_name = CollectionConfig.STORAGE_NAME
            
            if self.verbose:
                logger.info("Starting retrieval process...")
                
            # Step 1: Pre-filtering based on metadata if filters provided
            if metadata_filters:
                if self.verbose:
                    logger.info(f"Applying pre-filters: {metadata_filters}")
                    
                search_filter = self._create_metadata_filter(metadata_filters)
                if not search_filter:
                    logger.warning("Invalid metadata filters, proceeding without pre-filtering")
            else:
                search_filter = None
                
            # Step 2: Generate query embedding
            if self.verbose:
                logger.info("Generating query embedding...")
            
            try:
                with torch.no_grad():
                    query_embedding = self.query_encoder.encode(
                        query,
                        convert_to_numpy=True,
                        show_progress_bar=False,
                        device=self.device
                    )
            except Exception as e:
                logger.error(f"Error generating query embedding: {str(e)}")
                return []
            
            # Step 3: Vector search with standard parameters
            if self.verbose:
                logger.info(f"Performing vector search in collection {collection_name}")
                
            try:
                results = self.client.search(
                    collection_name=collection_name,
                    query_vector=query_embedding.tolist(),
                    limit=top_k * 2,  # Get more results for reranking
                    score_threshold=score_threshold,
                    query_filter=search_filter,
                    timeout=timeout
                )
                
                if not results:
                    logger.info("No results found with pre-filtering and vector search")
                    return []
                    
                logger.info(f"Retrieved {len(results)} documents")
                
            except Exception as e:
                logger.error(f"Error during vector search: {str(e)}")
                return []
                
            # Step 4: Format results
            formatted_results = []
            for result in results:
                formatted_result = self._format_search_result(result)
                if formatted_result:
                    formatted_results.append(formatted_result)
            
            # Log performance metrics
            elapsed = time.time() - start_time
            logger.info(f"Search completed in {elapsed:.2f}s with {len(formatted_results)} results")
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error in search_documents: {str(e)}")
            return []
            
    def _format_search_result(self, result) -> Optional[Dict[str, Any]]:
        """Helper method to format a single search result."""
        try:
            # Extract text and metadata
            payload = result.payload
            text = payload.get("text", "")
            metadata = payload.get("metadata", {})
            
            # Truncate text if too long for reranker
            if len(text) > 512:
                text = text[:512]
            
            return {
                "text": text,
                "metadata": metadata,
                "score": float(result.score),
                "id": str(result.id)
            }
        except Exception as e:
            logger.error(f"Error formatting result: {str(e)}")
            return None

# Singleton retriever instance
_retriever_instance = None

def get_retriever_singleton(qdrant_url=None, qdrant_api_key=None, verbose=False):
    global _retriever_instance
    if _retriever_instance is None:
        # Nếu không truyền tham số thì lấy từ biến môi trường hoặc config
        if qdrant_url is None or qdrant_api_key is None:
            qdrant_url = os.getenv('QDRANT_URL')
            qdrant_api_key = os.getenv('QDRANT_API_KEY')
        _retriever_instance = Retriever(
            qdrant_url=qdrant_url,
            qdrant_api_key=qdrant_api_key,
            verbose=verbose
        )
    return _retriever_instance 