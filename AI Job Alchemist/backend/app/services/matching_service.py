"""Full-featured AI-powered job matching service using Qdrant Cloud."""

from typing import List, Dict, Any, Optional
import uuid
import numpy as np

from app.models.job import Job
from app.models.resume import Resume
from app.repositories.qdrant.vector_repository import (
    QdrantVectorRepository,
    get_jobs_vector_repository,
    get_resumes_vector_repository,
)
from app.repositories.firestore.job_repository import JobRepository
from app.repositories.firestore.resume_repository import ResumeRepository
from app.core.dependencies import get_embedding_model
from app.config.settings import settings


class MatchingService:
    """
    AI-powered job matching service using Qdrant Cloud vector search.
    
    Features:
    - Semantic job-resume matching using sentence embeddings
    - Skill-based matching with gap analysis
    - Job search with natural language queries
    - Candidate matching for recruiters
    - Match score calculation with detailed breakdown
    """
    
    def __init__(
        self,
        jobs_vector_repo: Optional[QdrantVectorRepository] = None,
        resumes_vector_repo: Optional[QdrantVectorRepository] = None,
        job_repository: Optional[JobRepository] = None,
        resume_repository: Optional[ResumeRepository] = None,
    ):
        self._jobs_vector_repo = jobs_vector_repo or get_jobs_vector_repository()
        self._resumes_vector_repo = resumes_vector_repo or get_resumes_vector_repository()
        self._job_repository = job_repository or JobRepository()
        self._resume_repository = resume_repository or ResumeRepository()
        self._embedding_model = None
    
    @property
    def embedding_model(self):
        """Lazy load embedding model."""
        if self._embedding_model is None:
            self._embedding_model = get_embedding_model()
        return self._embedding_model
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text."""
        embedding = self.embedding_model.encode(text)
        return embedding.tolist()
    
    # ============== JOB INDEXING ==============
    
    async def index_job(self, job: Job) -> str:
        """
        Index a job in Qdrant for semantic search.
        
        Returns the embedding ID.
        """
        embedding_text = self._get_job_embedding_text(job)
        vector = self._generate_embedding(embedding_text)
        
        embedding_id = job.embedding_id or str(uuid.uuid4())
        
        payload = {
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "skills": job.skills_required,
            "job_type": job.job_type.value if hasattr(job.job_type, 'value') else str(job.job_type),
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "experience_level": job.experience_level,
            "is_active": job.is_active,
        }
        
        await self._jobs_vector_repo.upsert_vector(embedding_id, vector, payload)
        
        # Update job with embedding ID
        if not job.embedding_id:
            await self._job_repository.update(job.id, {"embedding_id": embedding_id})
        
        return embedding_id
    
    def _get_job_embedding_text(self, job: Job) -> str:
        """Create rich text for job embedding."""
        skills_text = ", ".join(job.skills_required) if job.skills_required else ""
        salary_text = ""
        if job.salary_min and job.salary_max:
            salary_text = f"Salary: ${job.salary_min:,} - ${job.salary_max:,}"
        
        return f"""
        Job Title: {job.title}
        Company: {job.company}
        Location: {job.location}
        Description: {job.description}
        Required Skills: {skills_text}
        Experience Level: {job.experience_level}
        {salary_text}
        """.strip()
    
    async def index_jobs_batch(self, jobs: List[Job]) -> int:
        """Index multiple jobs in batch."""
        points = []
        for job in jobs:
            embedding_text = self._get_job_embedding_text(job)
            vector = self._generate_embedding(embedding_text)
            embedding_id = job.embedding_id or str(uuid.uuid4())
            
            points.append({
                "id": embedding_id,
                "vector": vector,
                "payload": {
                    "job_id": job.id,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "skills": job.skills_required,
                    "job_type": job.job_type.value if hasattr(job.job_type, 'value') else str(job.job_type),
                    "is_active": job.is_active,
                }
            })
        
        return await self._jobs_vector_repo.batch_upsert(points)
    
    # ============== RESUME INDEXING ==============
    
    async def index_resume(self, resume: Resume) -> str:
        """
        Index a resume in Qdrant for semantic search.
        
        Returns the embedding ID.
        """
        embedding_text = self._get_resume_embedding_text(resume)
        vector = self._generate_embedding(embedding_text)
        
        embedding_id = resume.embedding_id or str(uuid.uuid4())
        
        payload = {
            "resume_id": resume.id,
            "user_id": resume.user_id,
            "skills": resume.skills,
            "experience_years": resume.experience_years,
            "education": resume.education,
        }
        
        await self._resumes_vector_repo.upsert_vector(embedding_id, vector, payload)
        
        return embedding_id
    
    def _get_resume_embedding_text(self, resume: Resume) -> str:
        """Create rich text for resume embedding."""
        skills_text = ", ".join(resume.skills) if resume.skills else ""
        education_text = ", ".join(resume.education) if resume.education else ""
        
        return f"""
        {resume.content_text}
        Skills: {skills_text}
        Experience: {resume.experience_years} years
        Education: {education_text}
        """.strip()
    
    # ============== JOB MATCHING ==============
    
    async def find_matching_jobs(
        self,
        resume: Resume,
        limit: int = 20,
        min_score: float = 0.3,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        salary_min: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Find jobs matching a resume using semantic similarity.
        
        Returns list of jobs with match scores and skill analysis.
        """
        embedding_text = self._get_resume_embedding_text(resume)
        query_vector = self._generate_embedding(embedding_text)
        
        # Build filters
        filters = {"is_active": True}
        if location:
            filters["location"] = location
        if job_type:
            filters["job_type"] = job_type
        
        results = await self._jobs_vector_repo.search_similar(
            query_vector=query_vector,
            limit=limit * 2,  # Get more to filter
            filters=filters,
            score_threshold=min_score
        )
        
        # Enrich with full job data and skill analysis
        enriched_results = []
        for result in results:
            job_id = result["payload"].get("job_id")
            if job_id:
                job = await self._job_repository.get_by_id(job_id)
                if job:
                    # Filter by salary if specified
                    if salary_min and job.salary_max and job.salary_max < salary_min:
                        continue
                    
                    # Calculate skill match
                    skill_analysis = self._analyze_skills(resume.skills, job.skills_required)
                    
                    # Combined score (semantic + skill match)
                    semantic_score = result["score"]
                    skill_score = skill_analysis["match_percentage"] / 100
                    combined_score = (semantic_score * 0.6) + (skill_score * 0.4)
                    
                    enriched_results.append({
                        "job": job,
                        "match_score": round(combined_score * 100, 1),
                        "semantic_score": round(semantic_score * 100, 1),
                        "skill_score": round(skill_score * 100, 1),
                        "matching_skills": skill_analysis["matching"],
                        "missing_skills": skill_analysis["missing"],
                        "skill_match_percentage": skill_analysis["match_percentage"],
                    })
        
        # Sort by combined score and limit
        enriched_results.sort(key=lambda x: x["match_score"], reverse=True)
        return enriched_results[:limit]
    
    def _analyze_skills(
        self, 
        resume_skills: List[str], 
        job_skills: List[str]
    ) -> Dict[str, Any]:
        """Analyze skill match between resume and job."""
        resume_skills_lower = set(s.lower() for s in resume_skills)
        job_skills_lower = set(s.lower() for s in job_skills)
        
        matching = list(resume_skills_lower & job_skills_lower)
        missing = list(job_skills_lower - resume_skills_lower)
        extra = list(resume_skills_lower - job_skills_lower)
        
        match_percentage = (len(matching) / len(job_skills_lower) * 100) if job_skills_lower else 100
        
        return {
            "matching": [s.title() for s in matching],
            "missing": [s.title() for s in missing],
            "extra": [s.title() for s in extra],
            "match_percentage": round(match_percentage, 1),
        }
    
    # ============== SEMANTIC SEARCH ==============
    
    async def search_jobs_semantic(
        self,
        query: str,
        limit: int = 20,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        company: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Semantic search for jobs using natural language query.
        
        Example queries:
        - "Python machine learning engineer"
        - "Remote AI developer with NLP experience"
        - "Senior data scientist at FAANG"
        """
        query_vector = self._generate_embedding(query)
        
        filters = {"is_active": True}
        if location:
            filters["location"] = location
        if job_type:
            filters["job_type"] = job_type
        
        results = await self._jobs_vector_repo.search_similar(
            query_vector=query_vector,
            limit=limit,
            filters=filters,
            score_threshold=0.2
        )
        
        enriched_results = []
        for result in results:
            job_id = result["payload"].get("job_id")
            if job_id:
                job = await self._job_repository.get_by_id(job_id)
                if job:
                    # Filter by company if specified
                    if company and company.lower() not in job.company.lower():
                        continue
                    
                    enriched_results.append({
                        "job": job,
                        "relevance_score": round(result["score"] * 100, 1),
                    })
        
        return enriched_results
    
    # ============== CANDIDATE MATCHING (FOR RECRUITERS) ==============
    
    async def find_matching_candidates(
        self,
        job: Job,
        limit: int = 20,
        min_score: float = 0.3,
        min_experience: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Find resumes/candidates matching a job (for recruiters).
        
        Returns list of candidate matches with scores.
        """
        embedding_text = self._get_job_embedding_text(job)
        query_vector = self._generate_embedding(embedding_text)
        
        results = await self._resumes_vector_repo.search_similar(
            query_vector=query_vector,
            limit=limit * 2,
            score_threshold=min_score
        )
        
        enriched_results = []
        for result in results:
            resume_id = result["payload"].get("resume_id")
            if resume_id:
                # Filter by experience if specified
                exp_years = result["payload"].get("experience_years", 0)
                if min_experience and exp_years < min_experience:
                    continue
                
                skill_analysis = self._analyze_skills(
                    result["payload"].get("skills", []),
                    job.skills_required
                )
                
                enriched_results.append({
                    "resume_id": resume_id,
                    "user_id": result["payload"].get("user_id"),
                    "match_score": round(result["score"] * 100, 1),
                    "skills": result["payload"].get("skills", []),
                    "experience_years": exp_years,
                    "skill_match_percentage": skill_analysis["match_percentage"],
                    "matching_skills": skill_analysis["matching"],
                    "missing_skills": skill_analysis["missing"],
                })
        
        enriched_results.sort(key=lambda x: x["match_score"], reverse=True)
        return enriched_results[:limit]
    
    # ============== DETAILED MATCH SCORE ==============
    
    async def calculate_match_score(
        self, 
        resume: Resume, 
        job: Job
    ) -> Dict[str, Any]:
        """
        Calculate detailed match score between a resume and job.
        
        Returns comprehensive breakdown of match factors.
        """
        # Generate embeddings
        resume_embedding = self._generate_embedding(self._get_resume_embedding_text(resume))
        job_embedding = self._generate_embedding(self._get_job_embedding_text(job))
        
        # Cosine similarity
        similarity = np.dot(resume_embedding, job_embedding) / (
            np.linalg.norm(resume_embedding) * np.linalg.norm(job_embedding)
        )
        
        # Skill analysis
        skill_analysis = self._analyze_skills(resume.skills, job.skills_required)
        skill_score = skill_analysis["match_percentage"] / 100
        
        # Experience match
        exp_score = self._calculate_experience_score(resume.experience_years, job.experience_level)
        
        # Combined score (weighted)
        combined_score = (
            similarity * 0.50 +      # Semantic similarity
            skill_score * 0.35 +     # Skill match
            exp_score * 0.15         # Experience match
        )
        
        # Determine match level
        if combined_score >= 0.8:
            match_level = "Excellent Match"
        elif combined_score >= 0.6:
            match_level = "Good Match"
        elif combined_score >= 0.4:
            match_level = "Partial Match"
        else:
            match_level = "Low Match"
        
        # Generate recommendations
        recommendations = self._generate_match_recommendations(
            skill_analysis, exp_score, combined_score
        )
        
        return {
            "overall_score": round(combined_score * 100, 1),
            "match_level": match_level,
            "semantic_score": round(similarity * 100, 1),
            "skill_score": round(skill_score * 100, 1),
            "experience_score": round(exp_score * 100, 1),
            "matching_skills": skill_analysis["matching"],
            "missing_skills": skill_analysis["missing"],
            "extra_skills": skill_analysis["extra"],
            "skill_match_percentage": skill_analysis["match_percentage"],
            "recommendations": recommendations,
        }
    
    def _calculate_experience_score(self, years: int, level: str) -> float:
        """Calculate experience match score."""
        level_requirements = {
            "entry": (0, 2),
            "junior": (1, 3),
            "mid": (3, 5),
            "senior": (5, 10),
            "lead": (7, 15),
            "principal": (10, 20),
        }
        
        level_lower = level.lower() if level else "mid"
        min_years, max_years = level_requirements.get(level_lower, (3, 5))
        
        if min_years <= years <= max_years:
            return 1.0
        elif years < min_years:
            return max(0.5, years / min_years)
        else:
            return max(0.7, 1 - (years - max_years) * 0.05)
    
    def _generate_match_recommendations(
        self,
        skill_analysis: Dict,
        exp_score: float,
        overall_score: float
    ) -> List[str]:
        """Generate recommendations based on match analysis."""
        recommendations = []
        
        if skill_analysis["missing"]:
            top_missing = skill_analysis["missing"][:3]
            recommendations.append(f"Consider learning: {', '.join(top_missing)}")
        
        if skill_analysis["match_percentage"] < 50:
            recommendations.append("Focus on acquiring more of the required technical skills")
        
        if exp_score < 0.7:
            recommendations.append("Highlight relevant projects to compensate for experience gap")
        
        if overall_score >= 0.7:
            recommendations.append("Strong match! Tailor your resume to highlight matching skills")
        elif overall_score >= 0.5:
            recommendations.append("Good potential - emphasize transferable skills in your application")
        
        if skill_analysis["extra"]:
            recommendations.append(f"Highlight your additional skills: {', '.join(skill_analysis['extra'][:3])}")
        
        return recommendations[:4]
    
    # ============== STATISTICS ==============
    
    async def get_matching_stats(self) -> Dict[str, Any]:
        """Get statistics about indexed jobs and resumes."""
        jobs_count = await self._jobs_vector_repo.count()
        resumes_count = await self._resumes_vector_repo.count()
        
        return {
            "indexed_jobs": jobs_count,
            "indexed_resumes": resumes_count,
            "embedding_model": settings.EMBEDDING_MODEL,
            "embedding_dimension": settings.EMBEDDING_DIMENSION,
        }
