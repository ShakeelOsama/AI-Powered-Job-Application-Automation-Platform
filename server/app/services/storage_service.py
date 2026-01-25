import os
import uuid
from pathlib import Path
from fastapi import UploadFile

# Local storage directory for PDFs
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "resumes"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def upload_resume(file: UploadFile, user_id: int) -> dict:
    """Upload a PDF resume to local storage"""
    try:
        # Generate unique ID
        unique_id = str(uuid.uuid4())
        
        # Create user directory
        user_dir = UPLOAD_DIR / f"user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)
        
        # File path
        file_path = user_dir / f"{unique_id}.pdf"
        
        # Read and save file content
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        return {
            "success": True,
            "file_path": str(file_path),
            "storage_id": f"user_{user_id}/{unique_id}.pdf"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def delete_resume(storage_id: str) -> dict:
    """Delete a resume from local storage"""
    try:
        file_path = UPLOAD_DIR / storage_id
        if file_path.exists():
            os.remove(file_path)
            return {"success": True}
        return {"success": True, "message": "File not found, might already be deleted"}
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_resume_content(storage_id: str) -> bytes:
    """Get resume PDF content from local storage"""
    file_path = UPLOAD_DIR / storage_id
    if not file_path.exists():
        raise FileNotFoundError(f"Resume file not found: {storage_id}")
    
    with open(file_path, "rb") as f:
        return f.read()


def get_resume_path(storage_id: str) -> Path:
    """Get the full path to a resume file"""
    return UPLOAD_DIR / storage_id


def save_generated_resume(pdf_bytes: bytes, user_id: int, filename: str) -> dict:
    """Save a generated resume PDF to local storage"""
    try:
        # Generate unique ID
        unique_id = str(uuid.uuid4())
        
        # Create user directory
        user_dir = UPLOAD_DIR / f"user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)
        
        # File path with custom filename
        base_name = filename.replace('.pdf', '')
        file_path = user_dir / f"{base_name}_{unique_id}.pdf"
        
        # Save PDF bytes
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
        
        return {
            "success": True,
            "file_path": str(file_path),
            "storage_id": f"user_{user_id}/{base_name}_{unique_id}.pdf"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
