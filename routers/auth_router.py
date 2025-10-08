"""
Simple Authentication Router with Demo Accounts
Không dùng database, chỉ load từ JSON file
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import os
from datetime import datetime, timedelta
import secrets

router = APIRouter()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# In-memory token storage (trong production nên dùng Redis)
active_tokens: Dict[str, Dict[str, Any]] = {}

# Load demo accounts
ACCOUNTS_FILE = "data/demo_accounts.json"

def load_demo_accounts():
    """Load demo accounts from JSON file"""
    if not os.path.exists(ACCOUNTS_FILE):
        return {"users": []}
    
    with open(ACCOUNTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Find user by username"""
    accounts = load_demo_accounts()
    for user in accounts.get("users", []):
        if user["username"] == username:
            return user
    return None

def create_token(user: Dict[str, Any]) -> str:
    """Create a simple token"""
    token = secrets.token_urlsafe(32)
    active_tokens[token] = {
        "user": user,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
    }
    return token

def validate_token(token: str) -> Optional[Dict[str, Any]]:
    """Validate token and return user data"""
    if token not in active_tokens:
        return None
    
    token_data = active_tokens[token]
    expires_at = datetime.fromisoformat(token_data["expires_at"])
    
    if datetime.now() > expires_at:
        del active_tokens[token]
        return None
    
    return token_data["user"]

# Request/Response Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str
    full_name: str
    role: str = "student"

# Endpoints

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    Login with demo account
    """
    user = find_user_by_username(credentials.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập không tồn tại"
        )
    
    if user["password"] != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu không đúng"
        )
    
    # Create token
    token = create_token(user)
    
    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/register")
async def register(data: RegisterRequest):
    """
    Register new user (add to JSON file)
    """
    # Check if user exists
    if find_user_by_username(data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập đã tồn tại"
        )
    
    # Load current accounts
    accounts = load_demo_accounts()
    
    # Create new user
    new_user = {
        "id": len(accounts["users"]) + 1,
        "username": data.username,
        "password": data.password,
        "email": data.email,
        "full_name": data.full_name,
        "role": data.role,
        "created_at": datetime.now().isoformat()
    }
    
    accounts["users"].append(new_user)
    
    # Save to file
    with open(ACCOUNTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(accounts, f, ensure_ascii=False, indent=2)
    
    return {"message": "Đăng ký thành công", "user_id": new_user["id"]}

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """
    Logout and invalidate token
    """
    if token in active_tokens:
        del active_tokens[token]
    
    return {"message": "Đăng xuất thành công"}

@router.get("/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Get current user info
    """
    user = validate_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn"
        )
    
    # Remove password from response
    return {k: v for k, v in user.items() if k != "password"}

@router.get("/demo-accounts")
async def get_demo_accounts():
    """
    Get list of demo accounts (for testing purposes)
    """
    accounts = load_demo_accounts()
    return {
        "total": len(accounts["users"]),
        "accounts": [
            {
                "username": user["username"],
                "role": user["role"],
                "full_name": user.get("full_name", "")
            }
            for user in accounts["users"]
        ]
    }

# Dependency for protected routes
async def get_current_user_dependency(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency to get current user from token
    """
    user = validate_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )
    
    return user
