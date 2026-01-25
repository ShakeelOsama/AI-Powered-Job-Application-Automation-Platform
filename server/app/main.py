import os
from dotenv import load_dotenv


load_dotenv(f".env.{os.getenv('ENVIRONMENT', 'development')}")

from contextlib import asynccontextmanager
import asyncio
import os
from pathlib import Path
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, job, resume, email, google_auth, user_info, job_automation


# Background task for self-ping to keep server alive
async def keep_alive():
    """Ping the server every 8 minutes to prevent it from sleeping"""
    while True:
        await asyncio.sleep(480)  # 8 minutes = 480 seconds
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{settings.SERVER_URL}/ping")
                print(f"Keep-alive ping: {response.status_code}")
        except Exception as e:
            print(f"Keep-alive ping failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the keep-alive background task
    task = asyncio.create_task(keep_alive())
    print("Keep-alive task started")
    yield
    # Shutdown: Cancel the background task
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Keep-alive task cancelled")

app = FastAPI(
    title="Job Apply App",
    description="Personal job application assistant with resume management, cover letter generation, and email sending",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_ORIGIN, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(resume.router, prefix="/api", tags=["resumes"])
app.include_router(job.router, prefix="/api", tags=["jobs"])
app.include_router(email.router, prefix="/api", tags=["email"])
app.include_router(google_auth.router, prefix="/api", tags=["google_auth"])
app.include_router(user_info.router, prefix="/api", tags=["user_info"])
app.include_router(job_automation.router, prefix="/api", tags=["job_automation"])


@app.get("/api")
def api_root():
    return {
        "success": True,
        "message": "Job Apply App API",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/ping")
def ping():
    """Endpoint for keep-alive pings and external cron jobs"""
    return {"status": "pong", "message": "Server is awake!"}


# Static files directory (React client build)
STATIC_DIR = Path(__file__).parent.parent / "static"

# Mount static assets if they exist
if STATIC_DIR.exists() and (STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")


# Serve index.html for root and SPA routes
@app.get("/")
async def serve_index():
    """Serve the React app index.html or API info"""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "success": True,
        "message": "Job Apply App API",
        "version": "1.0.0",
        "note": "Frontend not deployed. Access API at /api"
    }


# Catch-all route for SPA - must be last
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """Serve the React SPA for all non-API routes"""
    # Don't serve index.html for API routes
    if full_path.startswith(("auth", "resumes", "jobs", "email", "health", "ping", "api")):
        return {"detail": "Not Found"}
    
    # Try to serve static file first (for any other assets like favicon, etc.)
    static_file = STATIC_DIR / full_path
    if static_file.exists() and static_file.is_file():
        return FileResponse(static_file)
    
    # Serve index.html for SPA routing
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    return {"detail": "Not Found"}
