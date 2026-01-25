from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.resume import Resume
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.resume import ResumeResponse, ResumeListResponse
from app.services.storage_service import upload_resume, delete_resume
from app.services.storage_service import get_resume_content
from app.services.embedding_service import extract_text_from_pdf, get_embedding

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.get("", response_model=APIResponse[List[ResumeListResponse]])
async def get_user_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all resumes for the current user"""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    return APIResponse(
        success=True,
        data=resumes,
        message="Resumes retrieved successfully"
    )


@router.post("", response_model=APIResponse[ResumeResponse])
async def create_resume(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a new resume"""
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Upload to local storage
    upload_result = await upload_resume(file, current_user.id)
    
    if not upload_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {upload_result.get('error', 'Unknown error')}"
        )
    
    # Save to database
    new_resume = Resume(
        user_id=current_user.id,
        name=name,
        file_path=upload_result["file_path"],
        storage_id=upload_result["storage_id"]
    )

    # extract text and generate embedding
    pdf_content = get_resume_content(new_resume.storage_id)
    text = extract_text_from_pdf(pdf_content)
    embedding = get_embedding(text)
    new_resume.embedding = embedding

    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    
    return APIResponse(
        success=True,
        data=new_resume,
        message="Resume uploaded successfully"
    )


@router.get("/{resume_id}", response_model=APIResponse[ResumeResponse])
async def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific resume"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    return APIResponse(
        success=True,
        data=resume,
        message="Resume retrieved successfully"
    )


@router.delete("/{resume_id}", response_model=APIResponse)
async def delete_resume_endpoint(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a resume"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Delete from local storage
    storage_result = delete_resume(resume.storage_id)
    
    if not storage_result["success"]:
        # Log the error but still delete from database
        print(f"Warning: Failed to delete from storage: {storage_result.get('error')}")
    
    # Delete from database
    db.delete(resume)
    db.commit()
    
    return APIResponse(
        success=True,
        data=None,
        message="Resume deleted successfully"
    )
