from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, BigInteger, Text, ForeignKey
from .database import Base
from datetime import datetime
import enum

class DocumentType(str, enum.Enum):
    REGULATION = "REGULATION"  # Quy định
    POLICY = "POLICY"         # Chính sách
    NOTICE = "NOTICE"         # Thông báo
    CIRCULAR = "CIRCULAR"     # Thông tư
    DECISION = "DECISION"     # Quyết định
    GUIDELINE = "GUIDELINE"   # Hướng dẫn

class Department(str, enum.Enum):
    ACADEMIC_AFFAIRS = "ACADEMIC_AFFAIRS"           # Phòng Đào tạo
    STUDENT_AFFAIRS = "STUDENT_AFFAIRS"            # Phòng Công tác sinh viên
    SCIENCE_TECHNOLOGY = "SCIENCE_TECHNOLOGY"      # Phòng Khoa học công nghệ
    FINANCE = "FINANCE"                           # Phòng Tài chính
    PERSONNEL = "PERSONNEL"                       # Phòng Tổ chức cán bộ
    INTERNATIONAL_RELATIONS = "INTERNATIONAL"      # Phòng Hợp tác quốc tế
    QUALITY_ASSURANCE = "QUALITY_ASSURANCE"       # Phòng Đảm bảo chất lượng
    FACILITY = "FACILITY"                         # Phòng Cơ sở vật chất
    GENERAL = "GENERAL"                           # Văn phòng

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    full_name = Column(String)
    avatar_url = Column(String)
    role = Column(String)
    last_login = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String)
    file_hash = Column(String(64), index=True, comment="SHA-256 hash of file content")
    file_size = Column(BigInteger)
    document_type = Column(Enum(DocumentType), default=DocumentType.REGULATION)
    department = Column(Enum(Department), default=Department.GENERAL)
    description = Column(Text, nullable=True)
    impact_date = Column(DateTime, nullable=True)
    effective_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    reference_number = Column(String, nullable=True)
    total_chunks = Column(Integer, default=0)
    point_start = Column(Integer)
    point_end = Column(Integer)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True) 