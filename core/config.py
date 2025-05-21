from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    # Database settings
    postgres_db: str = "chatbot_rag"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/chatbot_rag"
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: str = "8000"
    debug: bool = False
    
    # Qdrant settings
    QDRANT_URL: str = "https://df7479a5-0686-45eb-a3e1-232c50d0b15d.us-east4-0.gcp.cloud.qdrant.io:6333"
    QDRANT_API_KEY: str
    DEFAULT_COLLECTION: str = "rag_documents"
    
    # LLM settings
    LLM_PROVIDER: str = "deepseek"  # or "grok"
    DEEPSEEK_API_KEY: str = "sk-be5d9f6d8d1f4597aa1b616b4efcea88"
    GROK_API_KEY: str = "xai-R0Vely3vJUqV3hOWIDuOb5dA7DUwZh1lYA815GKveHDdw2ZSH9EFuXwtFZQS2ZH5T6CqNYMzFXyHkOIy"
    
    # Application settings
    VERBOSE: bool = False
    secret_key: str = "unkillabledemonking"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings() 