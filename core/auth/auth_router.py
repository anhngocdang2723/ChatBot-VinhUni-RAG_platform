from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from core.database import SessionLocal
from core.database.models import User
from pydantic import BaseModel, EmailStr
import datetime
from core.auth.jwt_auth import create_access_token, decode_access_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str = None

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Hash password
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name,
        created_at=datetime.datetime.utcnow(),
        is_active=True,
        verified=False,
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"msg": "User registered successfully"}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không đúng")
    # Cập nhật last_login
    db_user.last_login = datetime.datetime.utcnow()
    db.commit()
    # Tạo JWT token
    token_data = {
        "sub": db_user.username,
        "user_id": db_user.id,
        "role": db_user.role
    }
    access_token = create_access_token(token_data)
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return payload

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user 