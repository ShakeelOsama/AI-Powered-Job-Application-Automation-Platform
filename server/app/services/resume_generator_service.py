import subprocess
import tempfile
import json
import os
from pathlib import Path
from typing import Dict, Any
import google.generativeai as genai
import requests
from app.core.config import settings

TEMPLATE_PATH = Path(__file__).parent.parent / "templates" / "template.tex"

# MiKTeX installation path
MIKTEX_PATH = Path(os.path.expanduser("~")) / "AppData" / "Local" / "Programs" / "MiKTeX" / "miktex" / "bin" / "x64" / "pdflatex.exe"

def get_pdflatex_command():
    """Get the pdflatex command, checking platform-specific paths."""

    if os.name == "nt" and MIKTEX_PATH.exists():
        return str(MIKTEX_PATH)
    
    if os.path.exists("/usr/bin/pdflatex"):
        return "/usr/bin/pdflatex"
    
    return "pdflatex"


def extract_info_from_resume(resume_content: str, file_extension: str) -> Dict[str, Any]:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""Extract all relevant information from this resume and return it as a JSON object.
    
The JSON should have this exact structure:
{{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "portfolio": "string",
  "summary": "string - professional summary",
  "experience": [
    {{
      "company": "string",
      "position": "string",
      "location": "string",
      "start_date": "string (e.g., Jan 2020)",
      "end_date": "string or null if current",
      "description": ["bullet point 1", "bullet point 2"]
    }}
  ],
  "education": [
    {{
      "institution": "string",
      "degree": "string",
      "field": "string",
      "location": "string",
      "graduation_date": "string",
      "gpa": "string or null"
    }}
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "certifications": [
    {{
      "name": "string",
      "issuer": "string",
      "date": "string",
      "credential_id": "string or null"
    }}
  ],
  "projects": [
    {{
      "name": "string",
      "description": ["bullet point 1", "bullet point 2"],
      "technologies": ["tech1", "tech2"],
      "link": "string or null"
    }}
  ]
}}

Resume content:
{resume_content}

Return ONLY the JSON object, no additional text."""

    response = model.generate_content(prompt)
    result_text = response.text.strip()
    
    if result_text.startswith("```json"):
        result_text = result_text[7:]
    if result_text.startswith("```"):
        result_text = result_text[3:]
    if result_text.endswith("```"):
        result_text = result_text[:-3]
    
    return json.loads(result_text.strip())


def generate_resume_latex(user_info: Dict[str, Any], job_description: str) -> str:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""You are an expert resume writer and LaTeX specialist. Create a professional, ATS-friendly resume tailored to the job description using the EXACT template structure shown below.

CRITICAL REQUIREMENTS:
1. The resume MUST fit on ONE PAGE only
2. Follow the EXACT template structure and commands shown below
3. Tailor content to match job description keywords
4. Use strong action verbs and quantify achievements
5. Generate ONLY the content between \\begin{{document}} and \\end{{document}}
6. Do NOT include \\documentclass or package imports

TEMPLATE STRUCTURE TO FOLLOW:
```
\\begin{{document}}

%----------HEADING----------
\\begin{{center}}
  {{\\Huge \\scshape [Full Name]}} \\\\ \\vspace{{2pt}}
  \\textit{{[Job Title/Role]}} \\\\ \\vspace{{1pt}}
  [Location] \\\\ \\vspace{{1pt}}
  \\small \\raisebox{{-0.1\\height}}\\faPhone\\ [Phone] ~
  \\href{{mailto:[email]}}{{\\raisebox{{-0.2\\height}}\\faEnvelope\\ [Email]}} ~
  \\href{{[linkedin]}}{{\\raisebox{{-0.1\\height}}\\faLinkedin\\ LinkedIn}} ~
  \\href{{[github]}}{{\\raisebox{{-0.2\\height}}\\faGithub\\ GitHub}} ~
  \\href{{[portfolio]}}{{\\raisebox{{-0.2\\height}}\\faGlobe\\ Portfolio}}
  \\vspace{{-8pt}}
\\end{{center}}

%-----------SUMMARY-----------
\\section{{SUMMARY}}
\\begin{{itemize}}[leftmargin=0.15in, label={{}}]
  \\item{{
    [2-3 line professional summary highlighting key skills and experience]
  }}
\\end{{itemize}}

%-----------EXPERIENCE-----------
\\section{{EXPERIENCE}}
\\resumeSubHeadingListStart

\\resumeSubheading
    {{[Company Name]}}{{[Start Date] -- [End Date or Present]}}
    {{[Job Title]}}{{[Location]}}
    \\resumeItemListStart
      \\resumeItem{{[Achievement with metrics and impact]}}
      \\resumeItem{{[Achievement with metrics and impact]}}
      \\resumeItem{{[Achievement with metrics and impact]}}
      \\resumeItem{{[Achievement with metrics and impact]}}
    \\resumeItemListEnd

\\resumeSubHeadingListEnd

%-----------PROJECTS-----------
\\section{{PROJECTS}}
  \\resumeSubHeadingListStart
\\resumeProjectHeading{{\\textbf{{[Project Name]}} $|$  \\bluelink{{[URL]}}{{Live}} $|$  \\emph{{[Technologies]}}}}{{}}
    \\resumeItemListStart
      \\resumeItem{{[Project description and impact]}}
      \\resumeItem{{[Key feature or achievement]}}
    \\resumeItemListEnd
  \\resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\\section{{TECHNICAL SKILLS}}
  \\begin{{itemize}}[leftmargin=0.15in, label={{}}]
    \\small{{\\item{{
      \\textbf{{Category:}} Skill1, Skill2, Skill3 \\\\ \\vspace{{0.4em}}
      \\textbf{{Category:}} Skill1, Skill2, Skill3 \\\\ \\vspace{{0.4em}}
      \\textbf{{Category:}} Skill1, Skill2, Skill3
    }}}}
  \\end{{itemize}}

%-----------EDUCATION-----------
\\section{{EDUCATION}}
\\resumeSubHeadingListStart
\\vspace{{0.8em}}
\\resumeSubheading
{{[University Name]}}{{[Start Year] -- [End Year]}}
{{[Degree in Field of Study]}}{{[Location]}}
\\resumeSubHeadingListEnd

\\end{{document}}
```

CRITICAL SYNTAX RULES:
- Do NOT use \\parbox in the education section
- Keep degree/field simple: "BS Software Engineering" or "Bachelor of Science in Computer Science"
- Do NOT use nested formatting like \\[4pt] inside parameters
- Do NOT use & (ampersand) characters - write "and" instead or use hyphens/slashes
- Skills categories: use simple text like "Frontend", "Backend", "DevOps", NOT "Backend & Database"
- Escape all special characters properly
- Match ALL curly braces {{}}
- Use simple text only in section parameters
- Always end \\resumeSubHeadingListStart with \\resumeSubHeadingListEnd
- Close all \\begin{{itemize}} with \\end{{itemize}}

User Information:
{json.dumps(user_info, indent=2)}

Job Description:
{job_description}

Instructions:
1. Replace ALL placeholders with actual user data
2. Tailor experience and projects to job requirements
3. Include 2-4 most relevant work experiences with 3-5 bullet points each
4. List skills in categories (Frontend, Backend, DevOps, Tools) - NO ampersands (&)
5. Keep it to ONE PAGE - be selective about what to include
6. Use \\textbf{{}} for emphasis and quantify results
7. For projects, use \\bluelink{{URL}}{{Text}} for links
8. Omit sections if user has no data for them
9. CRITICAL: Keep education simple - just degree name and field, NO nested formatting
10. Test all LaTeX syntax - ensure braces are balanced
11. NEVER use & character - use "and", "/", or "-" instead
12. Always match \\resumeSubHeadingListStart with \\resumeSubHeadingListEnd

Generate the complete LaTeX content now:"""

    response = model.generate_content(prompt)
    latex_content = response.text.strip()
    
    if latex_content.startswith("```latex"):
        latex_content = latex_content[8:]
    if latex_content.startswith("```"):
        latex_content = latex_content[3:]
    if latex_content.endswith("```"):
        latex_content = latex_content[:-3]
    
    return latex_content.strip()


def compile_latex_to_pdf(latex_content: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)
        
        # Read the template and combine with generated content
        with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
            template = f.read()
        
        # Extract the preamble (everything before \begin{document})
        preamble = template.split(r'\begin{document}')[0] + r'\begin{document}'
        
        # Clean up the generated content - remove any preamble commands
        cleaned_content = latex_content.strip()
        
        # Remove \begin{document} if present
        if r'\begin{document}' in cleaned_content:
            cleaned_content = cleaned_content.split(r'\begin{document}', 1)[1]
        
        # Remove \end{document} if present
        if r'\end{document}' in cleaned_content:
            cleaned_content = cleaned_content.rsplit(r'\end{document}', 1)[0]
        
        # Remove any \documentclass or \usepackage commands that might have leaked through
        lines = cleaned_content.split('\n')
        filtered_lines = []
        for line in lines:
            stripped = line.strip()
            if not (stripped.startswith(r'\documentclass') or 
                   stripped.startswith(r'\usepackage') or
                   stripped.startswith(r'\input{') or
                   stripped == r'\begin{document}' or
                   stripped == r'\end{document}'):
                filtered_lines.append(line)
        
        cleaned_content = '\n'.join(filtered_lines)
        
        # Create the full LaTeX document
        full_latex = preamble + '\n' + cleaned_content + '\n' + r'\end{document}'
        
        tex_file = tmpdir_path / "resume.tex"
        with open(tex_file, 'w', encoding='utf-8') as f:
            f.write(full_latex)
        
        pdflatex_cmd = get_pdflatex_command()
        
        # Run pdflatex twice (standard practice - first run may install packages)
        # First run: allow package installation, use longer timeout
        result = subprocess.run(
            [pdflatex_cmd, "-interaction=nonstopmode", "--enable-installer", "resume.tex"],
            cwd=str(tmpdir_path),
            capture_output=True,
            timeout=180  # 3 minutes for package installation
        )
        
        # Second run: finalize the PDF (shorter timeout)
        if result.returncode == 0 or (tmpdir_path / "resume.pdf").exists():
            result = subprocess.run(
                [pdflatex_cmd, "-interaction=nonstopmode", "resume.tex"],
                cwd=str(tmpdir_path),
                capture_output=True,
                timeout=60
            )
        
        if result.returncode != 0:
            # Save the .tex file for debugging
            debug_dir = Path(__file__).parent.parent / "debug"
            debug_dir.mkdir(exist_ok=True)
            debug_tex = debug_dir / "last_failed_resume.tex"
            with open(debug_tex, 'w', encoding='utf-8') as f:
                f.write(full_latex)
            
            error_details = []
            
            # Capture stderr
            if result.stderr:
                stderr_text = result.stderr.decode('utf-8', errors='ignore')
                if stderr_text.strip():
                    error_details.append(f"STDERR:\n{stderr_text}")
            
            # Capture stdout
            if result.stdout:
                stdout_text = result.stdout.decode('utf-8', errors='ignore')
                if stdout_text.strip():
                    error_details.append(f"STDOUT:\n{stdout_text[-1000:]}")
            
            # Read log file
            error_log = tmpdir_path / "resume.log"
            if error_log.exists():
                with open(error_log, 'r', encoding='utf-8', errors='ignore') as f:
                    log_content = f.read()
                    # Extract relevant error lines
                    lines = log_content.split('\n')
                    error_lines = []
                    for i, line in enumerate(lines):
                        if 'error' in line.lower() or '!' in line or 'undefined' in line.lower():
                            # Get context around errors
                            start = max(0, i - 2)
                            end = min(len(lines), i + 3)
                            error_lines.extend(lines[start:end])
                    
                    if error_lines:
                        error_details.append(f"LOG ERRORS:\n" + '\n'.join(error_lines[-100:]))
                    else:
                        error_details.append(f"LOG (last 1500 chars):\n{log_content[-1500:]}")
                
                # Save log file for debugging
                debug_log = debug_dir / "last_failed_resume.log"
                with open(debug_log, 'w', encoding='utf-8') as f:
                    f.write(log_content)
            
            error_msg = '\n\n'.join(error_details) if error_details else "No error details available"
            error_msg += f"\n\nDebug files saved to: {debug_dir}"
            
            raise Exception(f"LaTeX compilation failed:\n{error_msg}")
        
        pdf_file = tmpdir_path / "resume.pdf"
        if not pdf_file.exists():
            raise Exception("PDF file was not generated")
            
        with open(pdf_file, 'rb') as f:
            return f.read()


def generate_resume(user_info: Dict[str, Any], job_description: str) -> bytes:
    latex_content = generate_resume_latex(user_info, job_description)
    pdf_bytes = compile_latex_to_pdf(latex_content)
    return pdf_bytes

def generate_resume_from_user_id(user_id: int, job_description: str, db) -> bytes:
   # get user info from database
    from app.models.user_info import UserInfo
    user = db.query(UserInfo).filter(UserInfo.user_id == user_id).first()
    if not user:
        raise ValueError(f"User with ID {user_id} not found")
    
    latex_content = generate_resume_latex(user.to_dict(), job_description)
    pdf_bytes = compile_latex_to_pdf(latex_content)
    return pdf_bytes