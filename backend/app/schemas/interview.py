"""
Interview Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class InterviewQuestionBase(BaseModel):
    """Base schema for interview question."""
    question_text: str = Field(..., description="The interview question")
    question_type: Optional[str] = Field(None, max_length=50)  # technical, behavioral, situational


class InterviewQuestionCreate(InterviewQuestionBase):
    """Schema for creating an interview question."""
    pass


class InterviewQuestionUpdate(BaseModel):
    """Schema for updating interview question answer."""
    user_answer: str = Field(..., description="User's answer to the question")


class InterviewQuestionResponse(InterviewQuestionBase):
    """Full interview question response."""
    id: int
    interview_id: int
    user_answer: Optional[str] = None
    ai_feedback: Optional[str] = None
    score: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewBase(BaseModel):
    """Base schema for interview."""
    interview_type: Optional[str] = Field(None, max_length=50)  # technical, behavioral, hr, mock
    scheduled_at: Optional[datetime] = None
    duration_minutes: int = Field(default=60, ge=15, le=240)
    meeting_link: Optional[str] = None


class InterviewCreate(InterviewBase):
    """Schema for creating an interview."""
    application_id: Optional[int] = Field(None, description="Related job application ID")


class InterviewUpdate(BaseModel):
    """Schema for updating an interview."""
    interview_type: Optional[str] = Field(None, max_length=50)
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=240)
    meeting_link: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class InterviewResponse(InterviewBase):
    """Full interview response schema."""
    id: int
    user_id: int
    application_id: Optional[int] = None
    status: str
    notes: Optional[str] = None
    feedback: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    questions: List[InterviewQuestionResponse] = []

    class Config:
        from_attributes = True


class InterviewListResponse(BaseModel):
    """Schema for interview listing (compact)."""
    id: int
    interview_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: int
    status: str
    created_at: datetime
    company: Optional[str] = None  # From related application/job
    position: Optional[str] = None  # From related application/job

    class Config:
        from_attributes = True


class MockInterviewRequest(BaseModel):
    """Request schema for mock interview."""
    job_title: str = Field(..., description="Job title for mock interview")
    job_description: Optional[str] = Field(None, description="Job description (optional)")
    interview_type: str = Field(default="technical", description="technical, behavioral, or mixed")
    num_questions: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")


class MockInterviewResponse(BaseModel):
    """Response schema for mock interview."""
    interview_id: int
    interview_type: str
    job_title: str
    questions: List[InterviewQuestionResponse]
    message: str


class InterviewFeedbackRequest(BaseModel):
    """Request schema for generating interview feedback."""
    interview_id: int


class InterviewFeedbackResponse(BaseModel):
    """Response schema for interview feedback."""
    interview_id: int
    overall_score: int = Field(..., ge=0, le=100)
    category_scores: Dict[str, int]
    strengths: List[str]
    areas_for_improvement: List[str]
    recommendations: List[str]
    detailed_feedback: str


class InterviewStats(BaseModel):
    """Statistics for user's interviews."""
    total: int
    scheduled: int
    completed: int
    cancelled: int
    average_score: Optional[float] = None
