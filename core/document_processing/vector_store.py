from typing import Optional, List, Dict, Any
import time
from datetime import datetime
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import logging
import numpy as np
from sqlalchemy.orm import Session
from core.llm.config import collection_config, settings
from core.database.models import Document, DocumentType, Department
from core.database.database import get_db
from core.document_processing.model_singleton import model_singleton

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
    All documents are stored in a single collection for Truong Dai hoc Vinh data.
    """
    
    # Define constants for field types
    class FieldType:
        KEYWORD = "keyword"
        INTEGER = "integer"
        FLOAT = "float"
        GEO = "geo"
        TEXT = "text"
    
    # Define standard field mappings for document metadata
    STANDARD_FIELD_MAPPINGS = {
        # Basic document identification
        "document_id": {"type": FieldType.KEYWORD, "path": "payload.metadata.document_id"},
        "display_name": {"type": FieldType.KEYWORD, "path": "payload.metadata.display_name"},
        "document_type": {"type": FieldType.KEYWORD, "path": "payload.metadata.document_type"},
        "department": {"type": FieldType.KEYWORD, "path": "payload.metadata.department"},
        
        # Document metadata
        "description": {"type": FieldType.TEXT, "path": "payload.metadata.description"},
        "reference_number": {"type": FieldType.KEYWORD, "path": "payload.metadata.reference_number"},
        "impact_date": {"type": FieldType.KEYWORD, "path": "payload.metadata.impact_date"},
        "effective_date": {"type": FieldType.KEYWORD, "path": "payload.metadata.effective_date"},
        "expiry_date": {"type": FieldType.KEYWORD, "path": "payload.metadata.expiry_date"},
        
        # File information
        "file_name": {"type": FieldType.KEYWORD, "path": "payload.metadata.file_name"},
        "file_type": {"type": FieldType.KEYWORD, "path": "payload.metadata.file_type"},
        "upload_date": {"type": FieldType.KEYWORD, "path": "payload.metadata.upload_date"},
        "upload_by": {"type": FieldType.KEYWORD, "path": "payload.metadata.upload_by"}
    }

    # Fixed collection name for Truong Dai hoc Vinh
    FIXED_COLLECTION_NAME = "truong_dai_hoc_vinh"
    
    def __init__(
        self,
        qdrant_url: str,
        qdrant_api_key: str,
        db: Session,
        verbose: bool = False,
        chunk_size: int = settings.chunking_config.DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = settings.chunking_config.DEFAULT_CHUNK_OVERLAP
    ):
        self.verbose = verbose
        self.current_collection = collection_config.STORAGE_NAME
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.db = db
        
        # Use the singleton model
        self.doc_encoder = model_singleton.embedding_model
        self.doc_embedding_dim = model_singleton.get_embedding_dimension()
        
        # Initialize Qdrant client
        try:
            logger.info(f"Connecting to Qdrant at {qdrant_url}")
            self.client = QdrantClient(
                url=qdrant_url,
                api_key=qdrant_api_key,
                timeout=60.0
            )
            logger.info("Connected to Qdrant successfully")
            
            # Ensure fixed collection exists
            self.setup_collection(
                collection_config.STORAGE_NAME,
                collection_config.DISPLAY_NAME
            )
            
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
                # Create collection with minimal configuration
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(
                        size=self.doc_embedding_dim,
                        distance=models.Distance.COSINE
                    ),
                    optimizers_config=models.OptimizersConfigDiff(
                        default_segment_number=2,
                        max_optimization_threads=2
                    ),
                    hnsw_config=models.HnswConfigDiff(
                        m=16,
                        ef_construct=100,
                        full_scan_threshold=10000
                    )
                )
                
                # Update collection with additional configuration
                self.client.update_collection(
                    collection_name=collection_name,
                    params=models.CollectionParamsDiff(
                        replication_factor=1,
                        write_consistency_factor=1
                    )
                )
                
                logger.info(f"Created new collection: {collection_name}")
                
                # Store collection metadata if display name is provided
                if display_name:
                    self.client.update_collection(
                        collection_name=collection_name,
                        metadata={
                            "display_name": display_name,
                            "indexes_created": False
                        }
                    )
                
                # Set up standard payload indexes
                self.setup_payload_indexes(collection_name, self.STANDARD_FIELD_MAPPINGS)
            else:
                # Collection exists, just check metadata
                collection_info = self.client.get_collection(collection_name)
                metadata = collection_info.metadata or {}
                
                if not metadata.get("indexes_created", False):
                    # Set up standard payload indexes
                    self.setup_payload_indexes(collection_name, self.STANDARD_FIELD_MAPPINGS)
                    # Mark indexes as created
                    self.client.update_collection(
                        collection_name=collection_name,
                        metadata={
                            **metadata,
                            "indexes_created": True
                        }
                    )
                else:
                    logger.info(f"Indexes already exist for collection: {collection_name}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to set up collection: {str(e)}")
            # Log more details about the error
            if hasattr(e, '__dict__'):
                logger.error(f"Error details: {e.__dict__}")
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
        batch_size: int = 4,
        max_retries: int = 3
    ) -> bool:
        """
        Store documents in the fixed collection with source tracking.
        Always uses the fixed collection name regardless of input.
        """
        try:
            if not texts:
                logger.warning("No documents to store")
                return False
            
            # Always use fixed collection
            collection_name = collection_config.STORAGE_NAME
            
            total_docs = len(texts)
            if self.verbose:
                logger.info(f"Generating embeddings for {total_docs} documents...")
            
            # Ensure metadata list exists
            if metadata_list is None or len(metadata_list) == 0:
                metadata_list = [{}]
            
            # Get base document metadata from the first item
            document_metadata = metadata_list[0]
            
            # Generate unique document ID if not provided
            timestamp = int(time.time() * 1000)  # Millisecond timestamp
            if "document_id" not in document_metadata:
                document_metadata["document_id"] = f"doc_{timestamp}"
            
            # Find the next available point ID from Document table
            last_document = self.db.query(Document).order_by(Document.point_end.desc()).first()
            next_point_id = (last_document.point_end + 1) if last_document else 0
            
            # Create new Document record
            new_document = Document(
                document_id=document_metadata["document_id"],
                display_name=document_metadata.get("display_name", document_metadata.get("original_filename", f"Document {timestamp}")),
                file_name=document_metadata.get("original_filename", ""),
                file_type=document_metadata.get("file_type", ""),
                document_type=DocumentType.REGULATION,  # Default to REGULATION for uploaded documents
                department=document_metadata.get("department", Department.GENERAL),
                description=document_metadata.get("description", ""),
                impact_date=document_metadata.get("impact_date"),
                effective_date=document_metadata.get("effective_date"),
                expiry_date=document_metadata.get("expiry_date"),
                reference_number=document_metadata.get("reference_number", ""),
                total_chunks=total_docs,
                point_start=next_point_id,
                point_end=next_point_id + total_docs - 1,
                created_by=document_metadata.get("upload_by", 1)  # Default to admin user
            )
            
            # Add and commit to get the document ID
            self.db.add(new_document)
            self.db.commit()
            self.db.refresh(new_document)
            
            # Create metadata for points
            point_metadata = {
                "document_id": new_document.document_id,
                "display_name": new_document.display_name,
                "document_type": new_document.document_type.value,  # Use enum value
                "department": new_document.department.value,  # Use enum value
                "description": new_document.description,
                "reference_number": new_document.reference_number,
                "impact_date": new_document.impact_date.isoformat() if new_document.impact_date else None,
                "effective_date": new_document.effective_date.isoformat() if new_document.effective_date else None,
                "expiry_date": new_document.expiry_date.isoformat() if new_document.expiry_date else None,
                "file_name": new_document.file_name,
                "file_type": new_document.file_type,
                "upload_date": datetime.now().isoformat(),
                "upload_by": document_metadata.get("upload_by", "admin")
            }
            
            # Process in batches
            start_time = time.time()
            failed_batches = []
            total_points = 0
            
            for i in range(0, total_docs, batch_size):
                batch_end = min(i + batch_size, total_docs)
                batch_texts = texts[i:batch_end]
                
                # Preprocess texts
                processed_texts = []
                for text in batch_texts:
                    # Remove any non-printable characters
                    text = ''.join(char for char in text if char.isprintable())
                    # Limit text length to prevent CUDA issues
                    if len(text) > 256:
                        text = text[:256]
                    processed_texts.append(text)
                
                success = False
                retry_count = 0
                use_cpu = False
                
                while not success and retry_count < max_retries:
                    try:
                        # Generate embeddings
                        batch_embeddings = self.doc_encoder.encode(
                            processed_texts,
                            batch_size=2,
                            show_progress_bar=self.verbose,
                            convert_to_numpy=True,
                            normalize_embeddings=True,
                            device='cpu' if use_cpu else None
                        )
                        
                        # Prepare points
                        points = []
                        for j, (text, embedding) in enumerate(zip(batch_texts, batch_embeddings)):
                            # Generate point ID based on document's point range
                            point_id = new_document.point_start + i + j
                            
                            # Create payload with simplified structure
                            payload = {
                                "text": text,
                                "metadata": point_metadata,
                                "chunk_info": {
                                    "chunk_id": point_id,
                                    "chunk_index": i + j,
                                    "total_chunks": total_docs,
                                    "chunk_size": len(text),
                                    "chunk_overlap": self.chunk_overlap
                                }
                            }
                            
                            point = models.PointStruct(
                                id=point_id,
                                vector=embedding.tolist(),
                                payload=payload
                            )
                            points.append(point)
                        
                        # Store vectors
                        self.client.upsert(
                            collection_name=self.current_collection,
                            points=points
                        )
                        
                        total_points += len(points)
                        success = True
                        
                    except Exception as e:
                        retry_count += 1
                        if retry_count < max_retries:
                            logger.warning(f"Batch {i}-{batch_end} failed (attempt {retry_count}/{max_retries}): {str(e)}")
                            if retry_count == 2:
                                use_cpu = True
                                logger.info(f"Switching to CPU for batch {i}-{batch_end}")
                            time.sleep(1)
                        else:
                            logger.error(f"Batch {i}-{batch_end} failed after {max_retries} attempts: {str(e)}")
                            failed_batches.append((i, batch_end))
                            # If batch fails, rollback document creation
                            self.db.delete(new_document)
                            self.db.commit()
                
                if self.verbose:
                    progress = batch_end / total_docs * 100
                    logger.info(f"Progress: {progress:.1f}% ({batch_end}/{total_docs})")
            
            elapsed = time.time() - start_time
            
            if failed_batches:
                logger.warning(f"Failed to process {len(failed_batches)} batches after {elapsed:.2f} seconds")
                for start, end in failed_batches:
                    logger.warning(f"Failed batch: documents {start}-{end}")
                # Rollback document creation if any batch failed
                self.db.delete(new_document)
                self.db.commit()
                return False
            else:
                logger.info(f"Successfully stored {total_points} points from {total_docs} chunks in {elapsed:.2f} seconds")
                return True
            
        except Exception as e:
            logger.error(f"Failed to store documents: {str(e)}")
            # Ensure document is rolled back in case of error
            if 'new_document' in locals():
                self.db.delete(new_document)
                self.db.commit()
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
        """List all collections with their names."""
        try:
            # Get all collections in one API call
            collections_list = self.client.get_collections().collections
            collections_info = []
            
            for collection in collections_list:
                collections_info.append({
                    "name": collection.name
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

    def get_collection_size(self, collection_name: str) -> int:
        """Get the number of vectors in a collection."""
        try:
            # For now, return 0 as we don't need vectors_count
            return 0
        except Exception as e:
            logger.error(f"Failed to get collection size for {collection_name}: {str(e)}")
            return 0

    def delete_document_points(self, document_id: str) -> bool:
        """
        Delete all points belonging to a specific document.
        Args:
            document_id: ID of the document whose points should be deleted
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create filter to match document_id
            filter = Filter(
                must=[
                    FieldCondition(
                        key="metadata.system.document_info.document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
            
            # Delete all points matching the filter
            self.client.delete(
                collection_name=self.current_collection,
                points_selector=filter
            )
            logger.info(f"Successfully deleted all points for document: {document_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete document points: {str(e)}")
            return False

    def get_document_points(self, document_id: str) -> List[Dict[str, Any]]:
        """
        Get all points belonging to a specific document.
        Args:
            document_id: ID of the document whose points should be retrieved
        Returns:
            List[Dict[str, Any]]: List of point payloads
        """
        try:
            filter = Filter(
                must=[
                    FieldCondition(
                        key="metadata.system.document_info.document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
            
            # Scroll through all points of the document
            points = self.client.scroll(
                collection_name=self.current_collection,
                scroll_filter=filter,
                limit=100  # Adjust based on needs
            )[0]
            
            return [point.payload for point in points]
        except Exception as e:
            logger.error(f"Failed to get document points: {str(e)}")
            return []

    def update_document_points(self, document_id: str, new_metadata: Dict[str, Any]) -> bool:
        """
        Update metadata for all points belonging to a specific document.
        Args:
            document_id: ID of the document whose points should be updated
            new_metadata: New metadata to apply to the points
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            filter = Filter(
                must=[
                    FieldCondition(
                        key="metadata.system.document_info.document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
            
            # Update payload for all matching points
            self.client.update_vectors(
                collection_name=self.current_collection,
                points_selector=filter,
                payload={"metadata": new_metadata}
            )
            logger.info(f"Successfully updated metadata for document: {document_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update document points: {str(e)}")
            return False

    def get_document_by_name(self, document_name: str) -> Optional[Dict[str, Any]]:
        """
        Get document info by its display name.
        Args:
            document_name: Display name of the document
        Returns:
            Optional[Dict[str, Any]]: Document info if found, None otherwise
        """
        try:
            filter = Filter(
                must=[
                    FieldCondition(
                        key="metadata.system.document_info.display_name",
                        match=MatchValue(value=document_name)
                    )
                ]
            )
            
            # Get first matching point
            points = self.client.scroll(
                collection_name=self.current_collection,
                scroll_filter=filter,
                limit=1
            )[0]
            
            if points:
                return points[0].payload.get("metadata", {}).get("system", {}).get("document_info")
            return None
        except Exception as e:
            logger.error(f"Failed to get document by name: {str(e)}")
            return None

    def update_document(
        self,
        document_id: str,
        texts: List[str],
        metadata: Optional[Dict[str, Any]] = None,
        batch_size: int = 4
    ) -> bool:
        """
        Update a document's content by deleting old points and storing new ones.
        
        Args:
            document_id: ID of the document to update
            texts: New text chunks to store
            metadata: New metadata for the document
            batch_size: Batch size for storing new points
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Step 1: Get existing document
            existing_doc = self.db.query(Document).filter(Document.document_id == document_id).first()
            if not existing_doc:
                logger.error(f"Document not found: {document_id}")
                return False
                
            # Step 2: Delete existing points
            if not self.delete_document_points(document_id):
                logger.error(f"Failed to delete old points for document: {document_id}")
                return False
            
            # Step 3: Find next available point ID
            last_document = self.db.query(Document).filter(Document.id != existing_doc.id).order_by(Document.point_end.desc()).first()
            next_point_id = (last_document.point_end + 1) if last_document else 0
            
            # Step 4: Update document record
            existing_doc.point_start = next_point_id
            existing_doc.point_end = next_point_id + len(texts) - 1
            existing_doc.total_chunks = len(texts)
            
            if metadata:
                # Update other fields if provided
                for key, value in metadata.items():
                    if hasattr(existing_doc, key):
                        setattr(existing_doc, key, value)
            
            # Commit changes
            self.db.commit()
            
            # Step 5: Store new points with updated metadata
            metadata = {
                "document_id": existing_doc.document_id,
                "display_name": existing_doc.display_name,
                "document_type": existing_doc.document_type,
                "department": existing_doc.department,
                "description": existing_doc.description,
                "reference_number": existing_doc.reference_number,
                "impact_date": existing_doc.impact_date,
                "effective_date": existing_doc.effective_date,
                "expiry_date": existing_doc.expiry_date
            }
            
            success = self.store_documents(
                collection_name=self.current_collection,
                texts=texts,
                metadata_list=[metadata],
                batch_size=batch_size
            )
            
            if success:
                logger.info(f"Successfully updated document: {document_id}")
                return True
            else:
                # Rollback document changes if point storage failed
                self.db.rollback()
                logger.error(f"Failed to store new points for document: {document_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating document: {str(e)}")
            self.db.rollback()
            return False 