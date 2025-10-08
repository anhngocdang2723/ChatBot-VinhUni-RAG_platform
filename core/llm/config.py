from pydantic_settings import BaseSettings
from typing import Dict, Any
from functools import lru_cache
from pydantic import Field

class CollectionConfig:
    """Configuration for the fixed index used in the system"""
    STORAGE_NAME: str = "truong-dai-hoc-vinh"  # Pinecone index name (lowercase, no spaces)
    DISPLAY_NAME: str = "Dữ liệu Trường Đại học Vinh"  # Display name for UI
    DESCRIPTION: str = "Tập dữ liệu tổng hợp của Trường Đại học Vinh"
    
    # Pinecone configuration
    DIMENSION: int = 1536  # OpenAI text-embedding-3-small dimension
    METRIC: str = "cosine"  # Distance metric for Pinecone
    CLOUD: str = "aws"  # Cloud provider
    REGION: str = "us-east-1"  # Region

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
    
    # Pinecone configuration
    pinecone_config: Dict[str, Any] = Field(
        default_factory=lambda: {
            "dimension": CollectionConfig.DIMENSION,
            "metric": CollectionConfig.METRIC,
            "cloud": CollectionConfig.CLOUD,
            "region": CollectionConfig.REGION
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
    
    # Pinecone settings
    PINECONE_API_KEY: str = Field(default="")
    PINECONE_ENVIRONMENT: str = "us-east-1"
    DEFAULT_INDEX: str = CollectionConfig.STORAGE_NAME
    PINECONE_DENSE_INDEX: str = f"{CollectionConfig.STORAGE_NAME}-dense"
    PINECONE_SPARSE_INDEX: str = f"{CollectionConfig.STORAGE_NAME}-sparse"
    
    # File upload settings
    UPLOAD_DIR: str = "data/uploads"
    OUTPUT_DIR: str = "data/outputs"
    
    # Database settings (SQLite)
    DATABASE_URL: str = "sqlite:///./data/chatbot_rag.db"
    
    # LLM settings
    DASHSCOPE_API_KEY: str = Field(default="")  # For Qwen3-Max LLM
    EMBEDDING_MODEL: str = "llama-text-embed-v2"  # For Pinecone integrated inference
    LLM_PROVIDER: str = "qwen"  # Default to Qwen3-Max
    LLM_MODEL: str = "qwen3-max"
    
    # Application settings
    DEBUG: bool = False
    VERBOSE: bool = False
    SECRET_KEY: str = Field(default="")
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