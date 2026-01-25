from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List

class ExperienceItem(BaseModel):
    company: str
    position: str
    location: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    description: List[str] = []

class EducationItem(BaseModel):
    institution: str
    degree: str
    field: Optional[str] = None
    location: Optional[str] = None
    graduation_date: Optional[str] = None
    gpa: Optional[str] = None

class ProjectItem(BaseModel):
    name: str
    description: List[str] = []
    technologies: List[str] = []
    link: Optional[str] = None

class CertificationItem(BaseModel):
    name: str
    issuer: str
    date: Optional[str] = None
    credential_id: Optional[str] = None

class UserInfoBase(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    summary: Optional[str] = None
    experience: Optional[List[ExperienceItem]] = None
    education: Optional[List[EducationItem]] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[CertificationItem]] = None
    projects: Optional[List[ProjectItem]] = None

class UserInfoCreate(UserInfoBase):
    pass

class UserInfoUpdate(UserInfoBase):
    pass

class UserInfoResponse(UserInfoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int

class GenerateResumeRequest(BaseModel):
    job_description: str

class GenerateResumeResponse(BaseModel):
    resume_url: str
    message: str
