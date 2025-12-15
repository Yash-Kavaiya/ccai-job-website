"""Matching schemas for API validation."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.schemas.job import JobResponse


# ============== REQUEST SCHEMAS ==============

class IndexJobRequest(BaseModel):
    """Schema for indexing a job."""
    job_id: str


class IndexResumeRequest(BaseModel):
    """Schema for indexing a resume."""
    resume_id: str


# ============== RESPONSE SCHEMAS ==============

class JobMatchResult(BaseModel):
    """Schema for job match result with detailed scoring."""
    job: JobResponse
    match_score: float = Field(..., ge=0, le=100, description="Overall match score")
    semantic_score: float = Field(..., ge=0, le=100, description="Semantic similarity score")
    skill_score: float = Field(..., ge=0, le=100, description="Skill match score")
    matching_skills: List[str] = Field(default_factory=list, description="Skills that match")
    missing_skills: List[str] = Field(default_factory=list, description="Required skills not in resume")
    skill_match_percentage: float = Field(..., ge=0, le=100, description="Percentage of required skills matched")

    class Config:
        json_schema_extra = {
            "example": {
                "job": {"id": "job123", "title": "ML Engineer", "company": "Google"},
                "match_score": 85.5,
                "semantic_score": 88.0,
                "skill_score": 82.0,
                "matching_skills": ["Python", "TensorFlow", "AWS"],
                "missing_skills": ["Kubernetes"],
                "skill_match_percentage": 75.0
            }
        }


class SemanticSearchResult(BaseModel):
    """Schema for semantic search result."""
    job: JobResponse
    relevance_score: float = Field(..., ge=0, le=100, description="Relevance to search query")

    class Config:
        json_schema_extra = {
            "example": {
                "job": {"id": "job123", "title": "ML Engineer", "company": "Google"},
                "relevance_score": 92.5
            }
        }


class CandidateMatchResult(BaseModel):
    """Schema for candidate match result (for recruiters)."""
    resume_id: str
    user_id: str
    match_score: float = Field(..., ge=0, le=100)
    skills: List[str]
    experience_years: int
    skill_match_percentage: float
    matching_skills: List[str]
    missing_skills: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "resume_id": "resume123",
                "user_id": "user456",
                "match_score": 78.5,
                "skills": ["Python", "Machine Learning", "AWS"],
                "experience_years": 5,
                "skill_match_percentage": 80.0,
                "matching_skills": ["Python", "AWS"],
                "missing_skills": ["Kubernetes"]
            }
        }


class DetailedMatchScore(BaseModel):
    """Schema for detailed match score between resume and job."""
    job_id: str
    resume_id: str
    overall_score: float = Field(..., ge=0, le=100, description="Overall match score")
    match_level: str = Field(..., description="Match level: Excellent/Good/Partial/Low")
    semantic_score: float = Field(..., ge=0, le=100, description="Semantic similarity")
    skill_score: float = Field(..., ge=0, le=100, description="Skill match score")
    experience_score: float = Field(..., ge=0, le=100, description="Experience match score")
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    extra_skills: List[str] = Field(default_factory=list, description="Skills you have beyond requirements")
    skill_match_percentage: float
    recommendations: List[str] = Field(default_factory=list, description="Personalized recommendations")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job123",
                "resume_id": "resume456",
                "overall_score": 78.5,
                "match_level": "Good Match",
                "semantic_score": 82.0,
                "skill_score": 75.0,
                "experience_score": 80.0,
                "matching_skills": ["Python", "TensorFlow", "AWS"],
                "missing_skills": ["Kubernetes", "Go"],
                "extra_skills": ["React", "Node.js"],
                "skill_match_percentage": 60.0,
                "recommendations": [
                    "Consider learning: Kubernetes, Go",
                    "Strong match! Tailor your resume to highlight matching skills"
                ]
            }
        }


class MatchingStatsResponse(BaseModel):
    """Schema for matching statistics."""
    indexed_jobs: int = Field(..., description="Number of jobs indexed in Qdrant")
    indexed_resumes: int = Field(..., description="Number of resumes indexed in Qdrant")
    embedding_model: str = Field(..., description="Embedding model used")
    embedding_dimension: int = Field(..., description="Embedding vector dimension")

    class Config:
        json_schema_extra = {
            "example": {
                "indexed_jobs": 1500,
                "indexed_resumes": 500,
                "embedding_model": "all-MiniLM-L6-v2",
                "embedding_dimension": 384
            }
        }
