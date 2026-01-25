from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.encryption import EncryptedType
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    gmail_refresh_token = Column(EncryptedType(), nullable=True)
    is_gmail_connected = Column(Boolean, default=False)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    user_info = relationship("UserInfo", back_populates="user", uselist=False, cascade="all, delete-orphan")
    job_applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")

