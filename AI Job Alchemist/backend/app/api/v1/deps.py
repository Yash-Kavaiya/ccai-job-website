"""API dependencies for authentication and service injection."""

from typing import Optional
from fastapi import Depends, Header

from app.core.security import verify_firebase_token, decode_access_token
from app.core.exceptions import unauthorized_exception
from app.services import (
    UserService,
    JobService,
    ResumeService,
    MatchingService,
    InterviewService,
)
from app.models.user import User


async def get_current_user_optional(
    authorization: Optional[str] = Header(None)
) -> Optional[dict]:
    """Get current user from token (optional)."""
    if not authorization:
        return None
    
    if not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    
    # Try Firebase token first
    user_data = await verify_firebase_token(token)
    if user_data:
        return user_data
    
    # Try JWT token
    user_data = decode_access_token(token)
    return user_data


async def get_current_user(
    authorization: str = Header(..., description="Bearer token")
) -> dict:
    """Get current user from token (required)."""
    if not authorization.startswith("Bearer "):
        raise unauthorized_exception("Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    # Try Firebase token first
    user_data = await verify_firebase_token(token)
    if user_data:
        return user_data
    
    # Try JWT token
    user_data = decode_access_token(token)
    if not user_data:
        raise unauthorized_exception("Invalid or expired token")
    
    return user_data


# Service dependencies
def get_user_service() -> UserService:
    return UserService()


def get_job_service() -> JobService:
    return JobService()


def get_resume_service() -> ResumeService:
    return ResumeService()


def get_matching_service() -> MatchingService:
    return MatchingService()


def get_interview_service() -> InterviewService:
    return InterviewService()
