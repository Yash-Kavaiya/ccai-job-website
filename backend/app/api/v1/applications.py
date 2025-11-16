"""
Application API endpoints.
Handles job applications, tracking, and statistics.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationStats,
)
from app.models.user import User
from app.models.job import Job
from app.models.resume import Resume
from app.models.application import Application
from app.api.deps import get_current_active_user
from datetime import datetime

router = APIRouter()


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Apply to a job.

    - **job_id**: ID of the job to apply to
    - **resume_id**: ID of the resume to use (optional, uses primary resume if not specified)
    - **cover_letter**: Optional cover letter text

    **What happens:**
    1. Validates job exists and is active
    2. Uses your primary resume if none specified
    3. Creates application with status 'applied'
    4. Returns full application details

    **Note:** You can only apply once per job.
    """
    # Check if job exists and is active
    job = db.query(Job).filter(Job.id == application.job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or no longer active"
        )

    # Check if already applied
    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == application.job_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job"
        )

    # Get resume
    resume_id = application.resume_id
    if not resume_id:
        # Use primary resume
        primary_resume = db.query(Resume).filter(
            Resume.user_id == current_user.id,
            Resume.is_primary == True
        ).first()

        if not primary_resume:
            # Use any resume
            any_resume = db.query(Resume).filter(
                Resume.user_id == current_user.id
            ).first()

            if not any_resume:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please upload a resume before applying to jobs"
                )
            resume_id = any_resume.id
        else:
            resume_id = primary_resume.id

    # Verify resume belongs to user
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    # Create application
    new_application = Application(
        user_id=current_user.id,
        job_id=application.job_id,
        resume_id=resume_id,
        cover_letter=application.cover_letter,
        status="applied"
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # Load relationships
    db.refresh(new_application, ['job', 'resume'])

    return ApplicationResponse.model_validate(new_application)


@router.get("", response_model=List[ApplicationResponse])
async def list_applications(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all applications for current user.

    - **status**: Optional filter by status (applied, reviewing, interview, rejected, accepted)
    - **skip**: Number of applications to skip
    - **limit**: Maximum number to return (max 100)

    Returns applications ordered by most recent first.
    """
    query = db.query(Application).filter(Application.user_id == current_user.id)

    if status_filter:
        query = query.filter(Application.status == status_filter)

    applications = query.order_by(
        Application.applied_at.desc()
    ).offset(skip).limit(limit).all()

    return [ApplicationResponse.model_validate(app) for app in applications]


@router.get("/stats", response_model=ApplicationStats)
async def get_application_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get statistics about your applications.

    Returns:
    - Total applications
    - Count by status (applied, reviewing, interview, rejected, accepted)

    **Useful for:**
    - Dashboard overview
    - Tracking application progress
    - Understanding your job search success rate
    """
    # Get counts by status
    status_counts = db.query(
        Application.status,
        func.count(Application.id)
    ).filter(
        Application.user_id == current_user.id
    ).group_by(Application.status).all()

    # Convert to dict
    counts = {status: count for status, count in status_counts}

    return ApplicationStats(
        total=sum(counts.values()),
        applied=counts.get('applied', 0),
        reviewing=counts.get('reviewing', 0),
        interview=counts.get('interview', 0),
        rejected=counts.get('rejected', 0),
        accepted=counts.get('accepted', 0)
    )


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of a specific application.

    - **application_id**: Application ID

    Returns full application details including job and resume information.
    """
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    return ApplicationResponse.model_validate(application)


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    application_update: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an application.

    - **application_id**: Application ID
    - **cover_letter**: Update cover letter
    - **status**: Update status (applied, reviewing, interview, rejected, accepted)
    - **notes**: Add or update notes

    **Common use cases:**
    - Update status as you progress through interview stages
    - Add notes about interviews or follow-ups
    - Revise cover letter before final submission
    """
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Update fields
    update_data = application_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)

    application.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(application)

    return ApplicationResponse.model_validate(application)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Withdraw/delete an application.

    - **application_id**: Application ID to delete

    **Warning:** This permanently deletes the application record.
    Consider updating the status to 'withdrawn' instead if you want to keep the record.
    """
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    db.delete(application)
    db.commit()

    return None
