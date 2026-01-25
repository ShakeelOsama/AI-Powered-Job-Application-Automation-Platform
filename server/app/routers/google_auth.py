from fastapi import Depends, APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse 
from app.core.database import get_db
from app.models.user import User
from google_auth_oauthlib.flow import Flow
from app.core.config import settings
from sqlalchemy.orm import Session
from app.dependencies import get_current_user
import os

# Allow OAuth over HTTP in development
if settings.SERVER_URL.startswith("http://"):
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

router = APIRouter()

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

@router.get("/auth/google")
async def google_auth_start(current_user: User = Depends(get_current_user)):
    from jose import jwt
    token = jwt.encode({"user_id": current_user.id}, settings.SECRET_KEY, algorithm="HS256")

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [f"{settings.SERVER_URL}/api/auth/google/callback"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = f"{settings.SERVER_URL}/api/auth/google/callback"


    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=token,  
    )

    return {"auth_url": authorization_url}



@router.get("/auth/google/callback")
async def google_auth_callback(request: Request, db: Session = Depends(get_db)):
    from jose import jwt

    state_token = request.query_params.get("state")
    if not state_token:
        raise HTTPException(status_code=400, detail="Missing state token")

    try:
        payload = jwt.decode(state_token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired JWT in state")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [f"{settings.SERVER_URL}/api/auth/google/callback"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = f"{settings.SERVER_URL}/api/auth/google/callback"
    flow.fetch_token(authorization_response=str(request.url))

    credentials = flow.credentials
    refresh_token = credentials.refresh_token

    user.gmail_refresh_token = refresh_token
    user.is_gmail_connected = True
    db.commit()

    frontend_url = f"{settings.CLIENT_ORIGIN}/profile?gmail_connected=true"
    return RedirectResponse(frontend_url)
