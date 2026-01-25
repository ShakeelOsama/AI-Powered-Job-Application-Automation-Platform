from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import Response, JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import PyPDF2
import io
import base64

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.user_info import UserInfo
from app.models.resume import Resume
from app.schemas.user_info import (
    UserInfoCreate,
    UserInfoUpdate,
    UserInfoResponse,
    GenerateResumeRequest,
    GenerateResumeResponse
)
from app.schemas.common import APIResponse
from app.services.resume_generator_service import (
    extract_info_from_resume,
    generate_resume
)
from app.services.storage_service import save_generated_resume, get_resume_content
from app.services.embedding_service import extract_text_from_pdf, get_embedding

router = APIRouter(prefix="/user-info", tags=["user-info"])


@router.get("", response_model=APIResponse[Optional[UserInfoResponse]])
async def get_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_info = db.query(UserInfo).filter(UserInfo.user_id == current_user.id).first()
    
    return APIResponse(
        success=True,
        data=user_info,
        message="User info retrieved successfully" if user_info else "No user info found"
    )


@router.post("", response_model=APIResponse[UserInfoResponse])
async def create_or_update_user_info(
    data: UserInfoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_info = db.query(UserInfo).filter(UserInfo.user_id == current_user.id).first()
    
    if user_info:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(user_info, key, value)
        message = "User info updated successfully"
    else:
        user_info = UserInfo(user_id=current_user.id, **data.model_dump(exclude_unset=True))
        db.add(user_info)
        message = "User info created successfully"
    
    db.commit()
    db.refresh(user_info)
    
    return APIResponse(
        success=True,
        data=user_info,
        message=message
    )


@router.post("/extract-from-resume")
async def extract_from_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
    
    content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    
    try:
        extracted_data = extract_info_from_resume(text, "pdf")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract information: {str(e)}"
        )
    
    return APIResponse(
        success=True,
        data=extracted_data,
        message="Information extracted successfully. Review and save to update your profile."
    )


@router.post("/generate-resume")
async def generate_tailored_resume(
    request: GenerateResumeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tailored resume and save to storage"""
    user_info = db.query(UserInfo).filter(UserInfo.user_id == current_user.id).first()
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please complete your profile information first"
        )
    
    user_data = {
        "full_name": user_info.full_name,
        "email": user_info.email,
        "phone": user_info.phone,
        "location": user_info.location,
        "linkedin": user_info.linkedin,
        "github": user_info.github,
        "portfolio": user_info.portfolio,
        "summary": user_info.summary,
        "experience": user_info.experience or [],
        "education": user_info.education or [],
        "skills": user_info.skills or [],
        "certifications": user_info.certifications or [],
        "projects": user_info.projects or []
    }
    
    try:
        pdf_bytes = generate_resume(user_data, request.job_description)
        
        # Save the generated resume to storage and database
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"tailored_resume_{timestamp}.pdf"
        
        storage_result = save_generated_resume(pdf_bytes, current_user.id, filename)
        
        if not storage_result["success"]:
            raise Exception(storage_result.get("error", "Failed to save resume"))
        
        #create embedding
        text = extract_text_from_pdf(pdf_bytes)
        embedding = get_embedding(text)

        # Create database record
        resume_record = Resume(
            user_id=current_user.id,
            name=f"Tailored Resume - {timestamp}",
            file_path=storage_result["file_path"],
            storage_id=storage_result["storage_id"],
            embedding=embedding
        )
        db.add(resume_record)
        db.commit()
        db.refresh(resume_record)
        
        # Return success with resume ID
        return JSONResponse(content={
            "success": True,
            "data": {
                "resume_id": resume_record.id,
                "name": resume_record.name,
                "created_at": resume_record.created_at.isoformat()
            },
            "message": "Resume generated successfully"
        })
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate resume: {str(e)}"
        )


@router.get("/resume/{resume_id}/view")
async def view_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """View a previously generated resume as base64"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    try:
        pdf_bytes = get_resume_content(resume.storage_id)
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "pdf_base64": pdf_base64,
                "filename": f"{resume.name}.pdf"
            }
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load resume: {str(e)}"
        )


@router.get("/resume/{resume_id}/download")
async def download_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download a previously generated resume"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    try:
        pdf_bytes = get_resume_content(resume.storage_id)
        
        def iterfile():
            yield pdf_bytes
        
        return StreamingResponse(
            iterfile(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={resume.name}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download resume: {str(e)}"
        )
