import asyncio
import json
import re
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.celery_config import celery_app
from app.core.database import SessionLocal
from app.models.job_application import JobApplication, JobApplicationStatus
from app.models.resume import Resume
from app.models.user import User
from app.models.user_info import UserInfo
from app.services.gemini_service import analyze_job_description, generate_cover_letter_from_pdf
from app.services.embedding_service import compare_job_with_resumes
from app.services.storage_service import get_resume_content
from app.services.email_service import send_job_email


def update_job_status(db: Session, job_id: int, status: str, message: str = None, error: str = None):
    """Update job application status in database"""
    job = db.query(JobApplication).filter(JobApplication.id == job_id).first()
    if job:
        job.status = status
        job.status_message = message
        if error:
            job.error_message = error
        job.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(job)
    return job


def parse_json_from_response(response_text: str) -> dict:
    """Parse JSON from Gemini response that may contain markdown code blocks"""
    # Remove markdown code blocks if present
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = response_text
    
    # Clean and parse
    json_str = json_str.strip()
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return {}


@celery_app.task(bind=True, name="run_job_automation_task")
def run_job_automation_task(self, job_id: int, user_id: int, job_description: str, recruiter_email: str):
    """
    Celery task to run the complete job automation pipeline:
    1. Analyze job description
    2. Select best resume or generate new one
    3. Generate cover letter
    4. Send email to recruiter
    """
    # Create database session for this task
    db = SessionLocal()
    
    try:
        # Get user info
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            update_job_status(db, job_id, JobApplicationStatus.FAILED, "User not found", "User does not exist")
            return {"status": "failed", "error": "User not found"}
        
        if not user.gmail_refresh_token:
            update_job_status(db, job_id, JobApplicationStatus.FAILED, "Gmail not connected", "Please connect your Gmail account first")
            return {"status": "failed", "error": "Gmail not connected"}
        
        # Fetch user info for personalized cover letter
        user_info_record = db.query(UserInfo).filter(UserInfo.user_id == user_id).first()
        user_info_dict = None
        if user_info_record:
            user_info_dict = {
                "full_name": user_info_record.full_name,
                "email": user_info_record.email,
                "phone": user_info_record.phone,
                "location": user_info_record.location,
                "linkedin": user_info_record.linkedin,
                "github": user_info_record.github,
                "portfolio": user_info_record.portfolio,
                "summary": user_info_record.summary,
                "skills": user_info_record.skills or [],
            }
        
        # Step 1: Analyze Job Description
        update_job_status(db, job_id, JobApplicationStatus.ANALYZING_JD, "Analyzing job description...")
        
        try:
            # Run async function in sync context
            jd_analysis_text = asyncio.run(analyze_job_description(job_description))
            jd_data = parse_json_from_response(jd_analysis_text)
        except Exception as e:
            jd_data = {}
        
        # Update job with extracted info
        job = db.query(JobApplication).filter(JobApplication.id == job_id).first()
        job.job_title = jd_data.get('job_title', 'Job Application')
        job.company_name = jd_data.get('company_name', '')
        
        # Use provided recruiter email or extracted one
        final_recruiter_email = recruiter_email or jd_data.get('recruiter_email', '')
        if not final_recruiter_email:
            update_job_status(db, job_id, JobApplicationStatus.FAILED, "No recruiter email", "Please provide a recruiter email address")
            return {"status": "failed", "error": "No recruiter email"}
        
        job.recruiter_email = final_recruiter_email
        db.commit()
        
        # Step 2: Select Best Resume
        update_job_status(db, job_id, JobApplicationStatus.SELECTING_RESUME, "Finding best matching resume...")
        
        matching_resumes = compare_job_with_resumes(job_description, user_id, db)
        
        selected_resume = None
        resume_content = None
        
        if matching_resumes and len(matching_resumes) > 0:
            # Use best matching resume
            best_match = matching_resumes[0]
            resume = db.query(Resume).filter(Resume.id == best_match['resume_id']).first()
            if resume:
                selected_resume = resume
                resume_content = get_resume_content(resume.storage_id)
                
                job.resume_id = resume.id
                job.resume_storage_id = resume.storage_id
                job.resume_generated = "false"
                db.commit()
        else:
            # Use first available resume as fallback
            update_job_status(db, job_id, JobApplicationStatus.SELECTING_RESUME, "Using available resume...")
            
            try:
                base_resume = db.query(Resume).filter(Resume.user_id == user_id).first()
                if base_resume:
                    resume_content = get_resume_content(base_resume.storage_id)
                    selected_resume = base_resume
                    job.resume_id = base_resume.id
                    job.resume_storage_id = base_resume.storage_id
                    job.resume_generated = "false"
                    db.commit()
                else:
                    update_job_status(db, job_id, JobApplicationStatus.FAILED, "No resume found", "Please upload at least one resume")
                    return {"status": "failed", "error": "No resume found"}
            except Exception as e:
                update_job_status(db, job_id, JobApplicationStatus.FAILED, "Resume loading failed", str(e))
                return {"status": "failed", "error": str(e)}
        
        if not resume_content:
            update_job_status(db, job_id, JobApplicationStatus.FAILED, "No resume available", "Could not load resume content")
            return {"status": "failed", "error": "No resume available"}
        
        # Step 3: Generate Cover Letter
        update_job_status(db, job_id, JobApplicationStatus.GENERATING_COVER_LETTER, "Generating personalized cover letter...")
        
        try:
            # Run async function in sync context with user info for personalization
            cover_letter = asyncio.run(generate_cover_letter_from_pdf(resume_content, job_description, user_info_dict))
            
            job = db.query(JobApplication).filter(JobApplication.id == job_id).first()
            job.cover_letter = cover_letter
            job.email_subject = f"Application for {job.job_title}" if job.job_title else "Job Application"
            db.commit()
        except Exception as e:
            update_job_status(db, job_id, JobApplicationStatus.FAILED, "Cover letter generation failed", str(e))
            return {"status": "failed", "error": str(e)}
        
        # Step 4: Send Email
        update_job_status(db, job_id, JobApplicationStatus.SENDING_EMAIL, "Sending application email...")
        
        try:
            send_job_email(
                user_refresh_token=user.gmail_refresh_token,
                to_email=final_recruiter_email,
                subject=job.email_subject,
                body=cover_letter,
                storage_id=job.resume_storage_id,
                resume_filename=f"Resume_{user.full_name or user.email.split('@')[0]}"
            )
            
            job = db.query(JobApplication).filter(JobApplication.id == job_id).first()
            job.email_sent_at = datetime.utcnow()
            job.status = JobApplicationStatus.COMPLETED
            job.status_message = "Application sent successfully!"
            db.commit()
            
            return {"status": "completed", "job_id": job_id}
            
        except Exception as e:
            update_job_status(db, job_id, JobApplicationStatus.FAILED, "Email sending failed", str(e))
            return {"status": "failed", "error": str(e)}
        
    except Exception as e:
        update_job_status(db, job_id, JobApplicationStatus.FAILED, "Automation failed", str(e))
        return {"status": "failed", "error": str(e)}
    
    finally:
        db.close()
        