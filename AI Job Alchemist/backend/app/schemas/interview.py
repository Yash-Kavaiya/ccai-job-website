"""Interview schemas for API validation."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ============== REQUEST SCHEMAS ==============

class InterviewCreate(BaseModel):
    """Schema for creating a mock interview."""
    interview_type: str = Field(
        default="behavioral",
        description="Type: behavioral, technical, or situational"
    )
    job_id: Optional[str] = Field(None, description="Job ID for job-specific questions")
    job_title: Optional[str] = Field(None, description="Job title for customization")
    required_skills: Optional[List[str]] = Field(None, description="Skills to focus on")
    num_questions: int = Field(default=5, ge=3, le=15, description="Number of questions")
    difficulty: Optional[str] = Field(None, description="easy, medium, hard, or mixed")
    categories: Optional[List[str]] = Field(None, description="Specific categories")

    class Config:
        json_schema_extra = {
            "example": {
                "interview_type": "behavioral",
                "job_title": "Senior Software Engineer",
                "required_skills": ["Python", "AWS", "Leadership"],
                "num_questions": 5,
                "difficulty": "medium",
                "categories": ["teamwork", "leadership"]
            }
        }


class InterviewResponseSubmit(BaseModel):
    """Schema for submitting an interview response."""
    question_id: str
    response_text: str = Field(..., min_length=20, description="Your response")
    audio_url: Optional[str] = Field(None, description="URL to audio recording")


# ============== RESPONSE SCHEMAS ==============

class InterviewQuestionResponse(BaseModel):
    """Schema for interview question (without sample answer)."""
    id: str
    question: str
    category: str
    difficulty: str


class InterviewQuestionDetail(BaseModel):
    """Schema for detailed question with tips."""
    question_number: int
    total_questions: int
    question_id: str
    question: str
    category: str
    difficulty: str
    tips: List[str]
    time_suggestion: str


class ResponseFeedback(BaseModel):
    """Schema for response evaluation feedback."""
    question_id: str
    score: float = Field(..., ge=0, le=100)
    feedback: str
    strengths: List[str]
    improvements: List[str]
    key_points_covered: List[str]
    missing_points: List[str]
    scores: Dict[str, float]
    questions_remaining: int
    is_complete: bool


class SampleAnswerResponse(BaseModel):
    """Schema for sample answer response."""
    question_id: str
    question: str
    sample_answer: str
    expected_topics: List[str]


class QuestionResult(BaseModel):
    """Schema for individual question result."""
    question_id: str
    question: str
    category: str
    difficulty: str
    answered: bool
    score: float
    feedback: str
    strengths: List[str]
    improvements: List[str]


class InterviewCompleteResponse(BaseModel):
    """Schema for completed interview results."""
    interview_id: str
    interview_type: str
    overall_score: float = Field(..., ge=0, le=100)
    overall_feedback: str
    performance_level: str
    duration_minutes: int
    questions_answered: int
    total_questions: int
    category_scores: Dict[str, float]
    top_strengths: List[str]
    areas_to_improve: List[str]
    recommendations: List[str]
    question_results: List[QuestionResult]

    class Config:
        json_schema_extra = {
            "example": {
                "interview_id": "abc123",
                "interview_type": "behavioral",
                "overall_score": 78.5,
                "overall_feedback": "Good performance on this behavioral interview...",
                "performance_level": "Good",
                "duration_minutes": 25,
                "questions_answered": 5,
                "total_questions": 5,
                "category_scores": {
                    "communication": 80.0,
                    "relevance": 75.0,
                    "depth": 78.0
                },
                "top_strengths": ["Good use of STAR method", "Strong examples"],
                "areas_to_improve": ["Add more metrics", "Be more concise"],
                "recommendations": ["Practice more mock interviews"],
                "question_results": []
            }
        }


class InterviewResponse(BaseModel):
    """Schema for interview summary response."""
    id: str
    user_id: str
    job_id: Optional[str]
    interview_type: str
    status: str
    questions: List[InterviewQuestionResponse]
    overall_score: float
    overall_feedback: str
    duration_minutes: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewStatsResponse(BaseModel):
    """Schema for interview statistics."""
    total_interviews: int
    completed_interviews: int
    average_score: float
    best_score: float
    total_questions_answered: int
    total_practice_time: int
    performance_trend: str
    by_type: Dict[str, Any]
    recent_scores: List[Dict[str, Any]]

    class Config:
        json_schema_extra = {
            "example": {
                "total_interviews": 10,
                "completed_interviews": 8,
                "average_score": 72.5,
                "best_score": 88.0,
                "total_questions_answered": 45,
                "total_practice_time": 180,
                "performance_trend": "Improving",
                "by_type": {
                    "behavioral": {"count": 5, "average_score": 75.0},
                    "technical": {"count": 3, "average_score": 68.0}
                },
                "recent_scores": [
                    {"date": "2024-01-15", "score": 78.0},
                    {"date": "2024-01-10", "score": 72.0}
                ]
            }
        }


class InterviewListItem(BaseModel):
    """Schema for interview list item."""
    id: str
    interview_type: str
    status: str
    overall_score: float
    questions_count: int
    duration_minutes: int
    created_at: datetime
    completed_at: Optional[datetime]


class CategoriesResponse(BaseModel):
    """Schema for available categories."""
    interview_type: str
    categories: List[str]


# Legacy schemas for backward compatibility
class InterviewFeedback(BaseModel):
    """Schema for interview response feedback (legacy)."""
    question_id: str
    score: float
    feedback: str
    strengths: List[str]
    improvements: List[str]


class InterviewSubmitResponse(BaseModel):
    """Schema for interview submission response (legacy)."""
    interview_id: str
    overall_score: float
    overall_feedback: str
    question_feedback: List[InterviewFeedback]
