"""
Application Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.job import JobListResponse
from app.schemas.resume import ResumeListResponse


class ApplicationBase(BaseModel):
    """Base schema for application."""
    job_id: int
    resume_id: Optional[int] = None
    cover_letter: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    """Schema for creating an application."""
    pass


class ApplicationUpdate(BaseModel):
    """Schema for updating an application."""
    cover_letter: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    """Full application response schema."""
    id: int
    user_id: int
    job_id: int
    resume_id: Optional[int] = None
    cover_letter: Optional[str] = None
    status: str
    applied_at: datetime
    updated_at: datetime
    notes: Optional[str] = None
    job: JobListResponse
    resume: Optional[ResumeListResponse] = None

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    """Schema for listing applications (compact)."""
    id: int
    job_id: int
    job_title: str
    company: str
    status: str
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationStats(BaseModel):
    """Statistics for user's applications."""
    total: int
    applied: int
    reviewing: int
    interview: int
    rejected: int
    accepted: int
