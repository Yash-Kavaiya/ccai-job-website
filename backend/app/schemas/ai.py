"""
AI-related Pydantic schemas for chatbot, projects, etc.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Schema for a chat message."""
    role: str = Field(..., description="Message role: user or assistant")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request schema for AI chat."""
    message: str = Field(..., min_length=1, max_length=2000, description="User's message")
    session_id: Optional[str] = Field(None, description="Chat session ID for context")


class ChatResponse(BaseModel):
    """Response schema for AI chat."""
    message: str
    session_id: str
    model: str = "gemini-1.5-flash"


class ChatHistoryResponse(BaseModel):
    """Response schema for chat history."""
    id: int
    session_id: Optional[str]
    role: str
    content: str
    model: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectIdeaRequest(BaseModel):
    """Request schema for generating project ideas."""
    skills: List[str] = Field(..., min_items=1, description="List of user's skills")
    experience_level: str = Field(..., description="beginner, intermediate, or advanced")
    interests: Optional[List[str]] = Field(None, description="Optional list of interests")


class ProjectIdea(BaseModel):
    """Schema for a single project idea."""
    name: str
    description: str
    technologies: List[str]
    difficulty: str
    estimated_time: str
    learning_outcomes: List[str]
    portfolio_impact: str


class ProjectIdeasResponse(BaseModel):
    """Response schema for project ideas."""
    projects: List[ProjectIdea]
    generated_for: Dict[str, Any]


class InterviewQuestionGenRequest(BaseModel):
    """Request schema for generating interview questions."""
    job_title: str = Field(..., description="Job title")
    job_description: str = Field(..., description="Job description")
    interview_type: str = Field(
        default="technical",
        description="Type: technical, behavioral, or situational"
    )


class InterviewQuestion(BaseModel):
    """Schema for an interview question."""
    question: str
    type: str
    difficulty: str
    key_points: List[str]


class InterviewQuestionsResponse(BaseModel):
    """Response schema for interview questions."""
    questions: List[InterviewQuestion]
    job_title: str
    interview_type: str


class InterviewAnswerRequest(BaseModel):
    """Request schema for evaluating interview answer."""
    question: str = Field(..., description="Interview question")
    answer: str = Field(..., description="User's answer")
    question_type: str = Field(default="technical", description="Question type")


class InterviewAnswerEvaluation(BaseModel):
    """Response schema for interview answer evaluation."""
    score: int = Field(..., ge=0, le=10, description="Score out of 10")
    strengths: List[str]
    areas_for_improvement: List[str]
    feedback: str
    suggested_improvements: str


class JobMatchRequest(BaseModel):
    """Request schema for job matching."""
    job_id: int = Field(..., description="Job ID to match against")
    resume_id: Optional[int] = Field(None, description="Resume ID (uses primary if not specified)")


class JobMatchResponse(BaseModel):
    """Response schema for job match analysis."""
    job_id: int
    resume_id: int
    match_score: int = Field(..., ge=0, le=100)
    category_scores: Dict[str, int]
    matching_skills: List[str]
    missing_skills: List[str]
    matching_experience: List[str]
    concerns: List[str]
    strengths: List[str]
    recommendation: str
    reasoning: str
