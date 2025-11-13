"""
Authentication API endpoints.
Handles OTP generation, verification, token refresh, and logout.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    TokenResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/send-otp", response_model=SendOTPResponse, status_code=status.HTTP_200_OK)
async def send_otp(
    request: SendOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Send OTP code to user's email for authentication.

    - **email**: User's email address
    - Returns: Success message with email

    **Flow:**
    1. Generates 6-digit OTP code
    2. Creates user if doesn't exist or updates existing user
    3. Sends OTP via email (SendGrid/SMTP)
    4. OTP expires in 10 minutes
    """
    try:
        success, message = auth_service.send_otp(db, request.email)

        return SendOTPResponse(
            message=message,
            email=request.email
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )


@router.post("/verify-otp", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def verify_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Verify OTP code and return JWT tokens.

    - **email**: User's email address
    - **otp**: 6-digit OTP code received via email
    - Returns: Access token, refresh token, and user information

    **Flow:**
    1. Validates OTP code
    2. Checks if OTP is expired
    3. Generates JWT access and refresh tokens
    4. Returns tokens and user data
    """
    user, access_token, refresh_token = auth_service.verify_otp(
        db,
        request.email,
        request.otp
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=RefreshTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token.

    - **refresh_token**: Valid refresh token
    - Returns: New access token

    **Flow:**
    1. Validates refresh token
    2. Generates new access token
    3. Returns new access token
    """
    access_token = auth_service.refresh_access_token(request.refresh_token)

    return RefreshTokenResponse(
        access_token=access_token,
        token_type="bearer"
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user.

    - Requires: Valid access token
    - Returns: Success message

    **Note:** In a stateless JWT system, logout is handled client-side
    by removing the tokens. This endpoint is provided for consistency
    and can be extended for token blacklisting if needed.
    """
    return {
        "message": "Successfully logged out",
        "detail": "Please remove tokens from client storage"
    }


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's information.

    - Requires: Valid access token
    - Returns: Current user's profile data

    **Use this endpoint to:**
    - Verify token validity
    - Get updated user information
    - Check authentication status
    """
    return UserResponse.model_validate(current_user)
