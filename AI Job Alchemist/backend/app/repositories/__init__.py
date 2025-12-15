"""Repository layer for data access."""
from .base import BaseRepository, VectorRepository
from .firestore.user_repository import UserRepository
from .firestore.job_repository import JobRepository
from .firestore.resume_repository import ResumeRepository
from .firestore.interview_repository import InterviewRepository
from .qdrant.vector_repository import QdrantVectorRepository

__all__ = [
    "BaseRepository",
    "VectorRepository",
    "UserRepository",
    "JobRepository",
    "ResumeRepository",
    "InterviewRepository",
    "QdrantVectorRepository",
]
