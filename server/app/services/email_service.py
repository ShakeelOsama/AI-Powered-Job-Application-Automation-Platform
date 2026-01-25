from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import base64
from app.core.config import settings
from app.services.storage_service import get_resume_content

def send_job_email(
    user_refresh_token: str,
    to_email: str,
    subject: str,
    body: str,
    storage_id: str,
    resume_filename: str
):

    creds = Credentials(
        None,
        refresh_token=user_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )
    creds.refresh(Request())
    service = build("gmail", "v1", credentials=creds)

    message = MIMEMultipart()
    message["to"] = to_email
    message["subject"] = subject

    message.attach(MIMEText(body, "plain"))


    pdf_content = get_resume_content(storage_id)
    attachment = MIMEBase("application", "pdf")
    attachment.set_payload(pdf_content)
    encoders.encode_base64(attachment)
    attachment.add_header(
        "Content-Disposition",
        f'attachment; filename="{resume_filename}.pdf"'
    )
    message.attach(attachment)


    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().messages().send(userId="me", body={"raw": raw}).execute()
