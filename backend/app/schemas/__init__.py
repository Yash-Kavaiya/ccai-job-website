"""
Pydantic schemas package.
"""
from app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    TokenResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserPublicProfile,
    UserSkillBase,
    UserSkillCreate,
    UserSkillResponse,
    AchievementBase,
    AchievementCreate,
    AchievementResponse,
)

__all__ = [
    # Auth
    "SendOTPRequest",
    "SendOTPResponse",
    "VerifyOTPRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "RefreshTokenResponse",
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserPublicProfile",
    "UserSkillBase",
    "UserSkillCreate",
    "UserSkillResponse",
    "AchievementBase",
    "AchievementCreate",
    "AchievementResponse",
]
