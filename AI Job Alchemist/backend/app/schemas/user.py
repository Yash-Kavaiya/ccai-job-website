"""User schemas for API validation."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    is_public: Optional[bool] = None


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: EmailStr
    display_name: str = Field(..., min_length=2, max_length=100)
    firebase_uid: str


class UserUpdate(BaseModel):
    """Schema for updating user."""
    display_name: Optional[str] = Field(None, min_length=2, max_length=100)
    profile: Optional[UserProfileUpdate] = None


class UserProfileResponse(BaseModel):
    """Schema for user profile response."""
    headline: str = ""
    bio: str = ""
    location: str = ""
    skills: List[str] = []
    experience_years: int = 0
    linkedin_url: str = ""
    github_url: str = ""
    portfolio_url: str = ""
    avatar_url: str = ""
    is_public: bool = False


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str
    email: str
    display_name: str
    profile: UserProfileResponse
    subscription_tier: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
