"""Resume domain models."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class ResumeAnalysis:
    """Resume ATS analysis results."""
    ats_score: float = 0.0
    keyword_matches: List[str] = field(default_factory=list)
    missing_keywords: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    analyzed_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Resume:
    """Resume domain model."""
    id: str
    user_id: str
    name: str
    file_url: str
    file_path: str  # Firebase Storage path
    content_text: str = ""  # Extracted text content
    skills: List[str] = field(default_factory=list)
    experience_years: int = 0
    education: List[str] = field(default_factory=list)
    analysis: Optional[ResumeAnalysis] = None
    embedding_id: Optional[str] = None  # Qdrant point ID
    is_primary: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for Firestore."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "file_url": self.file_url,
            "file_path": self.file_path,
            "content_text": self.content_text,
            "skills": self.skills,
            "experience_years": self.experience_years,
            "education": self.education,
            "analysis": {
                "ats_score": self.analysis.ats_score,
                "keyword_matches": self.analysis.keyword_matches,
                "missing_keywords": self.analysis.missing_keywords,
                "suggestions": self.analysis.suggestions,
                "strengths": self.analysis.strengths,
                "weaknesses": self.analysis.weaknesses,
                "analyzed_at": self.analysis.analyzed_at,
            } if self.analysis else None,
            "embedding_id": self.embedding_id,
            "is_primary": self.is_primary,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Resume":
        """Create Resume from Firestore document."""
        analysis_data = data.get("analysis")
        analysis = None
        if analysis_data:
            analysis = ResumeAnalysis(
                ats_score=analysis_data.get("ats_score", 0.0),
                keyword_matches=analysis_data.get("keyword_matches", []),
                missing_keywords=analysis_data.get("missing_keywords", []),
                suggestions=analysis_data.get("suggestions", []),
                strengths=analysis_data.get("strengths", []),
                weaknesses=analysis_data.get("weaknesses", []),
                analyzed_at=analysis_data.get("analyzed_at", datetime.utcnow()),
            )
        
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            name=data["name"],
            file_url=data["file_url"],
            file_path=data["file_path"],
            content_text=data.get("content_text", ""),
            skills=data.get("skills", []),
            experience_years=data.get("experience_years", 0),
            education=data.get("education", []),
            analysis=analysis,
            embedding_id=data.get("embedding_id"),
            is_primary=data.get("is_primary", False),
            created_at=data.get("created_at", datetime.utcnow()),
            updated_at=data.get("updated_at", datetime.utcnow()),
        )
    
    def get_embedding_text(self) -> str:
        """Get text for generating embeddings."""
        skills_text = ", ".join(self.skills)
        return f"{self.content_text}. Skills: {skills_text}"
