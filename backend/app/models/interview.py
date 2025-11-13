"""
Interview and InterviewQuestion models.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Interview(Base):
    """Interview model for scheduling and tracking interviews."""

    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    interview_type = Column(String(50), nullable=True)  # technical, behavioral, hr, mock
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=60)
    meeting_link = Column(Text, nullable=True)
    status = Column(String(50), default="scheduled", index=True)  # scheduled, completed, cancelled, rescheduled
    notes = Column(Text, nullable=True)
    feedback = Column(JSON, nullable=True)  # AI-generated feedback
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="interviews")
    application = relationship("Application", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Interview {self.interview_type} at {self.scheduled_at}>"


class InterviewQuestion(Base):
    """Interview questions and answers model."""

    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=True)  # technical, behavioral, situational
    user_answer = Column(Text, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)  # 0-10 score
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="questions")

    def __repr__(self):
        return f"<InterviewQuestion {self.question_type}>"
