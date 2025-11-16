"""
Authentication Pydantic schemas for request/response validation.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class SendOTPRequest(BaseModel):
    """Request schema for sending OTP."""
    email: EmailStr = Field(..., description="User's email address")


class SendOTPResponse(BaseModel):
    """Response schema for sending OTP."""
    message: str
    email: str


class VerifyOTPRequest(BaseModel):
    """Request schema for verifying OTP."""
    email: EmailStr = Field(..., description="User's email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")


class TokenResponse(BaseModel):
    """Response schema for JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshTokenRequest(BaseModel):
    """Request schema for refreshing access token."""
    refresh_token: str = Field(..., description="Refresh token")


class RefreshTokenResponse(BaseModel):
    """Response schema for refreshed access token."""
    access_token: str
    token_type: str = "bearer"


# Import UserResponse for TokenResponse (will be defined in user.py)
from app.schemas.user import UserResponse

# Update forward references
TokenResponse.model_rebuild()
