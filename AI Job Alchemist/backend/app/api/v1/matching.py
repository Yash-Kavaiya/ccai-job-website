"""Full-featured Job Matching API endpoints using Qdrant Cloud vector search."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body

from app.schemas.matching import (
    JobMatchResult,
    SemanticSearchResult,
    CandidateMatchResult,
    DetailedMatchScore,
    MatchingStatsResponse,
    IndexJobRequest,
    IndexResumeRequest,
)
from app.schemas.job import JobResponse
from app.services.matching_service import MatchingService
from app.services.resume_service import ResumeService
from app.services.job_service import JobService
from app.core.exceptions import NotFoundError, ValidationError
from .deps import get_current_user, get_matching_service, get_resume_service, get_job_service

router = APIRouter()


# ============== JOB MATCHING FOR USERS ==============

@router.get("/jobs", response_model=List[JobMatchResult])
async def get_matching_jobs(
    resume_id: Optional[str] = Query(None, description="Resume ID (uses primary if not specified)"),
    limit: int = Query(20, le=50, description="Maximum results"),
    min_score: float = Query(30.0, ge=0, le=100, description="Minimum match score"),
    location: Optional[str] = Query(None, description="Filter by location"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    salary_min: Optional[int] = Query(None, description="Minimum salary filter"),
    current_user: dict = Depends(get_current_user),
    matching_service: MatchingService = Depends(get_matching_service),
    resume_service: ResumeService = Depends(get_resume_service)
):
    """
    Get AI-matched jobs for user's resume using Qdrant Cloud.
    
    - Uses semantic similarity + skill matching
    - Returns jobs ranked by match score
    - Includes skill gap analysis
    """
    user_id = current_user.get("uid")
    
    # Get resume
    if resume_id:
        resume = await resume_service.get_resume(resume_id)
        if resume.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        resume = await resume_service.get_primary_resume(user_id)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No resume found. Please upload a resume first."
            )
    
    # Find matching jobs
    matches = await matching_service.find_matching_jobs(
        resume=resume,
        limit=limit,
        min_score=min_score / 100,
        location=location,
        job_type=job_type,
        salary_min=salary_min,
    )
    
    return [
        JobMatchResult(
            job=_job_to_response(m["job"]),
            match_score=m["match_score"],
            semantic_score=m["semantic_score"],
            skill_score=m["skill_score"],
            matching_skills=m["matching_skills"],
            missing_skills=m["missing_skills"],
            skill_match_percentage=m["skill_match_percentage"],
        )
        for m in matches
    ]


# ============== SEMANTIC SEARCH ==============

@router.get("/search", response_model=List[SemanticSearchResult])
async def semantic_job_search(
    query: str = Query(..., min_length=3, description="Natural language search query"),
    limit: int = Query(20, le=50),
    location: Optional[str] = Query(None, description="Filter by location"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    matching_service: MatchingService = Depends(get_matching_service)
):
    """
    Semantic search for jobs using natural language.
    
    Example queries:
    - "Python machine learning engineer"
    - "Remote AI developer with NLP experience"
    - "Senior data scientist at FAANG"
    - "Entry level frontend developer React"
    """
    results = await matching_service.search_jobs_semantic(
        query=query,
        limit=limit,
        location=location,
        job_type=job_type,
        company=company,
    )
    
    return [
        SemanticSearchResult(
            job=_job_to_response(r["job"]),
            relevance_score=r["relevance_score"],
        )
        for r in results
    ]


# ============== DETAILED MATCH SCORE ==============

@router.get("/score/{job_id}", response_model=DetailedMatchScore)
async def get_detailed_match_score(
    job_id: str,
    resume_id: Optional[str] = Query(None, description="Resume ID (uses primary if not specified)"),
    current_user: dict = Depends(get_current_user),
    matching_service: MatchingService = Depends(get_matching_service),
    resume_service: ResumeService = Depends(get_resume_service),
    job_service: JobService = Depends(get_job_service)
):
    """
    Get detailed match score between a resume and specific job.
    
    Returns comprehensive breakdown:
    - Overall score with match level
    - Semantic similarity score
    - Skill match analysis
    - Experience match
    - Personalized recommendations
    """
    user_id = current_user.get("uid")
    
    # Get resume
    if resume_id:
        resume = await resume_service.get_resume(resume_id)
        if resume.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        resume = await resume_service.get_primary_resume(user_id)
        if not resume:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No resume found")
    
    # Get job
    try:
        job = await job_service.get_job(job_id)
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    # Calculate detailed match
    score_details = await matching_service.calculate_match_score(resume, job)
    
    return DetailedMatchScore(
        job_id=job_id,
        resume_id=resume.id,
        **score_details
    )


# ============== CANDIDATE MATCHING (FOR RECRUITERS) ==============

@router.get("/candidates/{job_id}", response_model=List[CandidateMatchResult])
async def find_matching_candidates(
    job_id: str,
    limit: int = Query(20, le=50),
    min_score: float = Query(30.0, ge=0, le=100),
    min_experience: Optional[int] = Query(None, description="Minimum years of experience"),
    current_user: dict = Depends(get_current_user),
    matching_service: MatchingService = Depends(get_matching_service),
    job_service: JobService = Depends(get_job_service)
):
    """
    Find candidates matching a job (for recruiters).
    
    Returns ranked list of matching resumes/candidates.
    """
    # Get job
    try:
        job = await job_service.get_job(job_id)
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    # Find matching candidates
    candidates = await matching_service.find_matching_candidates(
        job=job,
        limit=limit,
        min_score=min_score / 100,
        min_experience=min_experience,
    )
    
    return [
        CandidateMatchResult(
            resume_id=c["resume_id"],
            user_id=c["user_id"],
            match_score=c["match_score"],
            skills=c["skills"],
            experience_years=c["experience_years"],
            skill_match_percentage=c["skill_match_percentage"],
            matching_skills=c["matching_skills"],
            missing_skills=c["missing_skills"],
        )
        for c in candidates
    ]


# ============== INDEXING ==============

@router.post("/index/job/{job_id}")
async def index_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    matching_service: MatchingService = Depends(get_matching_service),
    job_service: JobService = Depends(get_job_service)
):
    """Index a job in Qdrant for semantic search."""
    try:
        job = await job_service.get_job(job_id)
        embedding_id = await matching_service.index_job(job)
        return {
            "message": "Job indexed successfully",
            "job_id": job_id,
            "embedding_id": embedding_id,
        }
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")


@router.post("/index/resume/{resume_id}")
async def index_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    matching_service: MatchingService = Depends(get_matching_service),
    resume_service: ResumeService = Depends(get_resume_service)
):
    """Index a resume in Qdrant for job matching."""
    try:
        user_id = current_user.get("uid")
        resume = await resume_service.get_resume(resume_id)
        
        if resume.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        embedding_id = await matching_service.index_resume(resume)
        return {
            "message": "Resume indexed successfully",
            "resume_id": resume_id,
            "embedding_id": embedding_id,
        }
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")


# ============== STATISTICS ==============

@router.get("/stats", response_model=MatchingStatsResponse)
async def get_matching_stats(
    matching_service: MatchingService = Depends(get_matching_service)
):
    """Get statistics about indexed jobs and resumes in Qdrant."""
    stats = await matching_service.get_matching_stats()
    return MatchingStatsResponse(**stats)


# ============== HELPER FUNCTIONS ==============

def _job_to_response(job) -> JobResponse:
    """Convert Job model to JobResponse schema."""
    return JobResponse(
        id=job.id,
        title=job.title,
        company=job.company,
        description=job.description,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        job_type=job.job_type.value if hasattr(job.job_type, 'value') else str(job.job_type),
        skills_required=job.skills_required,
        experience_level=job.experience_level,
        source=job.source.value if hasattr(job.source, 'value') else str(job.source),
        source_url=job.source_url,
        company_logo_url=job.company_logo_url,
        posted_at=job.posted_at,
        is_active=job.is_active,
    )
