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
        self.current_collection = None  # Initialize current collection
        
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

    def _sanitize_field_name(self, field_name: str) -> str:
        """Sanitize field name to be compatible with Qdrant's JSON path."""
        # Replace Vietnamese characters with their ASCII equivalents
        vietnamese_chars = {
            'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
            'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
            'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
            'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
            'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
            'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
            'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
            'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
            'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
            'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
            'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
            'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
            'đ': 'd',
            'Á': 'A', 'À': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
            'Ă': 'A', 'Ắ': 'A', 'Ằ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
            'Â': 'A', 'Ấ': 'A', 'Ầ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
            'É': 'E', 'È': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
            'Ê': 'E', 'Ế': 'E', 'Ề': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
            'Í': 'I', 'Ì': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
            'Ó': 'O', 'Ò': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
            'Ô': 'O', 'Ố': 'O', 'Ồ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
            'Ơ': 'O', 'Ớ': 'O', 'Ờ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
            'Ú': 'U', 'Ù': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
            'Ư': 'U', 'Ứ': 'U', 'Ừ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
            'Ý': 'Y', 'Ỳ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
            'Đ': 'D'
        }
        
        # Replace Vietnamese characters
        for char, replacement in vietnamese_chars.items():
            field_name = field_name.replace(char, replacement)
            
        # Replace spaces and special characters with underscores
        field_name = ''.join(c if c.isalnum() else '_' for c in field_name)
        
        # Remove consecutive underscores
        field_name = '_'.join(filter(None, field_name.split('_')))
        
        return field_name.lower()

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

    def setup_collection(self, collection_name: str, display_name: Optional[str] = None) -> bool:
        """
        Set up a new collection with standard payload indexes.
        Args:
            collection_name: Name of the collection to create
            display_name: Optional Vietnamese display name for the collection
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
                
                # Store collection metadata if display name is provided
                if display_name:
                    self.client.update_collection(
                        collection_name=collection_name,
                        collection_metadata={
                            "display_name": display_name
                        }
                    )
            
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
                # Sanitize field name for JSON path
                sanitized_field = self._sanitize_field_name(field_name)
                field_path = f"payload.metadata.record_fields.{sanitized_field}"
                
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
                
                # Use sanitized field name for storage
                sanitized_field = self._sanitize_field_name(field_name)
                record_fields[sanitized_field] = field_value
        
        return record_fields

    def store_documents(
        self,
        collection_name: str,
        texts: List[str],
        metadata_list: Optional[List[Dict[str, Any]]] = None,
        batch_size: int = 4,  # Further reduced batch size
        max_retries: int = 3  # Maximum number of retries for failed batches
    ) -> bool:
        """
        Store documents in the vector database using standard field mappings.
        Args:
            collection_name: Name of the collection to store documents in
            texts: List of text documents
            metadata_list: Optional metadata for each document
            batch_size: Batch size for processing (default: 4)
            max_retries: Maximum number of retries for failed batches (default: 3)
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
            
            # Switch to collection and set up indexes
            if not self.switch_collection(collection_name):
                logger.error(f"Failed to switch to collection: {collection_name}")
                return False
            
            # Process in batches
            start_time = time.time()
            failed_batches = []
            
            for i in range(0, total_docs, batch_size):
                batch_end = min(i + batch_size, total_docs)
                batch_texts = texts[i:batch_end]
                batch_metadata = metadata_list[i:batch_end]
                
                # Preprocess texts to handle potential issues
                processed_texts = []
                for text in batch_texts:
                    # Remove any non-printable characters
                    text = ''.join(char for char in text if char.isprintable())
                    # Limit text length to prevent CUDA issues
                    if len(text) > 256:  # Further reduced text length
                        text = text[:256]
                    processed_texts.append(text)
                
                success = False
                retry_count = 0
                use_cpu = False
                
                while not success and retry_count < max_retries:
                    try:
                        # Generate embeddings with error handling
                        batch_embeddings = self.doc_encoder.encode(
                            processed_texts,
                            batch_size=2,  # Even smaller batch size for encoding
                            show_progress_bar=self.verbose,
                            convert_to_numpy=True,
                            normalize_embeddings=True,
                            device='cpu' if use_cpu else None  # Use CPU if previous attempts failed
                        )
                        
                        # Prepare points with proper payload structure
                        points = []
                        for j, (text, embedding, metadata) in enumerate(
                            zip(batch_texts, batch_embeddings, batch_metadata)
                        ):
                            # Ensure metadata is a dictionary
                            if not isinstance(metadata, dict):
                                metadata = {"id": f"doc_{i+j}", "timestamp": datetime.now().isoformat()}
                            
                            # Ensure id exists
                            if "id" not in metadata:
                                metadata["id"] = f"doc_{i+j}"
                            
                            # Extract and structure record fields for tabular data
                            if metadata.get("content_type") == "table_record":
                                try:
                                    record_fields = self._extract_record_fields(text)
                                    metadata["record_fields"] = record_fields
                                except Exception as e:
                                    logger.warning(f"Failed to extract record fields: {str(e)}")
                                    metadata["record_fields"] = {}
                            
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
                            collection_name=self.current_collection,
                            points=points
                        )
                        
                        success = True
                        
                    except Exception as e:
                        retry_count += 1
                        if retry_count < max_retries:
                            logger.warning(f"Batch {i}-{batch_end} failed (attempt {retry_count}/{max_retries}): {str(e)}")
                            # Try CPU on second retry
                            if retry_count == 2:
                                use_cpu = True
                                logger.info(f"Switching to CPU for batch {i}-{batch_end}")
                            # Add a small delay before retrying
                            time.sleep(1)
                        else:
                            logger.error(f"Batch {i}-{batch_end} failed after {max_retries} attempts: {str(e)}")
                            failed_batches.append((i, batch_end))
                
                if self.verbose:
                    progress = batch_end / total_docs * 100
                    logger.info(f"Progress: {progress:.1f}% ({batch_end}/{total_docs})")
            
            elapsed = time.time() - start_time
            
            # Report final status
            if failed_batches:
                logger.warning(f"Failed to process {len(failed_batches)} batches after {elapsed:.2f} seconds")
                for start, end in failed_batches:
                    logger.warning(f"Failed batch: documents {start}-{end}")
            else:
                logger.info(f"Successfully stored all {total_docs} documents in {elapsed:.2f} seconds")
            
            return len(failed_batches) == 0
            
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
            # Switch to collection if needed
            if collection_name != self.current_collection:
                if not self.switch_collection(collection_name):
                    logger.error(f"Failed to switch to collection: {collection_name}")
                    return []
            
            results = self.client.search(
                collection_name=self.current_collection,
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
        """List all collections with their names and display names."""
        try:
            collections_list = self.client.get_collections().collections
            collections_info = []
            for collection in collections_list:
                # Get collection metadata
                try:
                    metadata = self.client.get_collection(collection.name).metadata
                    display_name = metadata.get("display_name", collection.name)
                except:
                    display_name = collection.name
                
                collections_info.append({
                    "name": collection.name,
                    "display_name": display_name
                })
            return collections_info
        except Exception as e:
            logger.error(f"Failed to list collections: {str(e)}")
            return []

    def switch_collection(self, collection_name: str, display_name: Optional[str] = None) -> bool:
        """
        Switch to a different collection. Creates the collection if it doesn't exist.
        Args:
            collection_name: Name of the collection to switch to
            display_name: Optional Vietnamese display name for the collection
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            collection_exists = any(c.name == collection_name for c in collections)
            
            if not collection_exists:
                logger.info(f"Collection {collection_name} does not exist, creating it...")
                # Create collection if it doesn't exist
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
                
                # Store collection metadata if display name is provided
                if display_name:
                    self.client.update_collection(
                        collection_name=collection_name,
                        collection_metadata={
                            "display_name": display_name
                        }
                    )
            
            # Store current collection name
            self.current_collection = collection_name
            logger.info(f"Switched to collection: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to switch collection: {str(e)}")
            return False

    def get_collection_display_name(self, collection_name: str) -> str:
        """
        Get the display name of a collection.
        Args:
            collection_name: Name of the collection
        Returns:
            str: Display name if available, otherwise collection name
        """
        try:
            metadata = self.client.get_collection(collection_name).metadata
            return metadata.get("display_name", collection_name)
        except:
            return collection_name 