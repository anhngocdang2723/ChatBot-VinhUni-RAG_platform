"""
Dependency Injection for FastAPI routes.
Provides singleton instances of services for the application.
"""

from functools import lru_cache
from fastapi import Depends
from sqlalchemy.orm import Session

from core.pinecone.pinecone_service import PineconeService
from core.document_processing.document_processor import DocumentProcessor
from core.query.query_service import QueryService
from core.llm.llm_interface import RAGPromptManager, create_llm_provider
from core.llm.config import get_settings
from core.database.database import get_db

settings = get_settings()

@lru_cache()
def get_pinecone_service() -> PineconeService:
    """
    Get singleton Pinecone service instance.
    
    Returns:
        PineconeService instance
    """
    pinecone_service = PineconeService(
        api_key=settings.PINECONE_API_KEY,
        environment=settings.PINECONE_ENVIRONMENT
    )
    
    # Setup indexes on first access
    pinecone_service.setup_indexes()
    
    return pinecone_service

def get_document_processor(
    db: Session = Depends(get_db),
    pinecone_service: PineconeService = Depends(get_pinecone_service)
) -> DocumentProcessor:
    """
    Get Document Processor instance.
    
    Args:
        db: Database session
        pinecone_service: Pinecone service
        
    Returns:
        DocumentProcessor instance
    """
    return DocumentProcessor(
        pinecone_service=pinecone_service,
        db=db,
        chunk_size=settings.DEFAULT_CHUNK_SIZE,
        chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP
    )

@lru_cache()
def get_query_service() -> QueryService:
    """
    Get singleton Query Service instance.
    
    Returns:
        QueryService instance
    """
    pinecone_service = get_pinecone_service()
    return QueryService(pinecone_service=pinecone_service)

@lru_cache()
def get_prompt_manager() -> RAGPromptManager:
    """
    Get singleton RAG Prompt Manager instance.
    
    Returns:
        RAGPromptManager instance
    """
    # Use Qwen3-Max as the LLM provider
    llm_provider = create_llm_provider(
        provider_name=settings.LLM_PROVIDER,
        api_key=settings.DASHSCOPE_API_KEY
    )
    
    return RAGPromptManager(llm_provider)
