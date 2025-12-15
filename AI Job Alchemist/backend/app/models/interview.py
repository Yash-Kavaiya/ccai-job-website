"""Interview domain models."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from enum import Enum


class InterviewType(str, Enum):
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    SYSTEM_DESIGN = "system_design"
    CODING = "coding"
    CASE_STUDY = "case_study"


class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class InterviewQuestion:
    """Interview question model."""
    id: str
    question: str
    category: str
    difficulty: str = "medium"
    expected_topics: List[str] = field(default_factory=list)
    sample_answer: str = ""


@dataclass
class InterviewResponse:
    """User's response to an interview question."""
    question_id: str
    response_text: str
    audio_url: Optional[str] = None
    score: float = 0.0
    feedback: str = ""
    strengths: List[str] = field(default_factory=list)
    improvements: List[str] = field(default_factory=list)
    responded_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Interview:
    """Mock interview session domain model."""
    id: str
    user_id: str
    job_id: Optional[str] = None
    interview_type: InterviewType = InterviewType.BEHAVIORAL
    status: InterviewStatus = InterviewStatus.SCHEDULED
    questions: List[InterviewQuestion] = field(default_factory=list)
    responses: List[InterviewResponse] = field(default_factory=list)
    overall_score: float = 0.0
    overall_feedback: str = ""
    duration_minutes: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for Firestore."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "job_id": self.job_id,
            "interview_type": self.interview_type.value,
            "status": self.status.value,
            "questions": [
                {
                    "id": q.id,
                    "question": q.question,
                    "category": q.category,
                    "difficulty": q.difficulty,
                    "expected_topics": q.expected_topics,
                    "sample_answer": q.sample_answer,
                }
                for q in self.questions
            ],
            "responses": [
                {
                    "question_id": r.question_id,
                    "response_text": r.response_text,
                    "audio_url": r.audio_url,
                    "score": r.score,
                    "feedback": r.feedback,
                    "strengths": r.strengths,
                    "improvements": r.improvements,
                    "responded_at": r.responded_at,
                }
                for r in self.responses
            ],
            "overall_score": self.overall_score,
            "overall_feedback": self.overall_feedback,
            "duration_minutes": self.duration_minutes,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "created_at": self.created_at,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Interview":
        """Create Interview from Firestore document."""
        questions = [
            InterviewQuestion(
                id=q["id"],
                question=q["question"],
                category=q["category"],
                difficulty=q.get("difficulty", "medium"),
                expected_topics=q.get("expected_topics", []),
                sample_answer=q.get("sample_answer", ""),
            )
            for q in data.get("questions", [])
        ]
        
        responses = [
            InterviewResponse(
                question_id=r["question_id"],
                response_text=r["response_text"],
                audio_url=r.get("audio_url"),
                score=r.get("score", 0.0),
                feedback=r.get("feedback", ""),
                strengths=r.get("strengths", []),
                improvements=r.get("improvements", []),
                responded_at=r.get("responded_at", datetime.utcnow()),
            )
            for r in data.get("responses", [])
        ]
        
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            job_id=data.get("job_id"),
            interview_type=InterviewType(data.get("interview_type", "behavioral")),
            status=InterviewStatus(data.get("status", "scheduled")),
            questions=questions,
            responses=responses,
            overall_score=data.get("overall_score", 0.0),
            overall_feedback=data.get("overall_feedback", ""),
            duration_minutes=data.get("duration_minutes", 0),
            started_at=data.get("started_at"),
            completed_at=data.get("completed_at"),
            created_at=data.get("created_at", datetime.utcnow()),
        )
