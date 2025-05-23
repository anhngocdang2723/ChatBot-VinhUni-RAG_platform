from functools import lru_cache
from core.document_processing.vector_store import VectorStore
from core.document_processing.retriever import Retriever, get_retriever_singleton
from core.llm.llm_interface import RAGPromptManager, create_llm_provider
from core.llm.config import get_settings
from core.document_processing.document_processor import DocumentProcessor
from core.database.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

settings = get_settings()

def get_vector_store(db: Session = Depends(get_db)) -> VectorStore:
    settings = get_settings()
    return VectorStore(
        qdrant_url=settings.QDRANT_URL,
        qdrant_api_key=settings.QDRANT_API_KEY,
        db=db,
        verbose=settings.VERBOSE,
        chunk_size=settings.chunking_config.DEFAULT_CHUNK_SIZE,
        chunk_overlap=settings.chunking_config.DEFAULT_CHUNK_OVERLAP
    )

@lru_cache()
def get_retriever() -> Retriever:
    return get_retriever_singleton(verbose=True)

@lru_cache()
def get_prompt_manager() -> RAGPromptManager:
    settings = get_settings()
    
    # Select the appropriate API key based on the provider
    api_key = settings.DEEPSEEK_API_KEY if settings.LLM_PROVIDER.lower() == "deepseek" else settings.GROK_API_KEY
    
    llm_provider = create_llm_provider(
        provider_name=settings.LLM_PROVIDER,
        api_key=api_key
    )
    return RAGPromptManager(llm_provider)

@lru_cache()
def get_document_processor() -> DocumentProcessor:
    return DocumentProcessor(
        chunk_size=1000,  # Default values, can be overridden when using
        chunk_overlap=200,
        upload_dir="data/uploads"
    ) 