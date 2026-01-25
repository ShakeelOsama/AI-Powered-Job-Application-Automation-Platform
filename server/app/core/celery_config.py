import os
from pathlib import Path
from celery import Celery
import os
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv(f".env.{os.getenv('ENVIRONMENT', 'development')}")


REDIS_URL = settings.REDIS_URL

celery_app = Celery(
    "job_apply_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.services.automation_service"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    worker_prefetch_multiplier=1,  # Process one task at a time
    task_acks_late=True,  # Acknowledge task after completion
)

if __name__ == "__main__":
    celery_app.start()

    