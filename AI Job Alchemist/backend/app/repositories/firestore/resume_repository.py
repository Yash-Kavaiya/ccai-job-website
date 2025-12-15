"""Firestore implementation of Resume repository."""

from typing import List, Optional, Dict, Any
import uuid

from app.repositories.base import BaseRepository
from app.models.resume import Resume
from app.core.dependencies import get_firestore_client


class ResumeRepository(BaseRepository[Resume]):
    """
    Firestore implementation of Resume repository.
    
    Single Responsibility: Only handles Resume data persistence.
    """
    
    COLLECTION = "resumes"
    
    def __init__(self):
        self._db = get_firestore_client()
    
    @property
    def collection(self):
        return self._db.collection(self.COLLECTION)
    
    async def create(self, entity: Resume) -> Resume:
        """Create a new resume."""
        if not entity.id:
            entity.id = str(uuid.uuid4())
        
        doc_ref = self.collection.document(entity.id)
        doc_ref.set(entity.to_dict())
        return entity
    
    async def get_by_id(self, id: str) -> Optional[Resume]:
        """Get resume by ID."""
        doc = self.collection.document(id).get()
        if doc.exists:
            return Resume.from_dict(doc.to_dict())
        return None
    
    async def get_all(self, limit: int = 100, offset: int = 0) -> List[Resume]:
        """Get all resumes with pagination."""
        docs = self.collection.limit(limit).offset(offset).stream()
        return [Resume.from_dict(doc.to_dict()) for doc in docs]
    
    async def update(self, id: str, data: Dict[str, Any]) -> Optional[Resume]:
        """Update a resume."""
        doc_ref = self.collection.document(id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        doc_ref.update(data)
        updated_doc = doc_ref.get()
        return Resume.from_dict(updated_doc.to_dict())
    
    async def delete(self, id: str) -> bool:
        """Delete a resume."""
        doc_ref = self.collection.document(id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
        
        doc_ref.delete()
        return True
    
    async def query(self, filters: Dict[str, Any], limit: int = 100) -> List[Resume]:
        """Query resumes with filters."""
        query = self.collection
        
        for field, value in filters.items():
            query = query.where(field, "==", value)
        
        docs = query.limit(limit).stream()
        return [Resume.from_dict(doc.to_dict()) for doc in docs]
    
    async def get_by_user_id(self, user_id: str) -> List[Resume]:
        """Get all resumes for a user."""
        docs = (
            self.collection
            .where("user_id", "==", user_id)
            .order_by("created_at", direction="DESCENDING")
            .stream()
        )
        return [Resume.from_dict(doc.to_dict()) for doc in docs]
    
    async def get_primary_resume(self, user_id: str) -> Optional[Resume]:
        """Get user's primary resume."""
        docs = (
            self.collection
            .where("user_id", "==", user_id)
            .where("is_primary", "==", True)
            .limit(1)
            .stream()
        )
        for doc in docs:
            return Resume.from_dict(doc.to_dict())
        return None
    
    async def set_primary(self, user_id: str, resume_id: str) -> bool:
        """Set a resume as primary (unset others)."""
        # Unset current primary
        current_primary = await self.get_primary_resume(user_id)
        if current_primary and current_primary.id != resume_id:
            self.collection.document(current_primary.id).update({"is_primary": False})
        
        # Set new primary
        doc_ref = self.collection.document(resume_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
        
        doc_ref.update({"is_primary": True})
        return True
