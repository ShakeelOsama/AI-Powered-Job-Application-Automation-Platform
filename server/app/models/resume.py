from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from pgvector.sqlalchemy import Vector

from app.core.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Full path to the file
    storage_id = Column(String, nullable=False)  # Relative path for storage operations
    created_at = Column(DateTime, default=datetime.utcnow)
    embedding = Column(Vector(384))  # all-MiniLM-L6-v2 produces 384-dimensional embeddings

    user = relationship("User", back_populates="resumes")