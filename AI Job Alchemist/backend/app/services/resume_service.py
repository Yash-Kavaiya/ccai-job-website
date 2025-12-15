"""Full-featured resume service with parsing, analysis, and matching."""

from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.models.resume import Resume, ResumeAnalysis
from app.repositories.firestore.resume_repository import ResumeRepository
from app.services.storage_service import StorageService
from app.services.matching_service import MatchingService
from app.services.document_parser import DocumentParser, ParsedResume
from app.services.resume_analyzer import ResumeAnalyzer, ATSAnalysis
from app.core.exceptions import NotFoundError, ValidationError


class ResumeService:
    """
    Full-featured resume service with:
    - PDF/DOCX parsing and text extraction
    - AI-powered ATS analysis
    - Skill extraction
    - Job matching via Qdrant
    - Firebase Storage for file management
    """
    
    ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def __init__(
        self,
        repository: Optional[ResumeRepository] = None,
        storage_service: Optional[StorageService] = None,
        matching_service: Optional[MatchingService] = None,
    ):
        self._repository = repository or ResumeRepository()
        self._storage_service = storage_service or StorageService()
        self._matching_service = matching_service or MatchingService()
        self._parser = DocumentParser()
        self._analyzer = ResumeAnalyzer()
    
    async def upload_resume(
        self,
        user_id: str,
        file_content: bytes,
        filename: str,
        name: str,
        is_primary: bool = False,
        auto_analyze: bool = True
    ) -> Resume:
        """
        Upload, parse, and optionally analyze a resume.
        
        Args:
            user_id: User ID
            file_content: Raw file bytes
            filename: Original filename
            name: Display name for the resume
            is_primary: Set as primary resume
            auto_analyze: Automatically run ATS analysis
        
        Returns:
            Created Resume object
        """
        # Validate file
        self._validate_file(filename, len(file_content))
        
        # Parse document
        parsed = self._parser.parse(file_content, filename)
        
        # Upload to Firebase Storage
        file_path = f"resumes/{user_id}/{uuid.uuid4()}_{filename}"
        file_url = await self._storage_service.upload_file_private(
            file_content, file_path, content_type=self._get_content_type(filename)
        )
        
        # Create resume record
        resume = Resume(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            file_url="",  # Will be signed URL
            file_path=file_path,
            content_text=parsed.raw_text,
            skills=parsed.skills,
            experience_years=self._estimate_experience_years(parsed),
            education=[e.get('degree', '') for e in parsed.education_entries],
            is_primary=is_primary,
        )
        
        # If setting as primary, unset others
        if is_primary:
            await self._repository.set_primary(user_id, "")  # Unset all first
        
        # Save to Firestore
        created_resume = await self._repository.create(resume)
        
        # Index in Qdrant for matching
        try:
            embedding_id = await self._matching_service.index_resume(created_resume)
            await self._repository.update(created_resume.id, {"embedding_id": embedding_id})
        except Exception:
            pass  # Non-critical, continue without indexing
        
        # Auto-analyze if requested
        if auto_analyze:
            try:
                await self.analyze_resume(created_resume.id)
            except Exception:
                pass  # Non-critical
        
        return created_resume
    
    def _validate_file(self, filename: str, size: int) -> None:
        """Validate file type and size."""
        ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        
        if ext not in self.ALLOWED_EXTENSIONS:
            raise ValidationError(f"File type not supported. Allowed: {', '.join(self.ALLOWED_EXTENSIONS)}")
        
        if size > self.MAX_FILE_SIZE:
            raise ValidationError(f"File too large. Maximum size: {self.MAX_FILE_SIZE // (1024*1024)}MB")
        
        if size < 100:
            raise ValidationError("File appears to be empty or corrupted")
    
    def _get_content_type(self, filename: str) -> str:
        """Get MIME type for file."""
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        content_types = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
        }
        return content_types.get(ext, 'application/octet-stream')
    
    def _estimate_experience_years(self, parsed: ParsedResume) -> int:
        """Estimate years of experience from parsed resume."""
        import re
        
        experience_text = parsed.sections.get('experience', '')
        
        # Find all years mentioned
        years = re.findall(r'\b(19|20)\d{2}\b', experience_text)
        
        if len(years) >= 2:
            years_int = [int(y) for y in years]
            return max(years_int) - min(years_int)
        
        # Fallback: count experience entries
        return len(parsed.experience_entries) * 2
    
    async def get_resume(self, resume_id: str) -> Resume:
        """Get resume by ID with signed download URL."""
        resume = await self._repository.get_by_id(resume_id)
        if not resume:
            raise NotFoundError("Resume", resume_id)
        
        # Generate signed URL for file access
        try:
            resume.file_url = await self._storage_service.get_signed_url(resume.file_path)
        except Exception:
            resume.file_url = ""
        
        return resume
    
    async def get_user_resumes(self, user_id: str) -> List[Resume]:
        """Get all resumes for a user."""
        resumes = await self._repository.get_by_user_id(user_id)
        
        # Generate signed URLs
        for resume in resumes:
            try:
                resume.file_url = await self._storage_service.get_signed_url(resume.file_path)
            except Exception:
                resume.file_url = ""
        
        return resumes
    
    async def get_primary_resume(self, user_id: str) -> Optional[Resume]:
        """Get user's primary resume."""
        resume = await self._repository.get_primary_resume(user_id)
        
        if resume:
            try:
                resume.file_url = await self._storage_service.get_signed_url(resume.file_path)
            except Exception:
                resume.file_url = ""
        
        return resume
    
    async def set_primary_resume(self, user_id: str, resume_id: str) -> bool:
        """Set a resume as primary."""
        # Verify ownership
        resume = await self._repository.get_by_id(resume_id)
        if not resume or resume.user_id != user_id:
            raise NotFoundError("Resume", resume_id)
        
        return await self._repository.set_primary(user_id, resume_id)
    
    async def update_resume(
        self, 
        resume_id: str, 
        user_id: str,
        name: Optional[str] = None,
        skills: Optional[List[str]] = None
    ) -> Resume:
        """Update resume metadata."""
        resume = await self._repository.get_by_id(resume_id)
        if not resume or resume.user_id != user_id:
            raise NotFoundError("Resume", resume_id)
        
        update_data = {"updated_at": datetime.utcnow()}
        
        if name is not None:
            update_data["name"] = name
        
        if skills is not None:
            update_data["skills"] = skills
            # Re-index in Qdrant
            resume.skills = skills
            try:
                await self._matching_service.index_resume(resume)
            except Exception:
                pass
        
        updated = await self._repository.update(resume_id, update_data)
        if not updated:
            raise NotFoundError("Resume", resume_id)
        
        return updated
    
    async def delete_resume(self, resume_id: str, user_id: str) -> bool:
        """Delete a resume and its file."""
        resume = await self._repository.get_by_id(resume_id)
        if not resume or resume.user_id != user_id:
            raise NotFoundError("Resume", resume_id)
        
        # Delete file from storage
        await self._storage_service.delete_file(resume.file_path)
        
        # Delete from database
        return await self._repository.delete(resume_id)
    
    async def analyze_resume(
        self, 
        resume_id: str, 
        job_keywords: Optional[List[str]] = None,
        job_description: Optional[str] = None
    ) -> ResumeAnalysis:
        """
        Perform comprehensive ATS analysis on a resume.
        
        Args:
            resume_id: Resume ID
            job_keywords: Optional target keywords for the analysis
            job_description: Optional job description for tailored analysis
        
        Returns:
            ResumeAnalysis with scores and suggestions
        """
        resume = await self._repository.get_by_id(resume_id)
        if not resume:
            raise NotFoundError("Resume", resume_id)
        
        # Parse the resume content
        parsed = ParsedResume(
            raw_text=resume.content_text,
            sections={},  # Would need to re-parse for sections
            contact_info={},
            skills=resume.skills,
            experience_entries=[],
            education_entries=[{'degree': e} for e in resume.education],
            certifications=[],
            languages=[],
        )
        
        # If we have the original file, re-parse for full analysis
        try:
            file_content = await self._get_file_content(resume.file_path)
            if file_content:
                parsed = self._parser.parse(file_content, resume.file_path)
        except Exception:
            pass
        
        # Extract keywords from job description if provided
        if job_description and not job_keywords:
            job_keywords = self._extract_keywords_from_description(job_description)
        
        # Run ATS analysis
        ats_analysis = self._analyzer.analyze_ats(parsed, job_keywords)
        
        # Create ResumeAnalysis model
        analysis = ResumeAnalysis(
            ats_score=ats_analysis.overall_score,
            keyword_matches=ats_analysis.keyword_matches,
            missing_keywords=ats_analysis.missing_keywords,
            suggestions=ats_analysis.suggestions,
            strengths=ats_analysis.strengths,
            weaknesses=ats_analysis.weaknesses,
            analyzed_at=datetime.utcnow(),
        )
        
        # Save analysis to resume
        await self._repository.update(resume_id, {
            "analysis": {
                "ats_score": analysis.ats_score,
                "keyword_matches": analysis.keyword_matches,
                "missing_keywords": analysis.missing_keywords,
                "suggestions": analysis.suggestions,
                "strengths": analysis.strengths,
                "weaknesses": analysis.weaknesses,
                "analyzed_at": analysis.analyzed_at,
            },
            "updated_at": datetime.utcnow(),
        })
        
        return analysis
    
    async def _get_file_content(self, file_path: str) -> Optional[bytes]:
        """Download file content from storage."""
        # This would need implementation in StorageService
        # For now, return None
        return None
    
    def _extract_keywords_from_description(self, description: str) -> List[str]:
        """Extract relevant keywords from job description."""
        import re
        
        # Common tech keywords to look for
        tech_keywords = [
            'python', 'javascript', 'java', 'react', 'node', 'aws', 'azure', 'gcp',
            'docker', 'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql',
            'machine learning', 'ai', 'deep learning', 'nlp', 'tensorflow', 'pytorch',
            'agile', 'scrum', 'ci/cd', 'devops', 'microservices', 'api', 'rest',
            'leadership', 'communication', 'teamwork', 'problem-solving'
        ]
        
        description_lower = description.lower()
        found = []
        
        for keyword in tech_keywords:
            if keyword in description_lower:
                found.append(keyword)
        
        return found
    
    async def analyze_for_job(
        self,
        resume_id: str,
        job_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Analyze how well a resume matches a specific job.
        
        Returns detailed match analysis with recommendations.
        """
        from app.services.job_service import JobService
        
        resume = await self._repository.get_by_id(resume_id)
        if not resume or resume.user_id != user_id:
            raise NotFoundError("Resume", resume_id)
        
        # Get job details
        job_service = JobService()
        job = await job_service.get_job(job_id)
        
        # Parse resume for full analysis
        parsed = ParsedResume(
            raw_text=resume.content_text,
            sections={},
            contact_info={},
            skills=resume.skills,
            experience_entries=[],
            education_entries=[],
            certifications=[],
            languages=[],
        )
        
        # Run job match analysis
        match_analysis = self._analyzer.analyze_job_match(
            parsed_resume=parsed,
            job_title=job.title,
            job_description=job.description,
            required_skills=job.skills_required
        )
        
        return {
            "resume_id": resume_id,
            "job_id": job_id,
            "match_score": match_analysis.match_score,
            "matching_skills": match_analysis.matching_skills,
            "missing_skills": match_analysis.missing_skills,
            "experience_match": match_analysis.experience_match,
            "recommendations": match_analysis.recommendations,
        }
    
    async def get_resume_stats(self, user_id: str) -> Dict[str, Any]:
        """Get resume statistics for a user."""
        resumes = await self._repository.get_by_user_id(user_id)
        
        if not resumes:
            return {
                "total_resumes": 0,
                "average_ats_score": 0,
                "best_ats_score": 0,
                "total_skills": 0,
                "has_primary": False,
            }
        
        ats_scores = [r.analysis.ats_score for r in resumes if r.analysis]
        all_skills = set()
        for r in resumes:
            all_skills.update(r.skills)
        
        return {
            "total_resumes": len(resumes),
            "average_ats_score": round(sum(ats_scores) / len(ats_scores), 1) if ats_scores else 0,
            "best_ats_score": max(ats_scores) if ats_scores else 0,
            "total_skills": len(all_skills),
            "has_primary": any(r.is_primary for r in resumes),
            "skills_list": list(all_skills)[:20],
        }
    
    async def compare_resumes(
        self, 
        resume_ids: List[str], 
        user_id: str
    ) -> Dict[str, Any]:
        """Compare multiple resumes side by side."""
        comparisons = []
        
        for resume_id in resume_ids[:5]:  # Limit to 5
            resume = await self._repository.get_by_id(resume_id)
            if resume and resume.user_id == user_id:
                comparisons.append({
                    "id": resume.id,
                    "name": resume.name,
                    "ats_score": resume.analysis.ats_score if resume.analysis else 0,
                    "skills_count": len(resume.skills),
                    "skills": resume.skills[:10],
                    "experience_years": resume.experience_years,
                    "is_primary": resume.is_primary,
                })
        
        # Find best resume
        best = max(comparisons, key=lambda x: x['ats_score']) if comparisons else None
        
        return {
            "resumes": comparisons,
            "best_resume_id": best['id'] if best else None,
            "recommendation": f"'{best['name']}' has the highest ATS score" if best else None,
        }
    
    async def extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from arbitrary text (e.g., job description)."""
        # Create a temporary parsed resume just for skill extraction
        parsed = self._parser.parse(text.encode(), "temp.txt")
        return parsed.skills
