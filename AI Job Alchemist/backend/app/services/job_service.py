"""Job service for business logic."""

from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.job import Job, JobApplication, ApplicationStatus
from app.repositories.firestore.job_repository import JobRepository
from app.core.exceptions import NotFoundError


class JobService:
    """
    Job service handling business logic.
    
    Single Responsibility: Job-related business operations.
    """
    
    def __init__(self, repository: Optional[JobRepository] = None):
        self._repository = repository or JobRepository()
    
    async def create_job(self, job_data: Dict[str, Any]) -> Job:
        """Create a new job listing."""
        job = Job(
            id="",
            title=job_data["title"],
            company=job_data["company"],
            description=job_data["description"],
            location=job_data.get("location", ""),
            salary_min=job_data.get("salary_min"),
            salary_max=job_data.get("salary_max"),
            job_type=job_data.get("job_type", "full_time"),
            skills_required=job_data.get("skills_required", []),
            experience_level=job_data.get("experience_level", ""),
            source=job_data.get("source", "manual"),
            source_url=job_data.get("source_url", ""),
            company_logo_url=job_data.get("company_logo_url", ""),
        )
        
        return await self._repository.create(job)
    
    async def get_job(self, job_id: str) -> Job:
        """Get job by ID."""
        job = await self._repository.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job", job_id)
        return job
    
    async def get_jobs(
        self, 
        limit: int = 20, 
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Job]:
        """Get jobs with optional filters."""
        if filters:
            return await self._repository.query(filters, limit)
        return await self._repository.get_all(limit, offset)
    
    async def update_job(self, job_id: str, data: Dict[str, Any]) -> Job:
        """Update job data."""
        job = await self._repository.update(job_id, data)
        if not job:
            raise NotFoundError("Job", job_id)
        return job
    
    async def delete_job(self, job_id: str) -> bool:
        """Soft delete a job."""
        return await self._repository.delete(job_id)
    
    async def search_jobs(
        self,
        query: str = "",
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        skills: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[Job]:
        """Search jobs with filters."""
        filters = {}
        if location:
            filters["location"] = location
        if job_type:
            filters["job_type"] = job_type
        if skills:
            filters["skills_required"] = skills
        
        if filters:
            return await self._repository.query(filters, limit)
        return await self._repository.get_all(limit)
    
    # Application methods
    async def save_job(
        self, 
        user_id: str, 
        job_id: str,
        match_score: float = 0.0
    ) -> JobApplication:
        """Save a job for a user."""
        application = JobApplication(
            id="",
            user_id=user_id,
            job_id=job_id,
            status=ApplicationStatus.SAVED,
            match_score=match_score,
        )
        return await self._repository.create_application(application)
    
    async def apply_to_job(
        self,
        user_id: str,
        job_id: str,
        resume_id: str,
        cover_letter: str = "",
        match_score: float = 0.0
    ) -> JobApplication:
        """Apply to a job."""
        application = JobApplication(
            id="",
            user_id=user_id,
            job_id=job_id,
            status=ApplicationStatus.APPLIED,
            resume_id=resume_id,
            cover_letter=cover_letter,
            match_score=match_score,
            applied_at=datetime.utcnow(),
        )
        return await self._repository.create_application(application)
    
    async def get_user_applications(self, user_id: str) -> List[JobApplication]:
        """Get all applications for a user."""
        return await self._repository.get_user_applications(user_id)
    
    async def update_application_status(
        self,
        application_id: str,
        status: str
    ) -> JobApplication:
        """Update application status."""
        application = await self._repository.update_application_status(
            application_id, status
        )
        if not application:
            raise NotFoundError("JobApplication", application_id)
        return application
