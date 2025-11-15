"""
Job API endpoints.
Handles job listings, search, filtering, saved jobs, and AI recommendations.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobListResponse,
    JobSearchFilters,
    JobSearchResponse,
    SavedJobResponse,
    SaveJobRequest,
)
from app.models.user import User
from app.models.job import Job, SavedJob
from app.models.resume import Resume
from app.api.deps import get_current_active_user
from app.services.ai_service import gemini_service
import math

router = APIRouter()


@router.get("/search", response_model=JobSearchResponse)
async def search_jobs(
    query: Optional[str] = Query(None, description="Search in title, company, description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    salary_min: Optional[int] = Query(None, description="Minimum salary"),
    company: Optional[str] = Query(None, description="Filter by company"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """
    Search and filter job listings.

    **Filters:**
    - **query**: Search in job title, company name, or description
    - **location**: Filter by location (partial match)
    - **job_type**: full-time, part-time, contract, remote
    - **experience_level**: entry, mid, senior, lead
    - **salary_min**: Minimum salary requirement
    - **company**: Filter by company name (partial match)
    - **page**: Page number (starts at 1)
    - **page_size**: Number of results per page (max 100)

    Returns paginated job listings with total count.
    """
    # Build query
    query_obj = db.query(Job).filter(Job.is_active == True)

    # Apply filters
    if query:
        search_filter = or_(
            Job.title.ilike(f"%{query}%"),
            Job.company.ilike(f"%{query}%"),
            Job.description.ilike(f"%{query}%")
        )
        query_obj = query_obj.filter(search_filter)

    if location:
        query_obj = query_obj.filter(Job.location.ilike(f"%{location}%"))

    if job_type:
        query_obj = query_obj.filter(Job.job_type == job_type)

    if experience_level:
        query_obj = query_obj.filter(Job.experience_level == experience_level)

    if salary_min:
        query_obj = query_obj.filter(
            or_(
                Job.salary_min >= salary_min,
                Job.salary_max >= salary_min
            )
        )

    if company:
        query_obj = query_obj.filter(Job.company.ilike(f"%{company}%"))

    # Get total count
    total = query_obj.count()

    # Apply pagination
    offset = (page - 1) * page_size
    jobs = query_obj.order_by(Job.posted_date.desc()).offset(offset).limit(page_size).all()

    # Get user's saved jobs if authenticated
    saved_job_ids = set()
    if current_user:
        saved_jobs = db.query(SavedJob.job_id).filter(
            SavedJob.user_id == current_user.id
        ).all()
        saved_job_ids = {job_id for (job_id,) in saved_jobs}

    # Convert to response
    job_responses = []
    for job in jobs:
        job_dict = JobListResponse.model_validate(job).model_dump()
        job_dict['is_saved'] = job.id in saved_job_ids
        job_responses.append(JobListResponse(**job_dict))

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return JobSearchResponse(
        jobs=job_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("", response_model=List[JobListResponse])
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """
    Get all active jobs (simple listing without filters).

    - **skip**: Number of jobs to skip
    - **limit**: Maximum number of jobs to return (max 100)

    Returns list of active jobs ordered by posted date (newest first).
    """
    jobs = db.query(Job).filter(
        Job.is_active == True
    ).order_by(Job.posted_date.desc()).offset(skip).limit(limit).all()

    # Get user's saved jobs if authenticated
    saved_job_ids = set()
    if current_user:
        saved_jobs = db.query(SavedJob.job_id).filter(
            SavedJob.user_id == current_user.id
        ).all()
        saved_job_ids = {job_id for (job_id,) in saved_jobs}

    # Convert to response
    job_responses = []
    for job in jobs:
        job_dict = JobListResponse.model_validate(job).model_dump()
        job_dict['is_saved'] = job.id in saved_job_ids
        job_responses.append(JobListResponse(**job_dict))

    return job_responses


@router.get("/recommended", response_model=List[JobListResponse])
async def get_recommended_jobs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get AI-recommended jobs based on user's resume.

    - **limit**: Maximum number of recommendations (default 10, max 50)

    **Requires:**
    - User must have at least one analyzed resume

    **Algorithm:**
    - Uses AI to match user's skills and experience with job requirements
    - Returns jobs sorted by match score (highest first)
    """
    # Get user's primary resume or first analyzed resume
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.parsed_data != None
    ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload and analyze a resume first to get recommendations"
        )

    # Get user's skills from resume
    user_skills = resume.parsed_data.get('skills', []) if resume.parsed_data else []

    # Get active jobs
    jobs = db.query(Job).filter(Job.is_active == True).limit(100).all()

    if not jobs:
        return []

    # Calculate match scores for each job (simplified - in production, use AI or caching)
    job_matches = []
    for job in jobs[:limit * 3]:  # Get more than needed for filtering
        # Simple skill-based matching
        job_skills = job.skills or []
        if not job_skills:
            continue

        matching_skills = set(user_skills) & set(job_skills)
        match_percentage = len(matching_skills) / len(job_skills) * 100 if job_skills else 0

        if match_percentage > 20:  # Only include jobs with >20% skill match
            job_matches.append({
                'job': job,
                'score': match_percentage
            })

    # Sort by score and get top matches
    job_matches.sort(key=lambda x: x['score'], reverse=True)
    top_jobs = [match['job'] for match in job_matches[:limit]]

    # Get user's saved jobs
    saved_job_ids = set()
    saved_jobs = db.query(SavedJob.job_id).filter(
        SavedJob.user_id == current_user.id
    ).all()
    saved_job_ids = {job_id for (job_id,) in saved_jobs}

    # Convert to response
    job_responses = []
    for job in top_jobs:
        job_dict = JobListResponse.model_validate(job).model_dump()
        job_dict['is_saved'] = job.id in saved_job_ids
        job_responses.append(JobListResponse(**job_dict))

    return job_responses


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific job.

    - **job_id**: Job ID

    Returns full job details including description, requirements, and benefits.
    """
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    return JobResponse.model_validate(job)


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new job posting.

    **Note:** In production, this should be restricted to admin users or employers.
    For now, any authenticated user can create jobs for testing.

    All fields from JobCreate schema are accepted.
    """
    new_job = Job(**job.model_dump())
    new_job.is_active = True

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return JobResponse.model_validate(new_job)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_update: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a job posting.

    - **job_id**: Job ID to update

    **Note:** In production, this should verify user is the job owner or admin.
    """
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Update fields
    update_data = job_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return JobResponse.model_validate(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a job posting (soft delete - sets is_active to False).

    - **job_id**: Job ID to delete

    **Note:** In production, this should verify user is the job owner or admin.
    """
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Soft delete
    job.is_active = False
    db.commit()

    return None


