"""
Simple Authentication Router using demo accounts
No JWT, no database - just simple session-based auth for demo
"""
from fastapi import APIRouter, HTTPException, status, Response, Cookie
from pydantic import BaseModel
from typing import Optional
import secrets
from datetime import datetime, timedelta
import logging

from core.auth.auth_service import auth_service

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory session store (for demo only)
# In production, use Redis or similar
sessions = {}

class LoginRequest(BaseModel):
    username: str
    password: str
    portal: Optional[str] = None  # User's selected portal: "portal" or "elearning"

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    session_id: Optional[str] = None

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    """
    Login with demo account
    
    Validates user access to selected portal:
    - admin: only "portal"
    - lecturer: only "elearning"
    - student: can access both "portal" and "elearning"
    
    Returns user data with portal field matching user's selection.
    """
    logger.info(f"Login attempt for username: {request.username}, selected portal: {request.portal}")
    
    # Authenticate user
    user_data = auth_service.authenticate(request.username, request.password)
    
    if not user_data:
        logger.warning(f"Failed login attempt for username: {request.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng"
        )
    
    # Get user role and default portal from account config
    user_role = user_data['role']
    requested_portal = request.portal or user_data['portal']
    
    # Validate portal access based on role
    if user_role == 'admin':
        # Admin can only access portal
        if requested_portal != 'portal':
            logger.warning(f"Admin {request.username} tried to access {requested_portal}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quản trị viên chỉ có thể truy cập Cổng Sinh Viên"
            )
        final_portal = 'portal'
        
    elif user_role == 'lecturer':
        # Lecturer can only access elearning
        if requested_portal != 'elearning':
            logger.warning(f"Lecturer {request.username} tried to access {requested_portal}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Giảng viên chỉ có thể truy cập hệ thống E-Learning"
            )
        final_portal = 'elearning'
        
    elif user_role == 'student':
        # Student can access both portals
        if requested_portal not in ['portal', 'elearning']:
            logger.warning(f"Invalid portal {requested_portal} for student {request.username}")
            requested_portal = 'elearning'  # Default to elearning
        final_portal = requested_portal
        
    else:
        # Unknown role
        logger.error(f"Unknown role {user_role} for user {request.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vai trò người dùng không hợp lệ"
        )
    
    # Update user_data with validated portal
    user_data['portal'] = final_portal
    
    # Create session
    session_id = secrets.token_urlsafe(32)
    sessions[session_id] = {
        "user": user_data,
        "created_at": datetime.now(),
        "last_access": datetime.now()
    }
    
    # Set session cookie
    # Use SameSite=None for cross-origin requests (Vercel → Cloudflare Tunnel)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,  # Required for SameSite=None
        max_age=86400,  # 24 hours
        samesite="none",  # Allow cross-origin cookie
        domain=None  # Let browser handle it
    )
    
    logger.info(f"Successful login: username={request.username}, role={user_role}, portal={final_portal}")
    
    return LoginResponse(
        success=True,
        message="Đăng nhập thành công",
        user=user_data,
        session_id=session_id
    )

@router.post("/logout")
async def logout(
    response: Response,
    session_id: Optional[str] = Cookie(None)
):
    """Logout and clear session"""
    if session_id and session_id in sessions:
        del sessions[session_id]
        logger.info(f"Session {session_id} logged out")
    
    # Clear cookie
    response.delete_cookie(key="session_id")
    
    return {"success": True, "message": "Đăng xuất thành công"}

@router.get("/me")
async def get_current_user(session_id: Optional[str] = Cookie(None)):
    """Get current user from session"""
    if not session_id or session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    session = sessions[session_id]
    
    # Update last access time
    session["last_access"] = datetime.now()
    
    return {
        "success": True,
        "user": session["user"]
    }

@router.post("/refresh")
async def refresh_session(
    response: Response,
    session_id: Optional[str] = Cookie(None)
):
    """Refresh session to extend expiry"""
    if not session_id or session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Update session
    sessions[session_id]["last_access"] = datetime.now()
    
    # Extend cookie
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        max_age=86400,
        samesite="lax"
    )
    
    return {
        "success": True,
        "message": "Session refreshed"
    }

# Cleanup old sessions periodically (simple implementation)
def cleanup_old_sessions():
    """Remove sessions older than 24 hours"""
    now = datetime.now()
    expired = []
    
    for session_id, session in sessions.items():
        if now - session["last_access"] > timedelta(hours=24):
            expired.append(session_id)
    
    for session_id in expired:
        del sessions[session_id]
        logger.info(f"Cleaned up expired session: {session_id}")
    
    return len(expired)

@router.get("/sessions/count")
async def get_session_count():
    """Get active session count (admin only)"""
    return {
        "active_sessions": len(sessions),
        "cleaned": cleanup_old_sessions()
    }

# Dependency for protected routes
async def get_current_user_from_session(auth_session_id: Optional[str] = Cookie(None, alias="session_id")):
    """
    Dependency to get current user from session cookie.
    Use this in protected routes that require authentication.
    
    The cookie name is 'session_id' but the parameter is named 'auth_session_id'
    to avoid conflicts with route path parameters named 'session_id'.
    
    Example:
        from core.auth.simple_auth_router import get_current_user_from_session
        
        @router.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user_from_session)):
            return {"user": user}
        
        # Works even with session_id in path:
        @router.get("/sessions/{session_id}")
        async def get_session(
            session_id: str,
            user: dict = Depends(get_current_user_from_session)
        ):
            return {"session_id": session_id, "user": user}
    """
    if not auth_session_id or auth_session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    session = sessions[auth_session_id]
    
    # Check if session is expired (24 hours)
    if datetime.now() - session["last_access"] > timedelta(hours=24):
        del sessions[auth_session_id]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    
    # Update last access time
    sessions[auth_session_id]["last_access"] = datetime.now()
    
    return session["user"]
