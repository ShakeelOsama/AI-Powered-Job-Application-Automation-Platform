import google.generativeai as genai
import base64
from app.core.config import settings

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


async def generate_cover_letter_from_pdf(pdf_content: bytes, job_description: str, user_info: dict = None) -> str:
    """Generate a cover letter using Gemini AI from PDF content and user info"""
    try:
        # Use gemini-1.5-flash model (or gemini-2.0-flash-exp for newer API)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Build user info section for the prompt
        user_info_text = ""
        if user_info:
            user_info_text = f"""

Candidate Information:
- Full Name: {user_info.get('full_name', 'N/A')}
- Email: {user_info.get('email', 'N/A')}
- Phone: {user_info.get('phone', 'N/A')}
- Location: {user_info.get('location', 'N/A')}
- LinkedIn: {user_info.get('linkedin', 'N/A')}
- GitHub: {user_info.get('github', 'N/A')}
- Portfolio: {user_info.get('portfolio', 'N/A')}

Professional Summary:
{user_info.get('summary', 'N/A')}

Skills: {', '.join(user_info.get('skills', [])) if user_info.get('skills') else 'See resume'}
"""
        
        prompt = f"""
You are a professional cover letter writer. Based on the resume provided, the candidate information, and the job description below, 
write a compelling, professional, and HIGHLY PERSONALIZED cover letter.

Job Description:
{job_description}
{user_info_text}

INSTRUCTIONS:
1. Analyze the job description to understand what the company is looking for
2. Extract the company name, job title, and key requirements from the job description
3. Use the candidate's ACTUAL name, experience, and skills from the resume and provided info
4. Write a personalized cover letter that:
   - Addresses the hiring manager or uses "Dear Hiring Team" (extract company name from JD)
   - Opens with a specific mention of the company and role
   - Highlights 2-3 SPECIFIC experiences/projects from the resume that match the job requirements
   - Uses actual numbers and achievements from the resume
   - Shows genuine enthusiasm for THIS specific company and role
   - Ends with the candidate's ACTUAL name
   - dont write date in the letter

5. FORMAT RULES:
   - Keep it concise (150-250 words)
   - NO placeholder text like [Your Name], [Company Name] - use ACTUAL values
   - NO em dashes, NO bullet points
   - Use proper business letter format
   - Sign off with the candidate's actual full name

6. CRITICAL:
   - It MUST look like a human wrote it, NOT AI
   - NO generic phrases like "I am writing to express my keen interest" or "I am confident"
   - Use natural, conversational yet professional language
   - Be specific to THIS job and THIS company
   - Reference specific technologies/skills mentioned in the job description

Write the cover letter now:
"""
        
        # Generate content with the PDF using inline data
        response = model.generate_content([
            prompt,
            {
                "mime_type": "application/pdf",
                "data": base64.standard_b64encode(pdf_content).decode("utf-8")
            }
        ])
        
        return response.text
        
    except Exception as e:
        # Fallback: try with different model names
        for model_name in ['gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro']:
            try:
                model = genai.GenerativeModel(model_name)
                
                # Build user info for fallback
                fallback_user_info = ""
                if user_info:
                    fallback_user_info = f"""

Candidate Information:
- Full Name: {user_info.get('full_name', 'N/A')}
- Email: {user_info.get('email', 'N/A')}
- Summary: {user_info.get('summary', 'N/A')}
- Skills: {', '.join(user_info.get('skills', [])) if user_info.get('skills') else 'N/A'}
"""
                
                fallback_prompt = f"""
You are a professional cover letter writer. Based on the job description and candidate info below, 
write a compelling, personalized cover letter.

Job Description:
{job_description}
{fallback_user_info}

Instructions:
1. Write a personalized cover letter that:
   - Uses the candidate's actual name (if provided) 
   - Has a strong opening mentioning the company and role
   - Highlights how the candidate's skills match the job requirements
   - Shows enthusiasm for the role
   - Has a professional closing with the candidate's name
2. Keep it concise (about 250-300 words)
3. NO placeholder text like [Your Name] - use actual values
4. NO em dashes, NO bullet points
5. Must sound human-written, NOT AI-generated

Write the cover letter now:
"""
                response = model.generate_content(fallback_prompt)
                return response.text
            except:
                continue
        
        raise Exception(f"Failed to generate cover letter: {str(e)}")


#function to analyze job description and extract key details for embedding
async def analyze_job_description(job_description: str) -> dict:
    """Analyze job description to extract key details using Gemini AI"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f""" 
You are an expert job analyst. Analyze the following job description and extract key information.

Job Description:
{job_description}

CRITICAL INSTRUCTIONS:
1. Extract the recruiter's email address by looking for:
   - Email addresses after words like "Apply", "Send", "Contact", "Email", "careers", etc.
   - Email patterns (text@domain.com)
   - Email addresses near the end of the job description
   - Email addresses with emoji symbols like 📩, ✉️, 📧

2. Extract job_title from the main heading or position title
3. List required_skills as an array of technical skills mentioned
4. Determine experience_level (entry/junior/mid/senior)

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{{
    "job_title": "extracted job title",
    "required_skills": ["skill1", "skill2", "skill3"],
    "experience_level": "level",
    "recruiter_email": "email@domain.com or null if not found"
}}

IMPORTANT: Return ONLY the JSON object, nothing else. If recruiter_email is not found, use null (not a string "null").
"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Failed to analyze job description: {str(e)}")
    