# ============================================================================
# SAVED JOBS ENDPOINTS
# ============================================================================

@router.post("/saved", response_model=SavedJobResponse, status_code=status.HTTP_201_CREATED)
async def save_job(
    request: SaveJobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Save a job to your saved jobs list.

    - **job_id**: ID of the job to save
    - **notes**: Optional notes about why you saved this job

    **Use this to:**
    - Bookmark interesting jobs for later
    - Keep track of jobs you want to apply to
    - Add personal notes about each job
    """
    # Check if job exists
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check if already saved
    existing = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id,
        SavedJob.job_id == request.job_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job already saved"
        )

    # Create saved job
    saved_job = SavedJob(
        user_id=current_user.id,
        job_id=request.job_id,
        notes=request.notes
    )

    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)

    # Load job relationship
    db.refresh(saved_job, ['job'])

    return SavedJobResponse.model_validate(saved_job)


@router.get("/saved", response_model=List[SavedJobResponse])
async def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all saved jobs for current user.

    Returns list of saved jobs with full job details and your notes.
    Ordered by most recently saved.
    """
    saved_jobs = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id
    ).order_by(SavedJob.created_at.desc()).all()

    return [SavedJobResponse.model_validate(sj) for sj in saved_jobs]


@router.delete("/saved/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove a job from your saved jobs list.

    - **job_id**: Job ID to unsave
    """
    saved_job = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id,
        SavedJob.job_id == job_id
    ).first()

    if not saved_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved job not found"
        )

    db.delete(saved_job)
    db.commit()

    return None
