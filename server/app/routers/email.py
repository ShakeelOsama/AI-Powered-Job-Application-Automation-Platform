from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.schemas.common import APIResponse
from app.services.email_service import send_job_email

router = APIRouter(prefix="/email", tags=["email"])


class SendEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    body: str  # Cover letter or custom body
    resume_id: int


class SendEmailResponse(BaseModel):
    message: str
    to_email: str


@router.post("/send", response_model=APIResponse[SendEmailResponse])
async def send_email(
    request: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send an email with resume attachment"""
    
    # Get the selected resume
    resume = db.query(Resume).filter(
        Resume.id == request.resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Check if user has connected Gmail
    if not current_user.gmail_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please connect your Gmail account first in your profile"
        )
    
    # Send email (token is automatically decrypted by SQLAlchemy)
    try:
        send_job_email(
            user_refresh_token=current_user.gmail_refresh_token,
            to_email=request.to_email,
            subject=request.subject,
            body=request.body,
            storage_id=resume.storage_id,
            resume_filename=resume.name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
    
    return APIResponse(
        success=True,
        data=SendEmailResponse(
            message="Email sent successfully",
            to_email=request.to_email
        ),
        message="Email sent successfully"
    )
