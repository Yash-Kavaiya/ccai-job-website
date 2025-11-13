"""
User Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, HttpUrl


class UserSkillBase(BaseModel):
    """Base schema for user skills."""
    skill_name: str = Field(..., max_length=255)
    proficiency_level: Optional[str] = Field(None, max_length=50)  # beginner, intermediate, advanced, expert
    years_of_experience: Optional[float] = None
    is_verified: bool = False


class UserSkillCreate(UserSkillBase):
    """Schema for creating a user skill."""
    pass


class UserSkillResponse(UserSkillBase):
    """Schema for user skill response."""
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AchievementBase(BaseModel):
    """Base schema for achievements."""
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=100)
    date_achieved: Optional[datetime] = None


class AchievementCreate(AchievementBase):
    """Schema for creating an achievement."""
    pass


class AchievementResponse(AchievementBase):
    """Schema for achievement response."""
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    """Base schema for user."""
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    current_position: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    linkedin_url: Optional[HttpUrl] = None
    github_url: Optional[HttpUrl] = None
    portfolio_url: Optional[HttpUrl] = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: Optional[str] = Field(None, min_length=8)


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    current_position: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    linkedin_url: Optional[HttpUrl] = None
    github_url: Optional[HttpUrl] = None
    portfolio_url: Optional[HttpUrl] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    skills: List[UserSkillResponse] = []
    achievements: List[AchievementResponse] = []

    class Config:
        from_attributes = True


class UserPublicProfile(BaseModel):
    """Schema for public user profile (limited information)."""
    id: int
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    current_position: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None
    github_url: Optional[HttpUrl] = None
    portfolio_url: Optional[HttpUrl] = None
    skills: List[UserSkillResponse] = []
    achievements: List[AchievementResponse] = []

    class Config:
        from_attributes = True
