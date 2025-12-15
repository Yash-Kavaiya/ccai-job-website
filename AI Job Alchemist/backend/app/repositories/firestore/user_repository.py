"""Firestore implementation of User repository."""

from typing import List, Optional, Dict, Any
import uuid

from app.repositories.base import BaseRepository
from app.models.user import User
from app.core.dependencies import get_firestore_client


class UserRepository(BaseRepository[User]):
    """
    Firestore implementation of User repository.
    
    Single Responsibility: Only handles User data persistence.
    """
    
    COLLECTION = "users"
    
    def __init__(self):
        self._db = get_firestore_client()
    
    @property
    def collection(self):
        return self._db.collection(self.COLLECTION)
    
    async def create(self, entity: User) -> User:
        """Create a new user."""
        if not entity.id:
            entity.id = str(uuid.uuid4())
        
        doc_ref = self.collection.document(entity.id)
        doc_ref.set(entity.to_dict())
        return entity
    
    async def get_by_id(self, id: str) -> Optional[User]:
        """Get user by ID."""
        doc = self.collection.document(id).get()
        if doc.exists:
            return User.from_dict(doc.to_dict())
        return None
    
    async def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        """Get user by Firebase UID."""
        docs = self.collection.where("firebase_uid", "==", firebase_uid).limit(1).stream()
        for doc in docs:
            return User.from_dict(doc.to_dict())
        return None
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        docs = self.collection.where("email", "==", email).limit(1).stream()
        for doc in docs:
            return User.from_dict(doc.to_dict())
        return None
    
    async def get_all(self, limit: int = 100, offset: int = 0) -> List[User]:
        """Get all users with pagination."""
        docs = self.collection.limit(limit).offset(offset).stream()
        return [User.from_dict(doc.to_dict()) for doc in docs]
    
    async def update(self, id: str, data: Dict[str, Any]) -> Optional[User]:
        """Update a user."""
        doc_ref = self.collection.document(id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        doc_ref.update(data)
        updated_doc = doc_ref.get()
        return User.from_dict(updated_doc.to_dict())
    
    async def delete(self, id: str) -> bool:
        """Delete a user."""
        doc_ref = self.collection.document(id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
        
        doc_ref.delete()
        return True
    
    async def query(self, filters: Dict[str, Any], limit: int = 100) -> List[User]:
        """Query users with filters."""
        query = self.collection
        
        for field, value in filters.items():
            query = query.where(field, "==", value)
        
        docs = query.limit(limit).stream()
        return [User.from_dict(doc.to_dict()) for doc in docs]
    
    async def get_public_profiles(self, limit: int = 20) -> List[User]:
        """Get users with public profiles."""
        docs = (
            self.collection
            .where("profile.is_public", "==", True)
            .where("is_active", "==", True)
            .limit(limit)
            .stream()
        )
        return [User.from_dict(doc.to_dict()) for doc in docs]
