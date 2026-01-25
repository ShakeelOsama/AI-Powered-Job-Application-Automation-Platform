from sentence_transformers import SentenceTransformer
import numpy as np
from io import BytesIO
from pdfminer.high_level import extract_text
from sqlalchemy import text
from app.models.resume import Resume
from app.core.database import SessionLocal

model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> np.ndarray:
    embedding = model.encode(text)
    return embedding.tolist()

def get_embeddings(texts: list[str]) -> list[np.ndarray]:
    embeddings = model.encode(texts)
    return [embedding.tolist() for embedding in embeddings]

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF bytes content"""
    # Convert bytes to file-like object
    pdf_file = BytesIO(pdf_content)
    text = extract_text(pdf_file)
    return text

def normalize_vector(vec: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return vec / norm

# function to compare job text with resumes of user 
def  compare_job_with_resumes(job_text: str, user_id: int, db: SessionLocal) -> list[float]:
    job_embedding = model.encode(job_text)

    # find cosine similarities between job embedding and resume embeddings 
    similarities = []

    query = text("""
        SELECT id, name, file_path, 1 - (embedding <=> CAST(:jd_embedding AS vector)) AS similarity
        FROM resumes
        WHERE user_id = :user_id AND embedding IS NOT NULL
        ORDER BY similarity DESC;
    """)
    result = db.execute(query, {"jd_embedding": str(job_embedding.tolist()), "user_id": user_id})

    # check if similarity is greater than 0.9 than return the storage_id of resume and else return empty list
    for row in result:
        if row.similarity >= 0.9:
            similarities.append({
                "resume_id": row.id,
                "file_name": row.name,
                "file_path": row.file_path,
                "similarity": row.similarity
            })
    return similarities

    



