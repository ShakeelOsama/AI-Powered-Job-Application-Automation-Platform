from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ResumeCreate(BaseModel):
    name: str


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    file_path: str
    storage_id: str
    created_at: datetime
    user_id: int


class ResumeListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    storage_id: str
    created_at: datetime
