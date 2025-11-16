"""
Tests for authentication endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from datetime import datetime, timedelta


def test_send_otp_new_user(client):
    """Test sending OTP to a new user."""
    response = client.post(
        "/api/v1/auth/send-otp",
        json={"email": "newuser@example.com"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "message" in data


def test_send_otp_existing_user(client, db_session):
    """Test sending OTP to an existing user."""
    # Create user
    user = User(
        email="existing@example.com",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/send-otp",
        json={"email": "existing@example.com"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "existing@example.com"


def test_send_otp_invalid_email(client):
    """Test sending OTP with invalid email format."""
    response = client.post(
        "/api/v1/auth/send-otp",
        json={"email": "invalid-email"}
    )

    assert response.status_code == 422  # Validation error


def test_verify_otp_success(client, db_session):
    """Test successful OTP verification."""
    # Create user with OTP
    user = User(
        email="test@example.com",
        otp_code="123456",
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
        is_active=True,
        is_verified=False
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "test@example.com",
            "otp": "123456"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == "test@example.com"


def test_verify_otp_wrong_code(client, db_session):
    """Test OTP verification with wrong code."""
    user = User(
        email="test@example.com",
        otp_code="123456",
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "test@example.com",
            "otp": "999999"
        }
    )

    assert response.status_code == 401
    assert "Invalid OTP" in response.json()["detail"]


def test_verify_otp_expired(client, db_session):
    """Test OTP verification with expired code."""
    user = User(
        email="test@example.com",
        otp_code="123456",
        otp_expires_at=datetime.utcnow() - timedelta(minutes=1),  # Expired
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "test@example.com",
            "otp": "123456"
        }
    )

    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()


def test_verify_otp_no_otp(client, db_session):
    """Test OTP verification when no OTP was sent."""
    user = User(
        email="test@example.com",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "test@example.com",
            "otp": "123456"
        }
    )

    assert response.status_code == 400


def test_verify_otp_user_not_found(client):
    """Test OTP verification for non-existent user."""
    response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "nonexistent@example.com",
            "otp": "123456"
        }
    )

    assert response.status_code == 404


def test_get_current_user_with_valid_token(client, db_session):
    """Test getting current user with valid token."""
    # Create and verify user to get token
    user = User(
        email="test@example.com",
        otp_code="123456",
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
        is_active=True,
        full_name="Test User"
    )
    db_session.add(user)
    db_session.commit()

    # Get token
    verify_response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "test@example.com",
            "otp": "123456"
        }
    )

    token = verify_response.json()["access_token"]

    # Get current user
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


def test_get_current_user_without_token(client):
    """Test getting current user without token."""
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 403  # Forbidden (no auth header)


def test_get_current_user_with_invalid_token(client):
    """Test getting current user with invalid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )

    assert response.status_code == 401


def test_logout(client, db_session):
    """Test logout endpoint."""
    # Create and verify user to get token
    user = User(
        email="test@example.com",
        otp_code="123456",
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Get token
    verify_response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "test@example.com",
            "otp": "123456"
        }
    )

    token = verify_response.json()["access_token"]

    # Logout
    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert "message" in response.json()


def test_refresh_token(client, db_session):
    """Test refreshing access token."""
    # Create and verify user to get tokens
    user = User(
        email="test@example.com",
        otp_code="123456",
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Get tokens
    verify_response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "test@example.com",
            "otp": "123456"
        }
    )

    refresh_token = verify_response.json()["refresh_token"]

    # Refresh access token
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_refresh_token_invalid(client):
    """Test refreshing with invalid token."""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token"}
    )

    assert response.status_code == 401
