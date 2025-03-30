from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    # Qdrant settings
    QDRANT_URL: str = "https://df7479a5-0686-45eb-a3e1-232c50d0b15d.us-east4-0.gcp.cloud.qdrant.io:6333"
    QDRANT_API_KEY: str
    DEFAULT_COLLECTION: str = "rag_documents"
    
    # LLM settings
    LLM_PROVIDER: str = "deepseek"  # or "grok"
    DEEPSEEK_API_KEY: str
    GROK_API_KEY: str
    
    # Application settings
    VERBOSE: bool = False
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings() 