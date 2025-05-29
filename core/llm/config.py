from pydantic_settings import BaseSettings
from typing import Dict, Any
from functools import lru_cache

class CollectionConfig:
    """Configuration for the fixed collection used in the system"""
    STORAGE_NAME: str = "truong_dai_hoc_vinh"  # Internal name for storage
    DISPLAY_NAME: str = "Dữ liệu Trường Đại học Vinh"  # Display name for UI
    DESCRIPTION: str = "Tập dữ liệu tổng hợp của Trường Đại học Vinh"

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
    STORAGE_NAME: str
    DISPLAY_NAME: str
    DESCRIPTION: str
    
    # Chunking settings
    DEFAULT_CHUNK_SIZE: int
    DEFAULT_CHUNK_OVERLAP: int
    MIN_CHUNK_SIZE: int
    MAX_CHUNK_SIZE: int
    MIN_CHUNK_OVERLAP: int
    MAX_CHUNK_OVERLAP: int
    
    # API settings
    API_TITLE: str
    API_DESCRIPTION: str
    API_HOST: str
    API_PORT: int
    
    # Qdrant settings
    QDRANT_URL: str
    QDRANT_API_KEY: str
    DEFAULT_COLLECTION: str
    
    # File upload settings
    UPLOAD_DIR: str
    OUTPUT_DIR: str
    
    # Database settings
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    DATABASE_URL: str
    
    # LLM settings
    LLM_PROVIDER: str
    DEEPSEEK_API_KEY: str
    GROK_API_KEY: str
    
    # Application settings
    DEBUG: bool
    VERBOSE: bool
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Export collection config for easy access
collection_config = CollectionConfig()

settings = get_settings() 