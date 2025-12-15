"""Firestore implementation of Interview repository."""

from typing import List, Optional, Dict, Any
import uuid

from app.repositories.base import BaseRepository
from app.models.interview import Interview
from app.core.dependencies import get_firestore_client


class InterviewRepository(BaseRepository[Interview]):
    """
    Firestore implementation of Interview repository.
    
    Single Responsibility: Only handles Interview data persistence.
    """
    
    COLLECTION = "interviews"
    
    def __init__(self):
        self._db = get_firestore_client()
    
    @property
    def collection(self):
        return self._db.collection(self.COLLECTION)
    
    async def create(self, entity: Interview) -> Interview:
        """Create a new interview."""
        if not entity.id:
            entity.id = str(uuid.uuid4())
        
        doc_ref = self.collection.document(entity.id)
        doc_ref.set(entity.to_dict())
        return entity
    
    async def get_by_id(self, id: str) -> Optional[Interview]:
        """Get interview by ID."""
        doc = self.collection.document(id).get()
        if doc.exists:
            return Interview.from_dict(doc.to_dict())
        return None
    
    async def get_all(self, limit: int = 100, offset: int = 0) -> List[Interview]:
        """Get all interviews with pagination."""
        docs = self.collection.limit(limit).offset(offset).stream()
        return [Interview.from_dict(doc.to_dict()) for doc in docs]
    
    async def update(self, id: str, data: Dict[str, Any]) -> Optional[Interview]:
        """Update an interview."""
        doc_ref = self.collection.document(id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        doc_ref.update(data)
        updated_doc = doc_ref.get()
        return Interview.from_dict(updated_doc.to_dict())
    
    async def delete(self, id: str) -> bool:
        """Delete an interview."""
        doc_ref = self.collection.document(id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
        
        doc_ref.delete()
        return True
    
    async def query(self, filters: Dict[str, Any], limit: int = 100) -> List[Interview]:
        """Query interviews with filters."""
        query = self.collection
        
        for field, value in filters.items():
            query = query.where(field, "==", value)
        
        docs = query.limit(limit).stream()
        return [Interview.from_dict(doc.to_dict()) for doc in docs]
    
    async def get_by_user_id(self, user_id: str, limit: int = 20) -> List[Interview]:
        """Get all interviews for a user."""
        docs = (
            self.collection
            .where("user_id", "==", user_id)
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        return [Interview.from_dict(doc.to_dict()) for doc in docs]
    
    async def get_completed_interviews(self, user_id: str) -> List[Interview]:
        """Get completed interviews for a user."""
        docs = (
            self.collection
            .where("user_id", "==", user_id)
            .where("status", "==", "completed")
            .order_by("completed_at", direction="DESCENDING")
            .stream()
        )
        return [Interview.from_dict(doc.to_dict()) for doc in docs]
