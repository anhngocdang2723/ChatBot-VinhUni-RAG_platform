"""
Chat Session Router - Manages chat sessions and history
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from core.session_manager import ChatSessionManager
from core.auth.simple_auth_router import get_current_user_from_session
import uuid

router = APIRouter()

# Initialize session manager
session_manager = ChatSessionManager()

# Request/Response Models
class CreateSessionRequest(BaseModel):
    session_name: Optional[str] = None

class AddMessageRequest(BaseModel):
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    metadata: Optional[Dict[str, Any]] = None

class SessionResponse(BaseModel):
    session_id: str
    user_id: int
    created_at: str
    updated_at: str
    message_count: int

# Endpoints

@router.post("/sessions/create")
async def create_session(
    request: CreateSessionRequest,
    current_user: Dict = Depends(get_current_user_from_session)
):
    """
    Create a new chat session
    """
    session_id = str(uuid.uuid4())
    user_id = current_user["id"]
    
    session = session_manager.create_session(user_id, session_id)
    
    return {
        "session_id": session_id,
        "message": "Session created successfully"
    }

@router.get("/sessions/list")
async def list_sessions(
    current_user: Dict = Depends(get_current_user_from_session)
):
    """
    List all sessions for current user
    """
    user_id = current_user["id"]
    sessions = session_manager.list_user_sessions(user_id)
    
    return {"sessions": sessions, "count": len(sessions)}

@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user_from_session)
):
    """
    Get session details and messages
    """
    user_id = current_user["id"]
    session = session_manager.get_session(user_id, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session

@router.post("/sessions/message")
async def add_message(
    request: AddMessageRequest,
    current_user: Dict = Depends(get_current_user_from_session)
):
    """
    Add a message to session
    """
    user_id = current_user["id"]
    
    success = session_manager.add_message(
        user_id=user_id,
        session_id=request.session_id,
        role=request.role,
        content=request.content,
        metadata=request.metadata
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add message")
    
    return {"message": "Message added successfully"}

@router.get("/sessions/{session_id}/history")
async def get_chat_history(
    session_id: str,
    limit: int = 10,
    current_user: Dict = Depends(get_current_user_from_session)
):
    """
    Get chat history for a session
    """
    user_id = current_user["id"]
    
    history = session_manager.get_chat_history(user_id, session_id, limit)
    
    return {
        "session_id": session_id,
        "messages": history,
        "count": len(history)
    }

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user_from_session)
):
    """
    Delete a session
    """
    user_id = current_user["id"]
    
    success = session_manager.delete_session(user_id, session_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session deleted successfully"}

@router.post("/sessions/cleanup")
async def cleanup_old_sessions(
    days: int = 30,
    current_user: Dict = Depends(get_current_user_from_session)
):
    """
    Clean up old sessions (admin only)
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    count = session_manager.clear_old_sessions(days)
    
    return {
        "message": f"Cleaned up {count} old sessions",
        "deleted_count": count
    }
