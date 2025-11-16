"""
Job Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class JobBase(BaseModel):
    """Base schema for job."""
    title: str = Field(..., max_length=255)
    company: str = Field(..., max_length=255)
    company_logo: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    job_type: Optional[str] = Field(None, max_length=50)  # full-time, part-time, contract, remote
    experience_level: Optional[str] = Field(None, max_length=50)  # entry, mid, senior, lead
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = Field(default="USD", max_length=10)
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    skills: Optional[List[str]] = None
    source: Optional[str] = Field(None, max_length=100)
    external_url: Optional[str] = None


class JobCreate(JobBase):
    """Schema for creating a job posting."""
    posted_date: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class JobUpdate(BaseModel):
    """Schema for updating a job posting."""
    title: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    company_logo: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    job_type: Optional[str] = Field(None, max_length=50)
    experience_level: Optional[str] = Field(None, max_length=50)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = Field(None, max_length=10)
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    skills: Optional[List[str]] = None
    external_url: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class JobResponse(JobBase):
    """Full job response schema."""
    id: int
    is_active: bool
    posted_date: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """Schema for job listings (compact)."""
    id: int
    title: str
    company: str
    company_logo: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "USD"
    posted_date: Optional[datetime] = None
    is_saved: bool = False  # Will be computed based on user's saved jobs

    class Config:
        from_attributes = True


class JobSearchFilters(BaseModel):
    """Schema for job search filters."""
    query: Optional[str] = Field(None, description="Search query for title/company/description")
    location: Optional[str] = Field(None, description="Filter by location")
    job_type: Optional[str] = Field(None, description="Filter by job type")
    experience_level: Optional[str] = Field(None, description="Filter by experience level")
    salary_min: Optional[int] = Field(None, description="Minimum salary")
    skills: Optional[List[str]] = Field(None, description="Filter by required skills")
    company: Optional[str] = Field(None, description="Filter by company name")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")


class JobSearchResponse(BaseModel):
    """Response schema for job search."""
    jobs: List[JobListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class SavedJobResponse(BaseModel):
    """Response schema for saved job."""
    id: int
    user_id: int
    job_id: int
    job: JobListResponse
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SaveJobRequest(BaseModel):
    """Request schema for saving a job."""
    job_id: int
    notes: Optional[str] = None
