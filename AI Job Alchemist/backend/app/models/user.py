"""User domain models."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from enum import Enum


class SubscriptionTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class UserProfile:
    """User profile information."""
    headline: str = ""
    bio: str = ""
    location: str = ""
    skills: List[str] = field(default_factory=list)
    experience_years: int = 0
    linkedin_url: str = ""
    github_url: str = ""
    portfolio_url: str = ""
    avatar_url: str = ""
    is_public: bool = False


@dataclass
class User:
    """User domain model."""
    id: str
    email: str
    display_name: str
    firebase_uid: str
    profile: UserProfile = field(default_factory=UserProfile)
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    def to_dict(self) -> dict:
        """Convert to dictionary for Firestore."""
        return {
            "id": self.id,
            "email": self.email,
            "display_name": self.display_name,
            "firebase_uid": self.firebase_uid,
            "profile": {
                "headline": self.profile.headline,
                "bio": self.profile.bio,
                "location": self.profile.location,
                "skills": self.profile.skills,
                "experience_years": self.profile.experience_years,
                "linkedin_url": self.profile.linkedin_url,
                "github_url": self.profile.github_url,
                "portfolio_url": self.profile.portfolio_url,
                "avatar_url": self.profile.avatar_url,
                "is_public": self.profile.is_public,
            },
            "subscription_tier": self.subscription_tier.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_active": self.is_active,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "User":
        """Create User from Firestore document."""
        profile_data = data.get("profile", {})
        return cls(
            id=data["id"],
            email=data["email"],
            display_name=data["display_name"],
            firebase_uid=data["firebase_uid"],
            profile=UserProfile(
                headline=profile_data.get("headline", ""),
                bio=profile_data.get("bio", ""),
                location=profile_data.get("location", ""),
                skills=profile_data.get("skills", []),
                experience_years=profile_data.get("experience_years", 0),
                linkedin_url=profile_data.get("linkedin_url", ""),
                github_url=profile_data.get("github_url", ""),
                portfolio_url=profile_data.get("portfolio_url", ""),
                avatar_url=profile_data.get("avatar_url", ""),
                is_public=profile_data.get("is_public", False),
            ),
            subscription_tier=SubscriptionTier(data.get("subscription_tier", "free")),
            created_at=data.get("created_at", datetime.utcnow()),
            updated_at=data.get("updated_at", datetime.utcnow()),
            is_active=data.get("is_active", True),
        )
