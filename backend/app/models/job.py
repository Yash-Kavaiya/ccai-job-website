"""
Job and SavedJob models.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Job(Base):
    """Job posting model."""

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    company_logo = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    job_type = Column(String(50), nullable=True)  # full-time, part-time, contract, remote
    experience_level = Column(String(50), nullable=True)  # entry, mid, senior, lead
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    currency = Column(String(10), default="USD")
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)  # Array of required skills
    source = Column(String(100), nullable=True)  # linkedin, indeed, glassdoor, custom
    external_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    posted_date = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    saved_by = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Job {self.title} at {self.company}>"


class SavedJob(Base):
    """Saved jobs model for users to bookmark jobs."""

    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_by")

    def __repr__(self):
        return f"<SavedJob user_id={self.user_id} job_id={self.job_id}>"
