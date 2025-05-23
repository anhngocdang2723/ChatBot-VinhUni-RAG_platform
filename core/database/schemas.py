from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models import DocumentType, Department

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    display_name: str
    file_name: str
    file_type: str
    document_type: DocumentType
    department: Department
    description: Optional[str] = None
    reference_number: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    document_id: str
    total_chunks: int
    page_count: int
    created_at: datetime
    created_by: int
    is_active: bool

    class Config:
        from_attributes = True 