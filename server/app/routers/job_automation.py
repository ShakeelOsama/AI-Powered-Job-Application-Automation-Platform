from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.user_info import UserInfo
from app.models.job_application import JobApplication, JobApplicationStatus
from app.schemas.job_application import (
    JobAutomationRequest,
    JobAutomationResponse,
    JobApplicationStatusResponse,
    JobApplicationListItem,
    JobApplicationListResponse
)
from app.services.automation_service import run_job_automation_task

router = APIRouter(prefix="/job-automation", tags=["Job Automation"])


@router.post("/start", response_model=JobAutomationResponse)
async def start_job_automation(
    request: JobAutomationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start the job automation process.
    This will analyze the job description, select/generate resume, 
    create cover letter, and send email to recruiter.
    """
    # Check if Gmail is connected
    if not current_user.gmail_refresh_token:
        raise HTTPException(
            status_code=400,
            detail="Please connect your Gmail account before using job automation"
        )
    
    # Check if user info is filled out
    user_info = db.query(UserInfo).filter(UserInfo.user_id == current_user.id).first()
    if not user_info:
        raise HTTPException(
            status_code=400,
            detail="Please fill out your profile information in My Info section before using job automation"
        )
    
    # Check if essential user info fields are filled
    if not user_info.full_name or not user_info.email:
        raise HTTPException(
            status_code=400,
            detail="Please complete your full name and email in My Info section before using job automation"
        )
    
    # Create job application record
    job_application = JobApplication(
        user_id=current_user.id,
        job_description=request.job_description,
        recruiter_email=request.recruiter_email,
        status=JobApplicationStatus.PENDING,
        status_message="Job application queued for processing"
    )
    
    db.add(job_application)
    db.commit()
    db.refresh(job_application)
    
    # Queue Celery task for background processing
    run_job_automation_task.delay(
        job_id=job_application.id,
        user_id=current_user.id,
        job_description=request.job_description,
        recruiter_email=request.recruiter_email or ""
    )
    
    return JobAutomationResponse(
        id=job_application.id,
        status=job_application.status,
        message="Job automation started. Poll the status endpoint to track progress."
    )


@router.get("/status/{job_id}", response_model=JobApplicationStatusResponse)
async def get_job_status(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the current status of a job application.
    Use this endpoint to poll for status updates.
    """
    job = db.query(JobApplication).filter(
        JobApplication.id == job_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    return job


@router.get("/applications", response_model=JobApplicationListResponse)
async def list_job_applications(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all job applications for the current user.
    Optionally filter by status.
    """
    query = db.query(JobApplication).filter(JobApplication.user_id == current_user.id)
    
    if status:
        query = query.filter(JobApplication.status == status)
    
    total = query.count()
    applications = query.order_by(JobApplication.created_at.desc()).offset(skip).limit(limit).all()
    
    return JobApplicationListResponse(
        applications=[JobApplicationListItem.model_validate(app) for app in applications],
        total=total
    )


@router.get("/application/{job_id}", response_model=JobApplicationStatusResponse)
async def get_job_application_details(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific job application.
    """
    job = db.query(JobApplication).filter(
        JobApplication.id == job_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    return job


@router.delete("/application/{job_id}")
async def delete_job_application(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a job application record.
    """
    job = db.query(JobApplication).filter(
        JobApplication.id == job_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    db.delete(job)
    db.commit()
    
    return {"message": "Job application deleted successfully"}


@router.post("/retry/{job_id}", response_model=JobAutomationResponse)
async def retry_job_automation(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retry a failed job automation.
    """
    job = db.query(JobApplication).filter(
        JobApplication.id == job_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    if job.status != JobApplicationStatus.FAILED:
        raise HTTPException(status_code=400, detail="Can only retry failed job applications")
    
    # Reset status
    job.status = JobApplicationStatus.PENDING
    job.status_message = "Retrying job application..."
    job.error_message = None
    db.commit()
    
    # Queue Celery task for background processing
    run_job_automation_task.delay(
        job_id=job.id,
        user_id=current_user.id,
        job_description=job.job_description,
        recruiter_email=job.recruiter_email or ""
    )
    
    return JobAutomationResponse(
        id=job.id,
        status=job.status,
        message="Job automation retry started."
    )
