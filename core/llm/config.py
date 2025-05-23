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
    """Main application settings"""
    # Collection settings
    collection_config: CollectionConfig = CollectionConfig()
    
    # Chunking settings
    chunking_config: ChunkingConfig = ChunkingConfig()
    
    # API settings
    API_TITLE: str = "Chatbot Vinhuni API"
    API_DESCRIPTION: str = "API for RAG-based chatbot with multiple LLM provider support"
    
    # Qdrant settings
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    
    # File upload settings
    UPLOAD_DIR: str = "data/uploads"
    OUTPUT_DIR: str = "output"
    
    # Database settings
    POSTGRES_DB: str = "chatbot_rag"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/chatbot_rag"
    
    # API settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False
    
    # LLM settings
    LLM_PROVIDER: str = "deepseek"  # or "grok"
    DEEPSEEK_API_KEY: str = "sk-be5d9f6d8d1f4597aa1b616b4efcea88"
    GROK_API_KEY: str = "xai-R0Vely3vJUqV3hOWIDuOb5dA7DUwZh1lYA815GKveHDdw2ZSH9EFuXwtFZQS2ZH5T6CqNYMzFXyHkOIy"
    
    # Application settings
    VERBOSE: bool = False
    SECRET_KEY: str = "unkillabledemonking"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Export collection config for easy access
collection_config = CollectionConfig()

settings = get_settings() 