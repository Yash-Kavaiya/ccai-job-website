"""Job domain models."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from enum import Enum


class JobType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    REMOTE = "remote"


class JobSource(str, Enum):
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    COMPANY_WEBSITE = "company_website"
    TWITTER = "twitter"
    REDDIT = "reddit"
    MANUAL = "manual"


class ApplicationStatus(str, Enum):
    SAVED = "saved"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OFFERED = "offered"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


@dataclass
class Job:
    """Job listing domain model."""
    id: str
    title: str
    company: str
    description: str
    location: str = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: JobType = JobType.FULL_TIME
    skills_required: List[str] = field(default_factory=list)
    experience_level: str = ""
    source: JobSource = JobSource.MANUAL
    source_url: str = ""
    company_logo_url: str = ""
    posted_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    is_active: bool = True
    embedding_id: Optional[str] = None  # Qdrant point ID
    
    def to_dict(self) -> dict:
        """Convert to dictionary for Firestore."""
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "description": self.description,
            "location": self.location,
            "salary_min": self.salary_min,
            "salary_max": self.salary_max,
            "job_type": self.job_type.value,
            "skills_required": self.skills_required,
            "experience_level": self.experience_level,
            "source": self.source.value,
            "source_url": self.source_url,
            "company_logo_url": self.company_logo_url,
            "posted_at": self.posted_at,
            "expires_at": self.expires_at,
            "is_active": self.is_active,
            "embedding_id": self.embedding_id,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Job":
        """Create Job from Firestore document."""
        return cls(
            id=data["id"],
            title=data["title"],
            company=data["company"],
            description=data["description"],
            location=data.get("location", ""),
            salary_min=data.get("salary_min"),
            salary_max=data.get("salary_max"),
            job_type=JobType(data.get("job_type", "full_time")),
            skills_required=data.get("skills_required", []),
            experience_level=data.get("experience_level", ""),
            source=JobSource(data.get("source", "manual")),
            source_url=data.get("source_url", ""),
            company_logo_url=data.get("company_logo_url", ""),
            posted_at=data.get("posted_at", datetime.utcnow()),
            expires_at=data.get("expires_at"),
            is_active=data.get("is_active", True),
            embedding_id=data.get("embedding_id"),
        )
    
    def get_embedding_text(self) -> str:
        """Get text for generating embeddings."""
        skills_text = ", ".join(self.skills_required)
        return f"{self.title} at {self.company}. {self.description}. Skills: {skills_text}. Location: {self.location}"


@dataclass
class JobApplication:
    """Job application domain model."""
    id: str
    user_id: str
    job_id: str
    status: ApplicationStatus = ApplicationStatus.SAVED
    resume_id: Optional[str] = None
    cover_letter: str = ""
    match_score: float = 0.0
    notes: str = ""
    applied_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "job_id": self.job_id,
            "status": self.status.value,
            "resume_id": self.resume_id,
            "cover_letter": self.cover_letter,
            "match_score": self.match_score,
            "notes": self.notes,
            "applied_at": self.applied_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "JobApplication":
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            job_id=data["job_id"],
            status=ApplicationStatus(data.get("status", "saved")),
            resume_id=data.get("resume_id"),
            cover_letter=data.get("cover_letter", ""),
            match_score=data.get("match_score", 0.0),
            notes=data.get("notes", ""),
            applied_at=data.get("applied_at"),
            created_at=data.get("created_at", datetime.utcnow()),
            updated_at=data.get("updated_at", datetime.utcnow()),
        )
