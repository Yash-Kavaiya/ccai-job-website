"""Full-featured Resume API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Body

from app.schemas.resume import (
    ResumeResponse, 
    ResumeAnalysisResponse,
    ResumeCreate,
    ResumeUpdate,
    ResumeCompareRequest,
    ResumeCompareResponse,
    ResumeStatsResponse,
    JobMatchRequest,
    JobMatchResponse,
)
from app.services.resume_service import ResumeService
from app.core.exceptions import NotFoundError, ValidationError
from .deps import get_current_user, get_resume_service

router = APIRouter()


# ============== UPLOAD & CREATE ==============

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(..., description="Resume file (PDF, DOCX)"),
    name: str = Form(..., description="Display name for the resume"),
    is_primary: bool = Form(False, description="Set as primary resume"),
    auto_analyze: bool = Form(True, description="Automatically run ATS analysis"),
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """
    Upload a new resume with automatic parsing and analysis.
    
    - Supports PDF and DOCX formats
    - Automatically extracts text, skills, and experience
    - Optionally runs ATS analysis
    - Indexes for job matching
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    try:
        user_id = current_user.get("uid")
        file_content = await file.read()
        
        resume = await service.upload_resume(
            user_id=user_id,
            file_content=file_content,
            filename=file.filename,
            name=name,
            is_primary=is_primary,
            auto_analyze=auto_analyze
        )
        
        return _to_response(resume)
    
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.message))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============== READ ==============

@router.get("/", response_model=List[ResumeResponse])
async def list_my_resumes(
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """List all resumes for the current user."""
    user_id = current_user.get("uid")
    resumes = await service.get_user_resumes(user_id)
    return [_to_response(r) for r in resumes]


@router.get("/primary", response_model=ResumeResponse)
async def get_primary_resume(
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """Get the user's primary resume."""
    user_id = current_user.get("uid")
    resume = await service.get_primary_resume(user_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No primary resume set. Upload a resume first."
        )
    
    return _to_response(resume)


@router.get("/stats", response_model=ResumeStatsResponse)
async def get_resume_stats(
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """Get resume statistics for the current user."""
    user_id = current_user.get("uid")
    stats = await service.get_resume_stats(user_id)
    return ResumeStatsResponse(**stats)


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """Get a specific resume by ID."""
    try:
        resume = await service.get_resume(resume_id)
        
        if resume.user_id != current_user.get("uid"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        return _to_response(resume)
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")


@router.get("/{resume_id}/download")
async def get_download_url(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """Get a signed download URL for the resume file."""
    try:
        resume = await service.get_resume(resume_id)
        
        if resume.user_id != current_user.get("uid"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        return {
            "download_url": resume.file_url,
            "expires_in": 3600,  # 1 hour
        }
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")


# ============== UPDATE ==============

@router.patch("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: str,
    update_data: ResumeUpdate,
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """Update resume metadata (name, skills)."""
    try:
        user_id = current_user.get("uid")
        
        resume = await service.update_resume(
            resume_id=resume_id,
            user_id=user_id,
            name=update_data.name,
            skills=update_data.skills
        )
        
        return _to_response(resume)
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")


@router.post("/{resume_id}/set-primary")
async def set_primary_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """Set a resume as the primary resume."""
    try:
        user_id = current_user.get("uid")
        success = await service.set_primary_resume(user_id, resume_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
        return {"message": "Resume set as primary", "resume_id": resume_id}
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")


# ============== DELETE ==============

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """Delete a resume and its associated file."""
    try:
        user_id = current_user.get("uid")
        await service.delete_resume(resume_id, user_id)
        return {"message": "Resume deleted successfully", "resume_id": resume_id}
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")


# ============== ANALYSIS ==============

@router.post("/{resume_id}/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    resume_id: str,
    job_keywords: Optional[List[str]] = Body(None, description="Target keywords for analysis"),
    job_description: Optional[str] = Body(None, description="Job description for tailored analysis"),
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """
    Perform comprehensive ATS analysis on a resume.
    
    - Calculates ATS compatibility score
    - Identifies matching and missing keywords
    - Provides actionable suggestions
    - Optionally tailored to specific job keywords/description
    """
    try:
        resume = await service.get_resume(resume_id)
        
        if resume.user_id != current_user.get("uid"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        analysis = await service.analyze_resume(
            resume_id=resume_id,
            job_keywords=job_keywords,
            job_description=job_description
        )
        
        return ResumeAnalysisResponse(
            ats_score=analysis.ats_score,
            keyword_matches=analysis.keyword_matches,
            missing_keywords=analysis.missing_keywords,
            suggestions=analysis.suggestions,
            strengths=analysis.strengths,
            weaknesses=analysis.weaknesses,
            analyzed_at=analysis.analyzed_at,
        )
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")


@router.post("/{resume_id}/analyze-for-job", response_model=JobMatchResponse)
async def analyze_for_job(
    resume_id: str,
    request: JobMatchRequest,
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """
    Analyze how well a resume matches a specific job.
    
    Returns detailed match analysis with:
    - Match score
    - Matching and missing skills
    - Personalized recommendations
    """
    try:
        user_id = current_user.get("uid")
        
        result = await service.analyze_for_job(
            resume_id=resume_id,
            job_id=request.job_id,
            user_id=user_id
        )
        
        return JobMatchResponse(**result)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e.message))


# ============== COMPARE ==============

@router.post("/compare", response_model=ResumeCompareResponse)
async def compare_resumes(
    request: ResumeCompareRequest,
    current_user: dict = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service)
):
    """
    Compare multiple resumes side by side.
    
    Returns comparison of ATS scores, skills, and recommendations.
    """
    user_id = current_user.get("uid")
    
    if len(request.resume_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 resume IDs required for comparison"
        )
    
    result = await service.compare_resumes(request.resume_ids, user_id)
    return ResumeCompareResponse(**result)


# ============== UTILITIES ==============

@router.post("/extract-skills")
async def extract_skills_from_text(
    text: str = Body(..., embed=True, description="Text to extract skills from"),
    service: ResumeService = Depends(get_resume_service)
):
    """
    Extract technical skills from arbitrary text.
    
    Useful for extracting skills from job descriptions.
    """
    skills = await service.extract_skills_from_text(text)
    return {"skills": skills, "count": len(skills)}


# ============== HELPER FUNCTIONS ==============

def _to_response(resume) -> ResumeResponse:
    """Convert Resume model to ResumeResponse schema."""
    return ResumeResponse(
        id=resume.id,
        user_id=resume.user_id,
        name=resume.name,
        file_url=resume.file_url,
        skills=resume.skills,
        experience_years=resume.experience_years,
        education=resume.education,
        analysis=ResumeAnalysisResponse(
            ats_score=resume.analysis.ats_score,
            keyword_matches=resume.analysis.keyword_matches,
            missing_keywords=resume.analysis.missing_keywords,
            suggestions=resume.analysis.suggestions,
            strengths=resume.analysis.strengths,
            weaknesses=resume.analysis.weaknesses,
            analyzed_at=resume.analysis.analyzed_at,
        ) if resume.analysis else None,
        is_primary=resume.is_primary,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
    )
