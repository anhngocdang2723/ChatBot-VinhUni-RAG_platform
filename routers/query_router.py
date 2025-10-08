from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from core.query.query_service import QueryService
from core.llm.llm_interface import RAGPromptManager
from core.utils.dependencies import get_query_service, get_prompt_manager
from core.llm.config import get_settings, CollectionConfig
from core.session_manager import ChatSessionManager
from core.auth.simple_auth_router import get_current_user_from_session
import logging

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

# Initialize session manager
session_manager = ChatSessionManager()

class QueryInput(BaseModel):
    query: str
    top_k: int = 12  # Optimized: Reduced from 15 for faster search
    top_n: int = 4   # Optimized: Reduced from 5 for faster reranking
    temperature: float = 0.2  # Optimized: Increased for faster generation
    max_tokens: int = 600  # Optimized: Increased for more complete answers
    model: Optional[str] = None
    image_data: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

@router.post("/rag", response_model=QueryResponse)
async def query_rag(
    query_input: QueryInput,
    query_service: QueryService = Depends(get_query_service),
    prompt_manager: RAGPromptManager = Depends(get_prompt_manager),
    current_user: dict = Depends(get_current_user_from_session)
) -> QueryResponse:
    """
    Process a RAG query with session management:
    1. Preprocess the query (handled by QueryService)
    2. Hybrid search (dense + sparse)
    3. Rerank documents
    4. Generate answer using LLM
    5. Save query and answer to session (if session_id provided)
    """
    logger.info(f"Query from user {current_user['username']}: {query_input.query}")
    
    # Query service handles: preprocessing → hybrid search → reranking → formatting
    documents = query_service.query(
        query=query_input.query,
        top_k=query_input.top_k,
        top_n=query_input.top_n,
        namespace=CollectionConfig.STORAGE_NAME
    )
    
    if not documents:
        return QueryResponse(
            answer="No relevant documents found for your query.",
            sources=[]
        )
    
    # Log additional parameters
    logger.info(f"Received model parameter: {query_input.model}")
    if query_input.image_data:
        logger.info(f"Received image data with length: {len(query_input.image_data)}")
    if query_input.context:
        logger.info(f"Received context with chat history length: {len(query_input.context.get('chat_history', []))}")
    
    # Generate answer using LLM (default to qwen3-max for better quality)
    model_name = query_input.model if query_input.model else "qwen3-max"
    result = prompt_manager.generate_answer(
        query=query_input.query,
        documents=documents,
        temperature=query_input.temperature,
        max_tokens=query_input.max_tokens,
        model=model_name,
        image_data=query_input.image_data,
        context=query_input.context
    )
    
    # Enhance source information
    sources = result.get("sources", [])
    for source in sources:
        if "metadata" in source:
            metadata = source["metadata"]
            # Add the namespace to the source for clarity
            source["namespace"] = metadata.get("namespace", CollectionConfig.STORAGE_NAME)
    
    # Save to session if session_id is provided in context
    session_id = None
    if query_input.context and isinstance(query_input.context, dict):
        session_id = query_input.context.get("session_id")
    
    if session_id:
        user_id = current_user["id"]
        try:
            # Ensure session exists
            session = session_manager.get_session(user_id, session_id)
            if not session:
                session = session_manager.create_session(user_id, session_id)
                logger.info(f"Created new session {session_id} for user {user_id}")
            
            # Save user query
            session_manager.add_message(
                user_id=user_id,
                session_id=session_id,
                role="user",
                content=query_input.query,
                metadata={
                    "top_k": query_input.top_k,
                    "top_n": query_input.top_n,
                    "model": model_name,
                    "temperature": query_input.temperature
                }
            )
            
            # Save assistant answer
            session_manager.add_message(
                user_id=user_id,
                session_id=session_id,
                role="assistant",
                content=result["answer"],
                metadata={
                    "sources_count": len(sources),
                    "model": model_name
                }
            )
            
            logger.info(f"Saved query and answer to session {session_id}")
        except Exception as e:
            logger.error(f"Failed to save to session: {e}")
            # Don't fail the request if session save fails
    
    return QueryResponse(**result)

@router.post("/retrieve")
async def retrieve_documents(
    query_input: QueryInput,
    query_service: QueryService = Depends(get_query_service)
) -> Dict[str, Any]:
    """Retrieve and rerank documents without LLM generation."""
    # retrieve_only already formats and returns a dict with query and documents
    result = query_service.retrieve_only(
        query=query_input.query,
        top_k=query_input.top_k,
        top_n=query_input.top_n,
        namespace=CollectionConfig.STORAGE_NAME
    )
    
    return result
