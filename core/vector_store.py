from typing import Optional, List, Dict, Any
import time
from datetime import datetime
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import logging
import numpy as np

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class VectorStore:
    """
    Handles document storage and vector database operations.
    Supports static field indexing and collection management.
    """
    
    # Define constants for field types
    class FieldType:
        KEYWORD = "keyword"
        INTEGER = "integer"
        FLOAT = "float"
        GEO = "geo"
        TEXT = "text"
    
    # Define standard field mappings for TKB data
    STANDARD_FIELD_MAPPINGS = {
        "Mã HP": {"type": FieldType.KEYWORD, "path": "record_fields.Mã HP"},
        "Lớp học phần": {"type": FieldType.KEYWORD, "path": "record_fields.Lớp học phần"},
        "Khóa học": {"type": FieldType.KEYWORD, "path": "record_fields.Khóa học"},
        "Số TC": {"type": FieldType.INTEGER, "path": "record_fields.Số TC"},
        "Số SV dự kiến": {"type": FieldType.INTEGER, "path": "record_fields.Số SV dự kiến"},
        "Số SV đã ĐK": {"type": FieldType.INTEGER, "path": "record_fields.Số SV đã ĐK"},
        "Hình thức học": {"type": FieldType.KEYWORD, "path": "record_fields.Hình thức học"},
        "Tuần học": {"type": FieldType.KEYWORD, "path": "record_fields.Tuần học"},
        "Thứ": {"type": FieldType.INTEGER, "path": "record_fields.Thứ"},
        "Tiết BĐ": {"type": FieldType.INTEGER, "path": "record_fields.Tiết BĐ"},
        "Số tiết": {"type": FieldType.INTEGER, "path": "record_fields.Số tiết"},
        "Phòng học": {"type": FieldType.KEYWORD, "path": "record_fields.Phòng học"},
        "Cơ sở đào tạo": {"type": FieldType.KEYWORD, "path": "record_fields.Cơ sở đào tạo"},
        "Giáo Viên": {"type": FieldType.KEYWORD, "path": "record_fields.Giáo Viên"},
        "Khoa/Viện": {"type": FieldType.KEYWORD, "path": "record_fields.Khoa/Viện"}
    }
    
    def __init__(
        self,
        qdrant_url: str,
        qdrant_api_key: str,
        verbose: bool = False
    ):
        self.verbose = verbose
        
        # Initialize document embedding model
        logger.info("Loading document embedding model: dangvantuan/vietnamese-embedding")
        self.doc_encoder = SentenceTransformer('dangvantuan/vietnamese-embedding')
        self.doc_embedding_dim = self.doc_encoder.get_sentence_embedding_dimension()
        
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

    def _infer_field_type(self, value: Any) -> str:
        """Infer field type from value."""
        if isinstance(value, bool):
            return self.FieldType.KEYWORD
        elif isinstance(value, int):
            return self.FieldType.INTEGER
        elif isinstance(value, float):
            return self.FieldType.FLOAT
        elif isinstance(value, str):
            # Try to convert to number
            try:
                if value.isdigit():
                    return self.FieldType.INTEGER
                float(value)
                return self.FieldType.FLOAT
            except:
                return self.FieldType.KEYWORD
        return self.FieldType.KEYWORD

    def _analyze_record_fields(self, record: Dict[str, Any]) -> Dict[str, Dict[str, str]]:
        """Analyze record fields and determine their types."""
        field_mappings = {}
        for field_name, value in record.items():
            field_type = self._infer_field_type(value)
            field_mappings[field_name] = {
                "type": field_type,
                "path": f"record_fields.{field_name}"
            }
        return field_mappings

    def setup_collection(self, collection_name: str) -> bool:
        """
        Set up a new collection with standard payload indexes.
        Args:
            collection_name: Name of the collection to create
        """
        try:
            # Create collection if not exists
            collections = self.client.get_collections().collections
            collection_exists = any(c.name == collection_name for c in collections)
            
            if not collection_exists:
                logger.info(f"Creating new collection: {collection_name}")
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config={
                        "size": self.doc_embedding_dim,
                        "distance": "Cosine"
                    }
                )
                logger.info(f"Created new collection: {collection_name}")
            
            # Set up standard payload indexes
            self.setup_payload_indexes(collection_name, self.STANDARD_FIELD_MAPPINGS)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to set up collection: {str(e)}")
            return False

    def setup_payload_indexes(self, collection_name: str, field_mappings: Dict[str, Dict[str, str]]) -> bool:
        """
        Set up payload indexes for efficient filtering.
        Args:
            collection_name: Name of the collection
            field_mappings: Field type mappings from analysis
        """
        try:
            for field_name, field_info in field_mappings.items():
                field_type = field_info["type"]
                field_path = f"payload.metadata.{field_info['path']}"
                
                try:
                    # Create payload index based on field type
                    if field_type == self.FieldType.KEYWORD:
                        self.client.create_payload_index(
                            collection_name=collection_name,
                            field_name=field_path,
                            field_schema=models.PayloadSchemaType.KEYWORD
                        )
                    elif field_type == self.FieldType.INTEGER:
                        self.client.create_payload_index(
                            collection_name=collection_name,
                            field_name=field_path,
                            field_schema=models.PayloadSchemaType.INTEGER
                        )
                    elif field_type == self.FieldType.FLOAT:
                        self.client.create_payload_index(
                            collection_name=collection_name,
                            field_name=field_path,
                            field_schema=models.PayloadSchemaType.FLOAT
                        )
                    elif field_type == self.FieldType.TEXT:
                        self.client.create_payload_index(
                            collection_name=collection_name,
                            field_name=field_path,
                            field_schema=models.PayloadSchemaType.TEXT
                        )
                    
                    logger.info(f"Created payload index for {field_path} with type {field_type}")
                    
                except Exception as e:
                    # Skip if index already exists
                    if "already exists" not in str(e):
                        logger.error(f"Failed to create index for {field_path}: {str(e)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to set up payload indexes: {str(e)}")
            return False

    def _extract_record_fields(self, text: str) -> Dict[str, Any]:
        """Extract and convert record fields from text format using standard field mappings."""
        record_fields = {}
        text_parts = text.split(", ")
        
        for part in text_parts:
            if ": " in part:
                field_name, field_value = part.split(": ", 1)
                
                # Convert value based on standard field type
                if field_name in self.STANDARD_FIELD_MAPPINGS:
                    field_type = self.STANDARD_FIELD_MAPPINGS[field_name]["type"]
                    try:
                        if field_type == self.FieldType.INTEGER:
                            if field_value.isdigit():
                                field_value = int(field_value)
                        elif field_type == self.FieldType.FLOAT:
                            if field_value.replace(".", "", 1).isdigit():
                                field_value = float(field_value)
                        # Keep as string for KEYWORD and TEXT types
                    except:
                        pass
                
                record_fields[field_name] = field_value
        
        return record_fields

    def store_documents(
        self,
        collection_name: str,
        texts: List[str],
        metadata_list: Optional[List[Dict[str, Any]]] = None,
        batch_size: int = 32
    ) -> bool:
        """
        Store documents in the vector database using standard field mappings.
        Args:
            collection_name: Name of the collection to store documents in
            texts: List of text documents
            metadata_list: Optional metadata for each document
            batch_size: Batch size for processing
        """
        try:
            if not texts:
                logger.warning("No documents to store")
                return False
            
            total_docs = len(texts)
            if self.verbose:
                logger.info(f"Generating embeddings for {total_docs} documents...")
            
            # Ensure metadata list
            if metadata_list is None:
                metadata_list = [{"id": f"doc_{i}", "timestamp": datetime.now().isoformat()}
                               for i in range(total_docs)]
            elif len(metadata_list) != total_docs:
                logger.warning(f"Metadata list length ({len(metadata_list)}) doesn't match texts length ({total_docs})")
                return False
            
            # Setup collection with standard field mappings
            self.setup_collection(collection_name)
            
            # Process in batches
            start_time = time.time()
            for i in range(0, total_docs, batch_size):
                batch_end = min(i + batch_size, total_docs)
                batch_texts = texts[i:batch_end]
                batch_metadata = metadata_list[i:batch_end]
                
                # Generate embeddings
                batch_embeddings = self.doc_encoder.encode(
                    batch_texts,
                    batch_size=batch_size,
                    show_progress_bar=self.verbose,
                    convert_to_numpy=True
                )
                
                # Prepare points with proper payload structure
                points = []
                for j, (text, embedding, metadata) in enumerate(
                    zip(batch_texts, batch_embeddings, batch_metadata)
                ):
                    if "id" not in metadata:
                        metadata["id"] = f"doc_{i+j}"
                    
                    # Extract and structure record fields for tabular data
                    if metadata.get("content_type") == "table_record":
                        record_fields = self._extract_record_fields(text)
                        metadata["record_fields"] = record_fields
                    
                    point = models.PointStruct(
                        id=i+j,
                        vector=embedding.tolist(),
                        payload={
                            "text": text,
                            "metadata": metadata
                        }
                    )
                    points.append(point)
                
                # Store vectors with payload
                self.client.upsert(
                    collection_name=collection_name,
                    points=points
                )
                
                if self.verbose:
                    progress = batch_end / total_docs * 100
                    logger.info(f"Progress: {progress:.1f}% ({batch_end}/{total_docs})")
            
            elapsed = time.time() - start_time
            logger.info(f"Stored {total_docs} documents in {elapsed:.2f} seconds")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store documents: {str(e)}")
            return False

    def search_documents(
        self,
        collection_name: str,
        query_vector: np.ndarray,
        limit: int = 10,
        score_threshold: float = 0.0,
        search_filter: Optional[Filter] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents in the vector database.
        Args:
            collection_name: Name of the collection to search in
            query_vector: Query vector for similarity search
            limit: Maximum number of results to return
            score_threshold: Minimum score threshold
            search_filter: Optional metadata filter
        """
        try:
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector.tolist(),
                limit=limit,
                score_threshold=score_threshold,
                query_filter=search_filter
            )
            return [result.payload for result in results]
        except Exception as e:
            logger.error(f"Failed to search documents: {str(e)}")
            return []

    def list_collections(self) -> List[Dict[str, Any]]:
        """List all collections with their names only."""
        try:
            collections_list = self.client.get_collections().collections
            return [{"name": collection.name} for collection in collections_list]
        except Exception as e:
            logger.error(f"Failed to list collections: {str(e)}")
            return [] 