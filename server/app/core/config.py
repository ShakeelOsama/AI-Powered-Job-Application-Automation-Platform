from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/job_apply"
    SECRET_KEY: str = "your_default_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CLIENT_ORIGIN: str = "http://localhost:5173"
    DATA_ENCRYPTION_KEY: str = "your_default_encryption_key_change_in_production"
    GEMINI_API_KEY: str = ""
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    REDIS_URL: str = "redis://localhost:6379/0"
    SERVER_URL: str

    model_config = SettingsConfigDict(
        env_file=f".env.{os.getenv('ENVIRONMENT', 'development')}",  # dynamically pick file
        env_file_encoding="utf-8",
    )

settings = Settings()
