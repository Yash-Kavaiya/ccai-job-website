"""Job API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobSearchQuery
from app.services.job_service import JobService
from app.core.exceptions import NotFoundError
from .deps import get_current_user, get_job_service

router = APIRouter()


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    service: JobService = Depends(get_job_service)
):
    """List all active jobs with optional filters."""
    filters = {}
    if location:
        filters["location"] = location
    if job_type:
        filters["job_type"] = job_type
    
    jobs = await service.get_jobs(limit=limit, offset=offset, filters=filters if filters else None)
    
    return [
        JobResponse(
            id=job.id,
            title=job.title,
            company=job.company,
            description=job.description,
            location=job.location,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            job_type=job.job_type.value if hasattr(job.job_type, 'value') else job.job_type,
            skills_required=job.skills_required,
            experience_level=job.experience_level,
            source=job.source.value if hasattr(job.source, 'value') else job.source,
            source_url=job.source_url,
            company_logo_url=job.company_logo_url,
            posted_at=job.posted_at,
            is_active=job.is_active,
        )
        for job in jobs
    ]


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    service: JobService = Depends(get_job_service)
):
    """Get job by ID."""
    try:
        job = await service.get_job(job_id)
        return JobResponse(
            id=job.id,
            title=job.title,
            company=job.company,
            description=job.description,
            location=job.location,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            job_type=job.job_type.value if hasattr(job.job_type, 'value') else job.job_type,
            skills_required=job.skills_required,
            experience_level=job.experience_level,
            source=job.source.value if hasattr(job.source, 'value') else job.source,
            source_url=job.source_url,
            company_logo_url=job.company_logo_url,
            posted_at=job.posted_at,
            is_active=job.is_active,
        )
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    """Create a new job listing (admin only in production)."""
    job = await service.create_job(job_data.model_dump())
    
    return JobResponse(
        id=job.id,
        title=job.title,
        company=job.company,
        description=job.description,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        job_type=job.job_type.value if hasattr(job.job_type, 'value') else job.job_type,
        skills_required=job.skills_required,
        experience_level=job.experience_level,
        source=job.source.value if hasattr(job.source, 'value') else job.source,
        source_url=job.source_url,
        company_logo_url=job.company_logo_url,
        posted_at=job.posted_at,
        is_active=job.is_active,
    )


@router.post("/{job_id}/save")
async def save_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    """Save a job for later."""
    # Get user ID from Firebase UID (simplified)
    user_id = current_user.get("uid")
    
    application = await service.save_job(user_id, job_id)
    return {"message": "Job saved", "application_id": application.id}


@router.post("/{job_id}/apply")
async def apply_to_job(
    job_id: str,
    resume_id: str,
    cover_letter: str = "",
    current_user: dict = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    """Apply to a job."""
    user_id = current_user.get("uid")
    
    application = await service.apply_to_job(
        user_id=user_id,
        job_id=job_id,
        resume_id=resume_id,
        cover_letter=cover_letter
    )
    return {"message": "Application submitted", "application_id": application.id}


@router.get("/applications/me")
async def get_my_applications(
    current_user: dict = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    """Get current user's job applications."""
    user_id = current_user.get("uid")
    applications = await service.get_user_applications(user_id)
    
    return [
        {
            "id": app.id,
            "job_id": app.job_id,
            "status": app.status.value,
            "match_score": app.match_score,
            "applied_at": app.applied_at,
            "created_at": app.created_at,
        }
        for app in applications
    ]
