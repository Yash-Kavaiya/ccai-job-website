"""
Resume API endpoints.
Handles resume upload, parsing, AI analysis, and ATS scoring.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.resume import (
    ResumeUploadResponse,
    ResumeAnalysisResponse,
    ResumeResponse,
    ResumeListResponse,
    ATSScoreResponse,
    ResumeSuggestionsResponse,
)
from app.models.user import User
from app.models.resume import Resume
from app.api.deps import get_current_active_user
from app.services.ai_service import gemini_service
from app.utils.file_parsers import file_parser
from app.core.config import settings
import os
import uuid
from datetime import datetime

router = APIRouter()


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a resume file (PDF, DOCX, or TXT).

    - **file**: Resume file to upload
    - Maximum size: 5MB
    - Supported formats: PDF, DOCX, TXT

    The file will be:
    1. Validated for type and size
    2. Saved to storage
    3. Text extracted for later analysis
    """
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]
    allowed_extensions = ["pdf", "docx", "txt"]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Supported formats: {', '.join(allowed_extensions)}"
        )

    # Read file content
    contents = await file.read()

    # Validate file size
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
        )

    # Extract text from file
    try:
        extracted_text = file_parser.parse_file(contents, file.filename)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Create resumes directory if it doesn't exist
    resumes_dir = os.path.join(settings.UPLOAD_DIR, "resumes")
    os.makedirs(resumes_dir, exist_ok=True)

    # Save file
    file_path = os.path.join(resumes_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Create resume record
    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=f"/uploads/resumes/{unique_filename}",
        file_size=len(contents),
        mime_type=file.content_type,
        original_text=extracted_text,
        is_primary=False  # Will be set to True if it's the user's first resume
    )

    # Check if this is the user's first resume
    existing_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    if existing_resumes == 0:
        resume.is_primary = True

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeUploadResponse(
        id=resume.id,
        filename=resume.filename,
        file_size=resume.file_size,
        mime_type=resume.mime_type,
        is_primary=resume.is_primary,
        created_at=resume.created_at,
        message="Resume uploaded successfully. You can now analyze it."
    )


@router.get("", response_model=List[ResumeListResponse])
async def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all resumes for current user.

    Returns list of user's uploaded resumes with basic information.
    """
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()

    return [ResumeListResponse.model_validate(resume) for resume in resumes]


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed information about a specific resume.

    - **resume_id**: Resume ID

    Returns full resume data including parsed information and analysis if available.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    return ResumeResponse.model_validate(resume)


@router.post("/{resume_id}/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Analyze resume with AI to extract structured data, calculate ATS score, and generate suggestions.

    - **resume_id**: Resume ID to analyze

    This will:
    1. Parse resume into structured data (name, skills, experience, etc.)
    2. Calculate ATS compatibility score (0-100)
    3. Generate improvement suggestions

    **Note:** This uses Google Gemini AI and may take 10-20 seconds.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    if not resume.original_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text could not be extracted. Please re-upload the resume."
        )

    # Analyze resume with AI
    parsed_data = gemini_service.analyze_resume(resume.original_text)

    # Calculate ATS score
    ats_analysis = gemini_service.calculate_ats_score(resume.original_text, parsed_data)

    # Generate suggestions
    suggestions = gemini_service.generate_resume_suggestions(
        resume.original_text,
        parsed_data,
        ats_analysis
    )

    # Update resume with analysis
    resume.parsed_data = parsed_data
    resume.ats_score = ats_analysis.get("overall_score", 0)
    resume.analysis = ats_analysis
    resume.suggestions = suggestions
    resume.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(resume)

    return ResumeAnalysisResponse.model_validate(resume)


@router.get("/{resume_id}/ats-score", response_model=ATSScoreResponse)
async def get_ats_score(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get ATS score for a resume.

    - **resume_id**: Resume ID

    Returns ATS score and detailed analysis. If resume hasn't been analyzed yet,
    it will trigger the analysis automatically.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    # If not analyzed yet, analyze it
    if not resume.analysis:
        if not resume.original_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume text could not be extracted."
            )

        parsed_data = gemini_service.analyze_resume(resume.original_text)
        ats_analysis = gemini_service.calculate_ats_score(resume.original_text, parsed_data)

        resume.parsed_data = parsed_data
        resume.ats_score = ats_analysis.get("overall_score", 0)
        resume.analysis = ats_analysis
        resume.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(resume)

    return ATSScoreResponse(
        resume_id=resume.id,
        overall_score=resume.analysis.get("overall_score", 0),
        category_scores=resume.analysis.get("category_scores", {}),
        strengths=resume.analysis.get("strengths", []),
        weaknesses=resume.analysis.get("weaknesses", []),
        missing_elements=resume.analysis.get("missing_elements", []),
        recommendations=resume.analysis.get("recommendations", [])
    )


@router.get("/{resume_id}/suggestions", response_model=ResumeSuggestionsResponse)
async def get_suggestions(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get improvement suggestions for a resume.

    - **resume_id**: Resume ID

    Returns actionable suggestions to improve the resume.
    If resume hasn't been analyzed, it will be analyzed automatically.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    # If no suggestions yet, generate them
    if not resume.suggestions:
        if not resume.original_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume text could not be extracted."
            )

        parsed_data = resume.parsed_data or gemini_service.analyze_resume(resume.original_text)
        ats_analysis = resume.analysis or gemini_service.calculate_ats_score(resume.original_text, parsed_data)
        suggestions = gemini_service.generate_resume_suggestions(resume.original_text, parsed_data, ats_analysis)

        resume.suggestions = suggestions
        resume.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(resume)

    return ResumeSuggestionsResponse(
        resume_id=resume.id,
        suggestions=resume.suggestions or [],
        ats_score=resume.ats_score
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a resume.

    - **resume_id**: Resume ID to delete

    This will permanently delete the resume file and all associated data.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    # Delete physical file
    file_path = os.path.join(settings.UPLOAD_DIR, "resumes", os.path.basename(resume.file_path))
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file: {e}")

    # Delete database record
    db.delete(resume)
    db.commit()

    return None


@router.put("/{resume_id}/set-primary", response_model=ResumeResponse)
async def set_primary_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Set a resume as the primary resume.

    - **resume_id**: Resume ID to set as primary

    The primary resume is used by default for job applications and matching.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    # Unset all other primary resumes
    db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.id != resume_id
    ).update({"is_primary": False})

    # Set this resume as primary
    resume.is_primary = True
    resume.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(resume)

    return ResumeResponse.model_validate(resume)
