"""Job schemas for API validation."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    """Schema for creating a new job."""
    title: str = Field(..., min_length=3, max_length=200)
    company: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=50)
    location: str = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: str = "full_time"
    skills_required: List[str] = []
    experience_level: str = ""
    source: str = "manual"
    source_url: str = ""
    company_logo_url: str = ""


class JobUpdate(BaseModel):
    """Schema for updating a job."""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    company: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, min_length=50)
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: Optional[str] = None
    skills_required: Optional[List[str]] = None
    experience_level: Optional[str] = None
    is_active: Optional[bool] = None


class JobResponse(BaseModel):
    """Schema for job response."""
    id: str
    title: str
    company: str
    description: str
    location: str
    salary_min: Optional[int]
    salary_max: Optional[int]
    job_type: str
    skills_required: List[str]
    experience_level: str
    source: str
    source_url: str
    company_logo_url: str
    posted_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class JobSearchQuery(BaseModel):
    """Schema for job search query."""
    query: str = ""
    location: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[int] = None
    skills: Optional[List[str]] = None
    limit: int = Field(default=20, le=100)
    offset: int = 0


class JobMatchResult(BaseModel):
    """Schema for job match result."""
    job: JobResponse
    match_score: float = Field(..., ge=0, le=100)
    matching_skills: List[str] = []
    missing_skills: List[str] = []
