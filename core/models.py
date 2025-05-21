from sqlalchemy import Column, Integer, String, Boolean, DateTime
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    full_name = Column(String)
    avatar_url = Column(String)
    role = Column(String)
    last_login = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True) 