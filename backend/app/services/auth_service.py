"""
Authentication service for handling OTP and JWT logic.
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.core.security import generate_otp, create_access_token, create_refresh_token, decode_token
from app.services.email_service import email_service


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def send_otp(db: Session, email: str) -> Tuple[bool, str]:
        """
        Generate and send OTP to user's email.

        Args:
            db: Database session
            email: User's email address

        Returns:
            Tuple of (success, message)
        """
        # Generate OTP
        otp = generate_otp()
        otp_expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Check if user exists
        user = db.query(User).filter(User.email == email).first()

        if user:
            # Update existing user's OTP
            user.otp_code = otp
            user.otp_expires_at = otp_expires_at
        else:
            # Create new user with OTP
            user = User(
                email=email,
                otp_code=otp,
                otp_expires_at=otp_expires_at,
                is_active=True,
                is_verified=False,
            )
            db.add(user)

        db.commit()
        db.refresh(user)

        # Send OTP via email
        email_sent = email_service.send_otp_email(
            to_email=email,
            otp=otp,
            user_name=user.full_name
        )

        if not email_sent:
            # Log for development (remove in production)
            print(f"📧 OTP for {email}: {otp}")

        return True, f"OTP sent to {email}"

    @staticmethod
    def verify_otp(db: Session, email: str, otp: str) -> Tuple[User, str, str]:
        """
        Verify OTP and generate JWT tokens.

        Args:
            db: Database session
            email: User's email address
            otp: OTP code to verify

        Returns:
            Tuple of (user, access_token, refresh_token)

        Raises:
            HTTPException: If OTP is invalid or expired
        """
        # Find user
        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Check if OTP exists
        if not user.otp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No OTP found. Please request a new one."
            )

        # Check if OTP is expired
        if user.otp_expires_at and user.otp_expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new one."
            )

        # Verify OTP
        if user.otp_code != otp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OTP code"
            )

        # OTP is valid - clear it and mark user as verified
        user.otp_code = None
        user.otp_expires_at = None
        user.is_verified = True
        user.is_active = True

        db.commit()
        db.refresh(user)

        # Generate JWT tokens
        token_data = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Send welcome email for new users (if they don't have a name yet)
        if not user.full_name:
            try:
                email_service.send_welcome_email(user.email, "there")
            except:
                pass  # Don't fail auth if welcome email fails

        return user, access_token, refresh_token

    @staticmethod
    def refresh_access_token(refresh_token: str) -> str:
        """
        Generate new access token from refresh token.

        Args:
            refresh_token: Valid refresh token

        Returns:
            New access token

        Raises:
            HTTPException: If refresh token is invalid
        """
        # Decode refresh token
        payload = decode_token(refresh_token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        # Check token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        # Generate new access token
        token_data = {
            "sub": payload.get("sub"),
            "email": payload.get("email")
        }
        access_token = create_access_token(token_data)

        return access_token

    @staticmethod
    def get_current_user(db: Session, token: str) -> User:
        """
        Get current user from access token.

        Args:
            db: Database session
            token: JWT access token

        Returns:
            User object

        Raises:
            HTTPException: If token is invalid or user not found
        """
        # Decode token
        payload = decode_token(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check token type
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user ID from token
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user from database
        user = db.query(User).filter(User.id == int(user_id)).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        return user


# Create singleton instance
auth_service = AuthService()
