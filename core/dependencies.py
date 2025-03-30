from functools import lru_cache
from core.vector_store import VectorStore
from core.retriever import Retriever
from core.llm_interface import RAGPromptManager, create_llm_provider
from core.config import get_settings
from core.document_processor import DocumentProcessor

settings = get_settings()

@lru_cache()
def get_vector_store() -> VectorStore:
    return VectorStore(
        qdrant_url=settings.QDRANT_URL,
        qdrant_api_key=settings.QDRANT_API_KEY
    )

@lru_cache()
def get_retriever() -> Retriever:
    return Retriever(
        qdrant_url=settings.QDRANT_URL,
        qdrant_api_key=settings.QDRANT_API_KEY,
        verbose=True  # Enable verbose logging for debugging
    )

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