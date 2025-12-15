"""Firestore implementation of Job repository."""

from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.repositories.base import BaseRepository
from app.models.job import Job, JobApplication
from app.core.dependencies import get_firestore_client


class JobRepository(BaseRepository[Job]):
    """
    Firestore implementation of Job repository.
    
    Single Responsibility: Only handles Job data persistence.
    """
    
    COLLECTION = "jobs"
    APPLICATIONS_COLLECTION = "job_applications"
    
    def __init__(self):
        self._db = get_firestore_client()
    
    @property
    def collection(self):
        return self._db.collection(self.COLLECTION)
    
    @property
    def applications_collection(self):
        return self._db.collection(self.APPLICATIONS_COLLECTION)
    
    async def create(self, entity: Job) -> Job:
        """Create a new job."""
        if not entity.id:
            entity.id = str(uuid.uuid4())
        
        doc_ref = self.collection.document(entity.id)
        doc_ref.set(entity.to_dict())
        return entity
    
    async def get_by_id(self, id: str) -> Optional[Job]:
        """Get job by ID."""
        doc = self.collection.document(id).get()
        if doc.exists:
            return Job.from_dict(doc.to_dict())
        return None
    
    async def get_all(self, limit: int = 100, offset: int = 0) -> List[Job]:
        """Get all active jobs with pagination."""
        docs = (
            self.collection
            .where("is_active", "==", True)
            .order_by("posted_at", direction="DESCENDING")
            .limit(limit)
            .offset(offset)
            .stream()
        )
        return [Job.from_dict(doc.to_dict()) for doc in docs]
    
    async def update(self, id: str, data: Dict[str, Any]) -> Optional[Job]:
        """Update a job."""
        doc_ref = self.collection.document(id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        doc_ref.update(data)
        updated_doc = doc_ref.get()
        return Job.from_dict(updated_doc.to_dict())
    
    async def delete(self, id: str) -> bool:
        """Soft delete a job (set is_active to False)."""
        doc_ref = self.collection.document(id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
        
        doc_ref.update({"is_active": False})
        return True
    
    async def query(self, filters: Dict[str, Any], limit: int = 100) -> List[Job]:
        """Query jobs with filters."""
        query = self.collection.where("is_active", "==", True)
        
        for field, value in filters.items():
            if field == "skills_required" and isinstance(value, list):
                query = query.where("skills_required", "array_contains_any", value)
            else:
                query = query.where(field, "==", value)
        
        docs = query.limit(limit).stream()
        return [Job.from_dict(doc.to_dict()) for doc in docs]
    
    async def search_by_text(
        self, 
        query_text: str, 
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 20
    ) -> List[Job]:
        """Basic text search (for full semantic search, use Qdrant)."""
        query = self.collection.where("is_active", "==", True)
        
        if location:
            query = query.where("location", "==", location)
        if job_type:
            query = query.where("job_type", "==", job_type)
        
        docs = query.order_by("posted_at", direction="DESCENDING").limit(limit).stream()
        return [Job.from_dict(doc.to_dict()) for doc in docs]
    
    async def get_by_company(self, company: str, limit: int = 20) -> List[Job]:
        """Get jobs by company."""
        docs = (
            self.collection
            .where("company", "==", company)
            .where("is_active", "==", True)
            .limit(limit)
            .stream()
        )
        return [Job.from_dict(doc.to_dict()) for doc in docs]
    
    # Job Application methods
    async def create_application(self, application: JobApplication) -> JobApplication:
        """Create a job application."""
        if not application.id:
            application.id = str(uuid.uuid4())
        
        doc_ref = self.applications_collection.document(application.id)
        doc_ref.set(application.to_dict())
        return application
    
    async def get_user_applications(self, user_id: str) -> List[JobApplication]:
        """Get all applications for a user."""
        docs = (
            self.applications_collection
            .where("user_id", "==", user_id)
            .order_by("created_at", direction="DESCENDING")
            .stream()
        )
        return [JobApplication.from_dict(doc.to_dict()) for doc in docs]
    
    async def update_application_status(
        self, 
        application_id: str, 
        status: str
    ) -> Optional[JobApplication]:
        """Update application status."""
        doc_ref = self.applications_collection.document(application_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        update_data = {"status": status, "updated_at": datetime.utcnow()}
        if status == "applied":
            update_data["applied_at"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        return JobApplication.from_dict(updated_doc.to_dict())
