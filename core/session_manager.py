"""
Chat Session Manager - Manages chat history and sessions
"""
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ChatSessionManager:
    """Manages chat sessions and history for users"""
    
    def __init__(self, session_dir: str = "data/sessions"):
        """
        Initialize session manager
        
        Args:
            session_dir: Directory to store session files
        """
        self.session_dir = session_dir
        os.makedirs(session_dir, exist_ok=True)
        logger.info(f"Session manager initialized with directory: {session_dir}")
    
    def _get_session_file(self, user_id: int, session_id: str) -> str:
        """Get path to session file"""
        return os.path.join(self.session_dir, f"user_{user_id}_session_{session_id}.json")
    
    def create_session(self, user_id: int, session_id: str) -> Dict[str, Any]:
        """
        Create a new chat session
        
        Args:
            user_id: User ID
            session_id: Session ID
            
        Returns:
            Session data
        """
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "messages": []
        }
        
        session_file = self._get_session_file(user_id, session_id)
        with open(session_file, 'w', encoding='utf-8') as f:
            json.dump(session_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Created session {session_id} for user {user_id}")
        return session_data
    
    def get_session(self, user_id: int, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data
        
        Args:
            user_id: User ID
            session_id: Session ID
            
        Returns:
            Session data or None if not found
        """
        session_file = self._get_session_file(user_id, session_id)
        
        if not os.path.exists(session_file):
            logger.warning(f"Session {session_id} not found for user {user_id}")
            return None
        
        with open(session_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def add_message(
        self,
        user_id: int,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Add a message to session
        
        Args:
            user_id: User ID
            session_id: Session ID
            role: Message role (user/assistant)
            content: Message content
            metadata: Additional metadata
            
        Returns:
            Success status
        """
        session = self.get_session(user_id, session_id)
        
        if session is None:
            session = self.create_session(user_id, session_id)
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        session["messages"].append(message)
        session["updated_at"] = datetime.now().isoformat()
        
        session_file = self._get_session_file(user_id, session_id)
        with open(session_file, 'w', encoding='utf-8') as f:
            json.dump(session, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Added {role} message to session {session_id}")
        return True
    
    def get_chat_history(
        self,
        user_id: int,
        session_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get chat history for context
        
        Args:
            user_id: User ID
            session_id: Session ID
            limit: Maximum number of messages to return
            
        Returns:
            List of messages
        """
        session = self.get_session(user_id, session_id)
        
        if session is None:
            return []
        
        messages = session.get("messages", [])
        return messages[-limit:] if limit else messages
    
    def list_user_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """
        List all sessions for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of session summaries
        """
        sessions = []
        prefix = f"user_{user_id}_session_"
        
        for filename in os.listdir(self.session_dir):
            if filename.startswith(prefix):
                session_file = os.path.join(self.session_dir, filename)
                with open(session_file, 'r', encoding='utf-8') as f:
                    session = json.load(f)
                    sessions.append({
                        "session_id": session["session_id"],
                        "created_at": session["created_at"],
                        "updated_at": session["updated_at"],
                        "message_count": len(session["messages"])
                    })
        
        return sorted(sessions, key=lambda x: x["updated_at"], reverse=True)
    
    def delete_session(self, user_id: int, session_id: str) -> bool:
        """
        Delete a session
        
        Args:
            user_id: User ID
            session_id: Session ID
            
        Returns:
            Success status
        """
        session_file = self._get_session_file(user_id, session_id)
        
        if os.path.exists(session_file):
            os.remove(session_file)
            logger.info(f"Deleted session {session_id} for user {user_id}")
            return True
        
        return False
    
    def clear_old_sessions(self, days: int = 30) -> int:
        """
        Clear sessions older than specified days
        
        Args:
            days: Age threshold in days
            
        Returns:
            Number of sessions deleted
        """
        from datetime import timedelta
        
        count = 0
        cutoff = datetime.now() - timedelta(days=days)
        
        for filename in os.listdir(self.session_dir):
            if filename.endswith('.json'):
                session_file = os.path.join(self.session_dir, filename)
                with open(session_file, 'r', encoding='utf-8') as f:
                    session = json.load(f)
                    updated_at = datetime.fromisoformat(session["updated_at"])
                    
                    if updated_at < cutoff:
                        os.remove(session_file)
                        count += 1
        
        logger.info(f"Cleared {count} old sessions")
        return count
