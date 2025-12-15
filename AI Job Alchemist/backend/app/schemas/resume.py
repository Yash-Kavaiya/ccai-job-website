"""Resume schemas for API validation."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ============== REQUEST SCHEMAS ==============

class ResumeCreate(BaseModel):
    """Schema for creating a resume (metadata only, file uploaded separately)."""
    name: str = Field(..., min_length=1, max_length=100)
    is_primary: bool = False


class ResumeUpdate(BaseModel):
    """Schema for updating resume metadata."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    skills: Optional[List[str]] = None


class ResumeCompareRequest(BaseModel):
    """Schema for comparing multiple resumes."""
    resume_ids: List[str] = Field(..., min_length=2, max_length=5)


class JobMatchRequest(BaseModel):
    """Schema for job match analysis request."""
    job_id: str


class AnalyzeRequest(BaseModel):
    """Schema for resume analysis request."""
    job_keywords: Optional[List[str]] = None
    job_description: Optional[str] = None


# ============== RESPONSE SCHEMAS ==============

class ResumeAnalysisResponse(BaseModel):
    """Schema for resume ATS analysis response."""
    ats_score: float = Field(..., ge=0, le=100, description="Overall ATS compatibility score")
    keyword_matches: List[str] = Field(default_factory=list, description="Keywords found in resume")
    missing_keywords: List[str] = Field(default_factory=list, description="Recommended keywords to add")
    suggestions: List[str] = Field(default_factory=list, description="Actionable improvement suggestions")
    strengths: List[str] = Field(default_factory=list, description="Resume strengths")
    weaknesses: List[str] = Field(default_factory=list, description="Areas for improvement")
    analyzed_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "ats_score": 78.5,
                "keyword_matches": ["Python", "Machine Learning", "AWS", "Docker"],
                "missing_keywords": ["Kubernetes", "TensorFlow", "CI/CD"],
                "suggestions": [
                    "Add quantifiable achievements (e.g., 'Improved performance by 40%')",
                    "Include more action verbs like 'achieved', 'implemented'"
                ],
                "strengths": [
                    "Strong keyword presence with 15 relevant skills",
                    "Professional LinkedIn profile included"
                ],
                "weaknesses": [
                    "Missing professional summary section",
                    "Lack of quantifiable achievements"
                ],
                "analyzed_at": "2024-01-15T10:30:00Z"
            }
        }


class ResumeResponse(BaseModel):
    """Schema for resume response."""
    id: str
    user_id: str
    name: str
    file_url: str = Field(description="Signed URL for file download (expires in 1 hour)")
    skills: List[str] = Field(default_factory=list, description="Extracted technical skills")
    experience_years: int = Field(default=0, description="Estimated years of experience")
    education: List[str] = Field(default_factory=list, description="Education entries")
    analysis: Optional[ResumeAnalysisResponse] = Field(None, description="ATS analysis results")
    is_primary: bool = Field(default=False, description="Whether this is the primary resume")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "abc123",
                "user_id": "user456",
                "name": "Software Engineer Resume 2024",
                "file_url": "https://storage.googleapis.com/...",
                "skills": ["Python", "JavaScript", "React", "AWS", "Docker"],
                "experience_years": 5,
                "education": ["B.S. Computer Science"],
                "is_primary": True,
                "created_at": "2024-01-15T10:00:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }


class ResumeStatsResponse(BaseModel):
    """Schema for resume statistics response."""
    total_resumes: int = Field(description="Total number of resumes")
    average_ats_score: float = Field(description="Average ATS score across all resumes")
    best_ats_score: float = Field(description="Highest ATS score")
    total_skills: int = Field(description="Total unique skills across all resumes")
    has_primary: bool = Field(description="Whether a primary resume is set")
    skills_list: List[str] = Field(default_factory=list, description="List of all unique skills")

    class Config:
        json_schema_extra = {
            "example": {
                "total_resumes": 3,
                "average_ats_score": 72.5,
                "best_ats_score": 85.0,
                "total_skills": 25,
                "has_primary": True,
                "skills_list": ["Python", "JavaScript", "AWS", "Docker", "React"]
            }
        }


class ResumeComparisonItem(BaseModel):
    """Schema for individual resume in comparison."""
    id: str
    name: str
    ats_score: float
    skills_count: int
    skills: List[str]
    experience_years: int
    is_primary: bool


class ResumeCompareResponse(BaseModel):
    """Schema for resume comparison response."""
    resumes: List[ResumeComparisonItem]
    best_resume_id: Optional[str] = Field(description="ID of the resume with highest ATS score")
    recommendation: Optional[str] = Field(description="Recommendation based on comparison")

    class Config:
        json_schema_extra = {
            "example": {
                "resumes": [
                    {
                        "id": "resume1",
                        "name": "Tech Resume",
                        "ats_score": 85.0,
                        "skills_count": 15,
                        "skills": ["Python", "AWS", "Docker"],
                        "experience_years": 5,
                        "is_primary": True
                    },
                    {
                        "id": "resume2",
                        "name": "General Resume",
                        "ats_score": 72.0,
                        "skills_count": 10,
                        "skills": ["Python", "SQL"],
                        "experience_years": 5,
                        "is_primary": False
                    }
                ],
                "best_resume_id": "resume1",
                "recommendation": "'Tech Resume' has the highest ATS score"
            }
        }


class JobMatchResponse(BaseModel):
    """Schema for job match analysis response."""
    resume_id: str
    job_id: str
    match_score: float = Field(..., ge=0, le=100, description="Overall match score")
    matching_skills: List[str] = Field(description="Skills that match the job requirements")
    missing_skills: List[str] = Field(description="Required skills not found in resume")
    experience_match: str = Field(description="Assessment of experience alignment")
    recommendations: List[str] = Field(description="Recommendations to improve match")

    class Config:
        json_schema_extra = {
            "example": {
                "resume_id": "resume123",
                "job_id": "job456",
                "match_score": 78.5,
                "matching_skills": ["Python", "Machine Learning", "AWS"],
                "missing_skills": ["Kubernetes", "TensorFlow"],
                "experience_match": "Good match - you have most required qualifications",
                "recommendations": [
                    "Consider gaining experience in: Kubernetes, TensorFlow",
                    "Tailor your resume to highlight relevant experience"
                ]
            }
        }


class SkillExtractionResponse(BaseModel):
    """Schema for skill extraction response."""
    skills: List[str]
    count: int
