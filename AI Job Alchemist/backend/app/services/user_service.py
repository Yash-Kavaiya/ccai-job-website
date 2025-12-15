"""User service for business logic."""

from typing import Optional, Dict, Any
from datetime import datetime

from app.models.user import User, UserProfile, SubscriptionTier
from app.repositories.firestore.user_repository import UserRepository
from app.core.exceptions import NotFoundError, DuplicateError


class UserService:
    """
    User service handling business logic.
    
    Single Responsibility: User-related business operations.
    Dependency Inversion: Depends on repository abstraction.
    """
    
    def __init__(self, repository: Optional[UserRepository] = None):
        self._repository = repository or UserRepository()
    
    async def create_user(
        self, 
        email: str, 
        display_name: str, 
        firebase_uid: str
    ) -> User:
        """Create a new user."""
        # Check for existing user
        existing = await self._repository.get_by_firebase_uid(firebase_uid)
        if existing:
            return existing  # Return existing user instead of error
        
        existing_email = await self._repository.get_by_email(email)
        if existing_email:
            raise DuplicateError("User", "email")
        
        user = User(
            id="",
            email=email,
            display_name=display_name,
            firebase_uid=firebase_uid,
            profile=UserProfile(),
            subscription_tier=SubscriptionTier.FREE,
        )
        
        return await self._repository.create(user)
    
    async def get_user(self, user_id: str) -> User:
        """Get user by ID."""
        user = await self._repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        return user
    
    async def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        """Get user by Firebase UID."""
        return await self._repository.get_by_firebase_uid(firebase_uid)
    
    async def update_user(self, user_id: str, data: Dict[str, Any]) -> User:
        """Update user data."""
        data["updated_at"] = datetime.utcnow()
        user = await self._repository.update(user_id, data)
        if not user:
            raise NotFoundError("User", user_id)
        return user
    
    async def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> User:
        """Update user profile."""
        user = await self.get_user(user_id)
        
        # Merge profile data
        current_profile = user.profile.__dict__
        current_profile.update({k: v for k, v in profile_data.items() if v is not None})
        
        return await self.update_user(user_id, {"profile": current_profile})
    
    async def upgrade_subscription(
        self, 
        user_id: str, 
        tier: SubscriptionTier
    ) -> User:
        """Upgrade user subscription tier."""
        return await self.update_user(user_id, {"subscription_tier": tier.value})
    
    async def deactivate_user(self, user_id: str) -> bool:
        """Deactivate a user account."""
        await self.update_user(user_id, {"is_active": False})
        return True
    
    async def get_public_profiles(self, limit: int = 20):
        """Get users with public profiles."""
        return await self._repository.get_public_profiles(limit)
