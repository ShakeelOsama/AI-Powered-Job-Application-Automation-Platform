from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.schemas.common import APIResponse
from app.services.gemini_service import generate_cover_letter_from_pdf
from app.services.storage_service import get_resume_content

router = APIRouter(prefix="/jobs", tags=["jobs"])


class CoverLetterRequest(BaseModel):
    job_description: str
    resume_id: int


class CoverLetterResponse(BaseModel):
    cover_letter: str
    resume_name: str


@router.post("/generate-cover-letter", response_model=APIResponse[CoverLetterResponse])
async def create_cover_letter(
    request: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a cover letter using Gemini AI based on resume and job description"""
    
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
    
    if not request.job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required"
        )
    
    try:
        # Get PDF content from local storage
        pdf_content = get_resume_content(resume.storage_id)
        
        # Generate cover letter from PDF content
        cover_letter = await generate_cover_letter_from_pdf(
            pdf_content=pdf_content,
            job_description=request.job_description
        )
        
        return APIResponse(
            success=True,
            data=CoverLetterResponse(
                cover_letter=cover_letter,
                resume_name=resume.name
            ),
            message="Cover letter generated successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate cover letter: {str(e)}"
        )
    
