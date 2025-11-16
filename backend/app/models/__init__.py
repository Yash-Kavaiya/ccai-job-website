"""
Database models package.
Imports all models for easy access.
"""
from app.models.user import User, UserSkill, Achievement
from app.models.job import Job, SavedJob
from app.models.resume import Resume
from app.models.application import Application
from app.models.interview import Interview, InterviewQuestion
from app.models.social import Connection, Message
from app.models.ai_agent import AIChatHistory

__all__ = [
    "User",
    "UserSkill",
    "Achievement",
    "Job",
    "SavedJob",
    "Resume",
    "Application",
    "Interview",
    "InterviewQuestion",
    "Connection",
    "Message",
    "AIChatHistory",
]
