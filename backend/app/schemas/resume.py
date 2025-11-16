"""
Resume Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ResumeBase(BaseModel):
    """Base schema for resume."""
    filename: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class ResumeUploadResponse(BaseModel):
    """Response schema for resume upload."""
    id: int
    filename: str
    file_size: int
    mime_type: str
    is_primary: bool
    created_at: datetime
    message: str

    class Config:
        from_attributes = True


class ResumeAnalysisResponse(BaseModel):
    """Response schema for resume analysis."""
    id: int
    filename: str
    parsed_data: Optional[Dict[str, Any]] = None
    ats_score: Optional[int] = None
    analysis: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumeResponse(BaseModel):
    """Full resume response schema."""
    id: int
    user_id: int
    filename: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    original_text: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None
    ats_score: Optional[int] = None
    analysis: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    """Schema for listing resumes."""
    id: int
    filename: str
    file_size: Optional[int] = None
    ats_score: Optional[int] = None
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ATSScoreResponse(BaseModel):
    """Response schema for ATS score."""
    resume_id: int
    overall_score: int
    category_scores: Dict[str, int]
    strengths: List[str]
    weaknesses: List[str]
    missing_elements: List[str]
    recommendations: List[str]


class ResumeSuggestionsResponse(BaseModel):
    """Response schema for resume improvement suggestions."""
    resume_id: int
    suggestions: List[str]
    ats_score: Optional[int] = None
