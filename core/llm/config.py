from pydantic_settings import BaseSettings
from typing import Dict, Any
from functools import lru_cache
from pydantic import Field

class CollectionConfig:
    """Configuration for the fixed collection used in the system"""
    STORAGE_NAME: str = "truong_dai_hoc_vinh"  # Internal name for storage
    DISPLAY_NAME: str = "Dữ liệu Trường Đại học Vinh"  # Display name for UI
    DESCRIPTION: str = "Tập dữ liệu tổng hợp của Trường Đại học Vinh"
    
    # Collection configuration
    VECTOR_SIZE: int = 384  # Default for all-MiniLM-L6-v2
    DISTANCE: str = "Cosine"
    DEFAULT_SEGMENT_NUMBER: int = 2
    MAX_OPTIMIZATION_THREADS: int = 4
    MEMMAP_THRESHOLD: int = 1000
    INDEXING_THRESHOLD: int = 50000
    FLUSH_INTERVAL_SEC: int = 30
    M: int = 16
    EF_CONSTRUCT: int = 100
    FULL_SCAN_THRESHOLD: int = 10000
    MAX_INDEXING_THREADS: int = 4

    @classmethod
    @lru_cache()
    def get_instance(cls) -> 'CollectionConfig':
        """Get singleton instance of CollectionConfig"""
        return cls()

class ChunkingConfig:
    """Configuration for document chunking"""
    DEFAULT_CHUNK_SIZE: int = 1000
    DEFAULT_CHUNK_OVERLAP: int = 200
    MIN_CHUNK_SIZE: int = 100
    MAX_CHUNK_SIZE: int = 10000
    MIN_CHUNK_OVERLAP: int = 0
    MAX_CHUNK_OVERLAP: int = 5000

class Settings(BaseSettings):
    """Main application settings loaded from environment variables"""
    # Collection settings
    STORAGE_NAME: str = Field(default=CollectionConfig.STORAGE_NAME)
    DISPLAY_NAME: str = Field(default=CollectionConfig.DISPLAY_NAME)
    DESCRIPTION: str = Field(default=CollectionConfig.DESCRIPTION)
    
    # Collection configuration
    collection_config: Dict[str, Any] = Field(
        default_factory=lambda: {
            "vector_size": CollectionConfig.VECTOR_SIZE,
            "distance": CollectionConfig.DISTANCE,
            "default_segment_number": CollectionConfig.DEFAULT_SEGMENT_NUMBER,
            "max_optimization_threads": CollectionConfig.MAX_OPTIMIZATION_THREADS,
            "memmap_threshold": CollectionConfig.MEMMAP_THRESHOLD,
            "indexing_threshold": CollectionConfig.INDEXING_THRESHOLD,
            "flush_interval_sec": CollectionConfig.FLUSH_INTERVAL_SEC,
            "m": CollectionConfig.M,
            "ef_construct": CollectionConfig.EF_CONSTRUCT,
            "full_scan_threshold": CollectionConfig.FULL_SCAN_THRESHOLD,
            "max_indexing_threads": CollectionConfig.MAX_INDEXING_THREADS
        }
    )
    
    # Chunking settings
    DEFAULT_CHUNK_SIZE: int = Field(default=ChunkingConfig.DEFAULT_CHUNK_SIZE)
    DEFAULT_CHUNK_OVERLAP: int = Field(default=ChunkingConfig.DEFAULT_CHUNK_OVERLAP)
    MIN_CHUNK_SIZE: int = Field(default=ChunkingConfig.MIN_CHUNK_SIZE)
    MAX_CHUNK_SIZE: int = Field(default=ChunkingConfig.MAX_CHUNK_SIZE)
    MIN_CHUNK_OVERLAP: int = Field(default=ChunkingConfig.MIN_CHUNK_OVERLAP)
    MAX_CHUNK_OVERLAP: int = Field(default=ChunkingConfig.MAX_CHUNK_OVERLAP)
    
    # API settings
    API_TITLE: str = "Chatbot RAG API"
    API_DESCRIPTION: str = "API for Chatbot RAG system"
    API_HOST: str = "localhost"
    API_PORT: int = 8000
    
    # Qdrant settings
    QDRANT_URL: str
    QDRANT_API_KEY: str
    DEFAULT_COLLECTION: str = CollectionConfig.STORAGE_NAME
    
    # File upload settings
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"
    
    # Database settings
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    DATABASE_URL: str
    
    # LLM settings
    LLM_PROVIDER: str = "deepseek"
    DEEPSEEK_API_KEY: str
    GROK_API_KEY: str
    
    # Application settings
    DEBUG: bool = False
    VERBOSE: bool = False
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Initialize settings and collection config
settings = get_settings()
collection_config = CollectionConfig.get_instance() 