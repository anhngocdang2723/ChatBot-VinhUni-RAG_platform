"""
Pinecone Service - Manages Pinecone vector database operations.
Uses Pinecone's integrated inference for embedding and hybrid search.
Based on Pinecone RAG tutorial: https://docs.pinecone.io/guides/
"""

import logging
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
import backoff
from tqdm import tqdm

from core.llm.config import Settings, get_settings

logger = logging.getLogger(__name__)

class PineconeService:
    """
    Handles Pinecone index creation, document storage, and hybrid search.
    Uses integrated inference for automatic embedding.
    """
    
    def __init__(
        self,
        api_key: str,
        environment: str = "us-east-1"
    ):
        """
        Initialize Pinecone client.
        
        Args:
            api_key: Pinecone API key
            environment: Pinecone environment/region
        """
        self.pc = Pinecone(
            api_key=api_key,
            source_tag="chatbot_rag:vinhuni"
        )
        self.environment = environment
        self.settings = get_settings()
        
        # Index names for hybrid search
        self.dense_index_name = self.settings.DEFAULT_INDEX + "-dense"
        self.sparse_index_name = self.settings.DEFAULT_INDEX + "-sparse"
        
        self.dense_index = None
        self.sparse_index = None
        
        logger.info(f"Pinecone client initialized for environment: {environment}")
    
    def create_dense_index(self) -> None:
        """
        Create dense index for semantic search using integrated inference.
        Uses OpenAI's text-embedding-3-small model (dimension 1536).
        """
        try:
            # Try to get existing index
            self.dense_index = self.pc.Index(self.dense_index_name)
            
            # Check if index supports inference (has .search() method)
            if not hasattr(self.dense_index, 'search'):
                logger.warning(f"Dense index {self.dense_index_name} exists but doesn't support inference. Recreating...")
                # Delete old index
                self.pc.delete_index(self.dense_index_name)
                logger.info(f"Deleted old dense index: {self.dense_index_name}")
                # Create new one with inference
                raise Exception("Recreate index")
            
            logger.info(f"Dense index already exists: {self.dense_index_name}")
        except Exception:
            # Index doesn't exist or needs recreation, create it
            logger.info(f"Creating dense index: {self.dense_index_name}")
            
            self.pc.create_index_for_model(
                name=self.dense_index_name,
                cloud=self.settings.pinecone_config["cloud"],
                region=self.settings.pinecone_config["region"],
                # Specify the field to embed from documents
                embed={
                    "model": self.settings.EMBEDDING_MODEL,
                    "field_map": {"text": "chunk_text"}
                } # type: ignore
            )
            logger.info(f"Dense index created: {self.dense_index_name}")
            self.dense_index = self.pc.Index(self.dense_index_name)
    
    def create_sparse_index(self) -> None:
        """
        Create sparse index for keyword/lexical search.
        Uses Pinecone's sparse english model for BM25-style search.
        """
        try:
            # Try to get existing index
            self.sparse_index = self.pc.Index(self.sparse_index_name)
            
            # Check if index supports inference (has .search() method)
            if not hasattr(self.sparse_index, 'search'):
                logger.warning(f"Sparse index {self.sparse_index_name} exists but doesn't support inference. Recreating...")
                # Delete old index
                self.pc.delete_index(self.sparse_index_name)
                logger.info(f"Deleted old sparse index: {self.sparse_index_name}")
                # Create new one with inference
                raise Exception("Recreate index")
            
            logger.info(f"Sparse index already exists: {self.sparse_index_name}")
        except Exception:
            # Index doesn't exist or needs recreation, create it
            logger.info(f"Creating sparse index: {self.sparse_index_name}")
            
            self.pc.create_index_for_model(
                name=self.sparse_index_name,
                cloud=self.settings.pinecone_config["cloud"],
                region=self.settings.pinecone_config["region"],
                embed={
                    "model": "pinecone-sparse-english-v0",
                    "field_map": {"text": "chunk_text"}
                } # type: ignore
            )
            logger.info(f"Sparse index created: {self.sparse_index_name}")
            self.sparse_index = self.pc.Index(self.sparse_index_name)
    
    def setup_indexes(self) -> None:
        """
        Setup both dense and sparse indexes for hybrid search.
        """
        self.create_dense_index()
        self.create_sparse_index()
        logger.info("Hybrid search indexes setup complete")
    
    @backoff.on_exception(
        backoff.expo, 
        Exception, 
        max_tries=8, 
        max_time=80,
        on_backoff=lambda details: logger.warning(
            f"Backoff: {details['tries']} of 8 attempts"
        )
    )
    def upsert_records_batch(
        self,
        index,
        records: List[Dict[str, Any]],
        namespace: str = "default"
    ) -> None:
        """
        Upsert a batch of records to an index.
        Pinecone will automatically embed the text using integrated inference.
        
        Args:
            index: Pinecone index object
            records: List of records with structure:
                     [{"id": "doc1", "chunk_text": "text...", "metadata": {...}}]
            namespace: Namespace for the vectors
        """
        index.upsert_records(namespace=namespace, records=records)
    
    def upsert_documents(
        self,
        documents: List[Dict[str, Any]],
        namespace: str = "default",
        batch_size: int = 96
    ) -> Dict[str, int]:
        """
        Upsert documents to both dense and sparse indexes in batches.
        
        Args:
            documents: List of document dictionaries with fields:
                      - id: unique identifier
                      - chunk_text: text content to embed
                      - metadata: additional metadata
            namespace: Namespace for organizing vectors
            batch_size: Number of records per batch (Pinecone limit is 96)
        
        Returns:
            Dictionary with upserted counts for each index
        """
        if not self.dense_index or not self.sparse_index:
            raise ValueError("Indexes not initialized. Call setup_indexes() first")
        
        total_docs = len(documents)
        logger.info(f"Upserting {total_docs} documents to Pinecone...")
        
        # Upsert to dense index
        logger.info("Upserting to dense index...")
        for start in tqdm(
            range(0, total_docs, batch_size), 
            desc="Dense index batch upload"
        ):
            batch = documents[start:start + batch_size]
            self.upsert_records_batch(self.dense_index, batch, namespace)
        
        # Upsert to sparse index
        logger.info("Upserting to sparse index...")
        for start in tqdm(
            range(0, total_docs, batch_size),
            desc="Sparse index batch upload"
        ):
            batch = documents[start:start + batch_size]
            self.upsert_records_batch(self.sparse_index, batch, namespace)
        
        logger.info("Upsert completed successfully")
        
        return {
            "dense_count": total_docs,
            "sparse_count": total_docs
        }
    
    def search_index(
        self,
        index,
        query: str,
        top_k: int = 5,
        namespace: str = "default",
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search an index with automatic query embedding.
        
        Args:
            index: Pinecone index to search
            query: Text query (will be embedded automatically)
            top_k: Number of results to return
            namespace: Namespace to search in
            filter_dict: Metadata filters
        
        Returns:
            List of search results with scores
        """
        # Check if index supports inference-based search
        if hasattr(index, 'search'):
            # Use new inference API (Pinecone v7+ with inference plugin)
            search_params = {
                "namespace": namespace,
                "query": {
                    "top_k": top_k,
                    "inputs": {"text": query}
                }
            }
            
            if filter_dict:
                search_params["query"]["filter"] = filter_dict
            
            results = index.search(**search_params)
            hits = results["result"]["hits"]
            
            # Convert Hit objects to dictionaries for easier handling
            return [self._hit_to_dict(hit) for hit in hits]
        else:
            # Fallback to legacy query method
            logger.warning(f"Index does not support .search() method, this suggests the index was created without inference support. Please recreate the index using create_index_for_model()")
            return []
    
    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        namespace: str = "default",
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search across both dense and sparse indexes.
        
        Args:
            query: Search query text
            top_k: Number of results from each index
            namespace: Namespace to search
            metadata_filter: Optional metadata filters
        
        Returns:
            Merged and deduplicated results from both indexes
        """
        if not self.dense_index or not self.sparse_index:
            raise ValueError("Indexes not initialized. Call setup_indexes() first")
        
        logger.info(f"Performing hybrid search for: {query[:50]}...")
        
        try:
            # Search dense index (semantic)
            dense_results = self.search_index(
                self.dense_index, 
                query, 
                top_k, 
                namespace, 
                metadata_filter
            )
            logger.debug(f"Dense search returned {len(dense_results)} results")
        except Exception as e:
            logger.error(f"Dense search failed: {e}")
            dense_results = []
        
        try:
            # Search sparse index (lexical)
            sparse_results = self.search_index(
                self.sparse_index,
                query,
                top_k,
                namespace,
                metadata_filter
            )
            logger.debug(f"Sparse search returned {len(sparse_results)} results")
        except Exception as e:
            logger.error(f"Sparse search failed: {e}")
            sparse_results = []
        
        # Merge and deduplicate
        merged_results = self._merge_and_deduplicate(dense_results, sparse_results)
        logger.info(f"Hybrid search returned {len(merged_results)} unique results")
        
        if merged_results:
            logger.debug(f"Sample merged result: {merged_results[0]}")
        
        return merged_results
    
    def _hit_to_dict(self, hit: Any) -> Dict[str, Any]:
        """
        Convert Pinecone Hit object to dictionary.
        
        Args:
            hit: Pinecone Hit object from v7 API
        
        Returns:
            Dictionary representation of the hit
        """
        return {
            "_id": getattr(hit, '_id', ''),
            "_score": getattr(hit, '_score', 0.0),
            "fields": getattr(hit, 'fields', {})
        }
    
    def _merge_and_deduplicate(
        self,
        sparse_results: List[Dict[str, Any]],
        dense_results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Merge and deduplicate results from dense and sparse searches.
        
        Args:
            sparse_results: Results from sparse search
            dense_results: Results from dense search
        
        Returns:
            Deduplicated list sorted by score
        """
        # Debug logging
        logger.debug(f"Merging {len(sparse_results)} sparse + {len(dense_results)} dense results")
        
        if sparse_results:
            logger.debug(f"Sample sparse result: {sparse_results[0]}")
        if dense_results:
            logger.debug(f"Sample dense result: {dense_results[0]}")
        
        # Deduplicate by _id, keeping higher score
        deduped_hits = {}
        for hit in sparse_results + dense_results:
            hit_id = hit['_id']
            if hit_id not in deduped_hits or hit['_score'] > deduped_hits[hit_id]['_score']:
                deduped_hits[hit_id] = hit
        
        # Sort by score descending
        sorted_hits = sorted(
            deduped_hits.values(),
            key=lambda x: x['_score'],
            reverse=True
        )
        
        logger.debug(f"After merge: {len(sorted_hits)} unique results")
        return sorted_hits
    
    def rerank_results(
        self,
        query: str,
        results: List[Dict[str, Any]],
        top_n: int = 5,
        model: str = "bge-reranker-v2-m3"
    ) -> List[Dict[str, Any]]:
        """
        Rerank search results using Pinecone's hosted reranking model.
        
        Args:
            query: Original search query
            results: Search results to rerank
            top_n: Number of top results to return after reranking
            model: Reranking model to use
        
        Returns:
            Reranked results with new scores
        """
        logger.info(f"Reranking {len(results)} results...")
        
        # Format for reranking
        documents = [
            {
                "_id": r["_id"],
                "chunk_text": r["fields"].get("chunk_text", ""),
                **r["fields"]
            }
            for r in results
        ]
        
        reranked = self.pc.inference.rerank(
            model=model,
            query=query,
            documents=documents,
            rank_fields=["chunk_text"],
            top_n=top_n,
            return_documents=True,
            parameters={"truncate": "END"}
        )
        
        # Convert reranked results to dict format
        # reranked.data contains RerankResult objects with .score, .index, .document attributes
        formatted_results = []
        for item in reranked.data:
            # Get the original document using the index
            original_doc = documents[item.index] if item.index < len(documents) else {}
            
            formatted_item = {
                "score": item.score,
                "index": item.index,
                "document": original_doc
            }
            formatted_results.append(formatted_item)
        
        logger.info(f"Reranking complete, returning top {top_n} results")
        return formatted_results
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        Get statistics for both dense and sparse indexes.
        
        Returns:
            Dictionary with stats for each index
        """
        stats = {}
        
        if self.dense_index:
            stats["dense"] = self.dense_index.describe_index_stats()
        
        if self.sparse_index:
            stats["sparse"] = self.sparse_index.describe_index_stats()
        
        return stats
    
    def delete_vectors(
        self,
        ids: List[str],
        namespace: str = "default"
    ) -> None:
        """
        Delete vectors by IDs from both indexes.
        
        Args:
            ids: List of vector IDs to delete
            namespace: Namespace containing the vectors
        """
        if self.dense_index:
            self.dense_index.delete(ids=ids, namespace=namespace)
            logger.info(f"Deleted {len(ids)} vectors from dense index")
        
        if self.sparse_index:
            self.sparse_index.delete(ids=ids, namespace=namespace)
            logger.info(f"Deleted {len(ids)} vectors from sparse index")
    
    def delete_all_vectors(self, namespace: str = "default") -> None:
        """
        Delete all vectors in a namespace from both indexes.
        
        Args:
            namespace: Namespace to clear
        """
        if self.dense_index:
            self.dense_index.delete(delete_all=True, namespace=namespace)
            logger.warning(f"Deleted all vectors from dense index namespace: {namespace}")
        
        if self.sparse_index:
            self.sparse_index.delete(delete_all=True, namespace=namespace)
            logger.warning(f"Deleted all vectors from sparse index namespace: {namespace}")
