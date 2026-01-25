from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class JobApplicationStatus(str, Enum):
    PENDING = "pending"
    ANALYZING_JD = "analyzing_jd"
    SELECTING_RESUME = "selecting_resume"
    GENERATING_COVER_LETTER = "generating_cover_letter"
    SENDING_EMAIL = "sending_email"
    COMPLETED = "completed"
    FAILED = "failed"


class JobAutomationRequest(BaseModel):
    job_description: str
    recruiter_email: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_description": "We are looking for a Senior Python Developer...",
                "recruiter_email": "recruiter@company.com"
            }
        }


class JobAutomationResponse(BaseModel):
    id: int
    status: str
    message: str
    
    class Config:
        from_attributes = True


class JobApplicationStatusResponse(BaseModel):
    id: int
    status: str
    status_message: Optional[str] = None
    error_message: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    resume_id: Optional[int] = None
    resume_generated: Optional[str] = None
    cover_letter: Optional[str] = None
    email_sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobApplicationListItem(BaseModel):
    id: int
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    status: str
    status_message: Optional[str] = None
    resume_generated: Optional[str] = None
    email_sent_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobApplicationListResponse(BaseModel):
    applications: List[JobApplicationListItem]
    total: int


class JobAnalysisResult(BaseModel):
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    required_skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    recruiter_email: Optional[str] = None
