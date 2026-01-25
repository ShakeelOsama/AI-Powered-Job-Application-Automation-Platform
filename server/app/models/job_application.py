from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class JobApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    ANALYZING_JD = "analyzing_jd"
    SELECTING_RESUME = "selecting_resume"
    GENERATING_COVER_LETTER = "generating_cover_letter"
    SENDING_EMAIL = "sending_email"
    COMPLETED = "completed"
    FAILED = "failed"


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Job Details
    job_description = Column(Text, nullable=False)
    job_title = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    recruiter_email = Column(String, nullable=True)
    
    # Status tracking
    status = Column(String, default=JobApplicationStatus.PENDING)
    status_message = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Resume used
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    resume_storage_id = Column(String, nullable=True)
    resume_generated = Column(String, default="false")  # "true" if resume was generated, "false" if existing
    
    # Cover letter
    cover_letter = Column(Text, nullable=True)
    
    # Email details
    email_subject = Column(String, nullable=True)
    email_sent_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="job_applications")
    resume = relationship("Resume", backref="job_applications")
