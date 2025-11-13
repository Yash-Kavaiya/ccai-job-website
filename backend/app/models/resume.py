"""
Resume model for storing and analyzing resumes.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Resume(Base):
    """Resume model for uploaded resume files and analysis."""

    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    original_text = Column(Text, nullable=True)  # Extracted text from PDF/DOCX
    parsed_data = Column(JSON, nullable=True)  # Structured data: name, email, skills, etc.
    ats_score = Column(Integer, nullable=True)  # 0-100 score
    analysis = Column(JSON, nullable=True)  # Detailed AI analysis
    suggestions = Column(JSON, nullable=True)  # Improvement suggestions
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")

    def __repr__(self):
        return f"<Resume {self.filename}>"
