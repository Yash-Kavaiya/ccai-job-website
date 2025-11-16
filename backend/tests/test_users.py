"""
Tests for user endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from datetime import datetime, timedelta


@pytest.fixture
def authenticated_client(client, db_session):
    """Create an authenticated client with a test user and token."""
    # Create user with OTP
    user = User(
        email="testuser@example.com",
        otp_code="123456",
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
        is_active=True,
        full_name="Test User",
        bio="Test bio"
    )
    db_session.add(user)
    db_session.commit()

    # Get token
    verify_response = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": "testuser@example.com",
            "otp": "123456"
        }
    )

    token = verify_response.json()["access_token"]

    # Return client with auth headers
    return {
        "client": client,
        "token": token,
        "user": user,
        "headers": {"Authorization": f"Bearer {token}"}
    }


def test_get_my_profile(authenticated_client):
    """Test getting current user's profile."""
    response = authenticated_client["client"].get(
        "/api/v1/users/me",
        headers=authenticated_client["headers"]
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Test User"
    assert data["bio"] == "Test bio"
    assert "skills" in data
    assert "achievements" in data


def test_get_my_profile_unauthorized(client):
    """Test getting profile without authentication."""
    response = client.get("/api/v1/users/me")

    assert response.status_code == 403


def test_update_my_profile(authenticated_client):
    """Test updating current user's profile."""
    response = authenticated_client["client"].put(
        "/api/v1/users/me",
        headers=authenticated_client["headers"],
        json={
            "full_name": "Updated Name",
            "bio": "Updated bio",
            "location": "San Francisco, CA",
            "current_position": "Software Engineer",
            "company": "CCAI Jobs"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["bio"] == "Updated bio"
    assert data["location"] == "San Francisco, CA"
    assert data["current_position"] == "Software Engineer"
    assert data["company"] == "CCAI Jobs"


def test_get_user_public_profile(client, db_session):
    """Test getting public profile of a user."""
    # Create a user
    user = User(
        email="public@example.com",
        is_active=True,
        full_name="Public User",
        bio="Public bio",
        current_position="Developer"
    )
    db_session.add(user)
    db_session.commit()

    response = client.get(f"/api/v1/users/{user.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Public User"
    assert data["bio"] == "Public bio"
    assert "email" not in data  # Email should not be in public profile


def test_get_user_public_profile_not_found(client):
    """Test getting public profile of non-existent user."""
    response = client.get("/api/v1/users/99999")

    assert response.status_code == 404


def test_add_skill(authenticated_client):
    """Test adding a skill to user profile."""
    response = authenticated_client["client"].post(
        "/api/v1/users/me/skills",
        headers=authenticated_client["headers"],
        json={
            "skill_name": "Python",
            "proficiency_level": "advanced",
            "years_of_experience": 5.0
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["skill_name"] == "Python"
    assert data["proficiency_level"] == "advanced"
    assert data["years_of_experience"] == 5.0


def test_add_duplicate_skill(authenticated_client):
    """Test adding a duplicate skill."""
    # Add first skill
    authenticated_client["client"].post(
        "/api/v1/users/me/skills",
        headers=authenticated_client["headers"],
        json={"skill_name": "Python"}
    )

    # Try to add same skill again
    response = authenticated_client["client"].post(
        "/api/v1/users/me/skills",
        headers=authenticated_client["headers"],
        json={"skill_name": "Python"}
    )

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_get_my_skills(authenticated_client):
    """Test getting user's skills."""
    # Add some skills
    authenticated_client["client"].post(
        "/api/v1/users/me/skills",
        headers=authenticated_client["headers"],
        json={"skill_name": "Python"}
    )
    authenticated_client["client"].post(
        "/api/v1/users/me/skills",
        headers=authenticated_client["headers"],
        json={"skill_name": "JavaScript"}
    )

    response = authenticated_client["client"].get(
        "/api/v1/users/me/skills",
        headers=authenticated_client["headers"]
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    skill_names = [skill["skill_name"] for skill in data]
    assert "Python" in skill_names
    assert "JavaScript" in skill_names


def test_delete_skill(authenticated_client):
    """Test deleting a skill."""
    # Add skill
    add_response = authenticated_client["client"].post(
        "/api/v1/users/me/skills",
        headers=authenticated_client["headers"],
        json={"skill_name": "Python"}
    )
    skill_id = add_response.json()["id"]

    # Delete skill
    response = authenticated_client["client"].delete(
        f"/api/v1/users/me/skills/{skill_id}",
        headers=authenticated_client["headers"]
    )

    assert response.status_code == 204


def test_add_achievement(authenticated_client):
    """Test adding an achievement."""
    response = authenticated_client["client"].post(
        "/api/v1/users/me/achievements",
        headers=authenticated_client["headers"],
        json={
            "title": "Completed Python Course",
            "description": "Advanced Python Programming",
            "icon": "🏆"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Completed Python Course"
    assert data["description"] == "Advanced Python Programming"
    assert data["icon"] == "🏆"


def test_get_my_achievements(authenticated_client):
    """Test getting user's achievements."""
    # Add achievements
    authenticated_client["client"].post(
        "/api/v1/users/me/achievements",
        headers=authenticated_client["headers"],
        json={"title": "Achievement 1"}
    )
    authenticated_client["client"].post(
        "/api/v1/users/me/achievements",
        headers=authenticated_client["headers"],
        json={"title": "Achievement 2"}
    )

    response = authenticated_client["client"].get(
        "/api/v1/users/me/achievements",
        headers=authenticated_client["headers"]
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_delete_achievement(authenticated_client):
    """Test deleting an achievement."""
    # Add achievement
    add_response = authenticated_client["client"].post(
        "/api/v1/users/me/achievements",
        headers=authenticated_client["headers"],
        json={"title": "Test Achievement"}
    )
    achievement_id = add_response.json()["id"]

    # Delete achievement
    response = authenticated_client["client"].delete(
        f"/api/v1/users/me/achievements/{achievement_id}",
        headers=authenticated_client["headers"]
    )

    assert response.status_code == 204
