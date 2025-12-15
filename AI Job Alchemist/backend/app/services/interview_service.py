"""Full-featured interview service with AI-powered evaluation."""

from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.models.interview import (
    Interview,
    InterviewQuestion,
    InterviewResponse,
    InterviewType,
    InterviewStatus,
)
from app.repositories.firestore.interview_repository import InterviewRepository
from app.services.question_generator import QuestionGenerator, GeneratedQuestion
from app.services.interview_evaluator import InterviewEvaluator, ResponseEvaluation
from app.core.exceptions import NotFoundError, ValidationError


class InterviewService:
    """
    Full-featured interview service with:
    - AI-powered question generation
    - Response evaluation with STAR method analysis
    - Comprehensive feedback and scoring
    - Interview history and statistics
    """
    
    MAX_QUESTIONS = 15
    MIN_QUESTIONS = 3
    
    def __init__(self, repository: Optional[InterviewRepository] = None):
        self._repository = repository or InterviewRepository()
        self._question_generator = QuestionGenerator()
        self._evaluator = InterviewEvaluator()
    
    async def create_interview(
        self,
        user_id: str,
        interview_type: str = "behavioral",
        job_id: Optional[str] = None,
        job_title: Optional[str] = None,
        required_skills: Optional[List[str]] = None,
        num_questions: int = 5,
        difficulty: Optional[str] = None,
        categories: Optional[List[str]] = None,
    ) -> Interview:
        """
        Create a new mock interview session with generated questions.
        
        Args:
            user_id: User ID
            interview_type: behavioral, technical, or situational
            job_id: Optional job ID for job-specific questions
            job_title: Job title for customization
            required_skills: Skills to focus questions on
            num_questions: Number of questions (3-15)
            difficulty: easy, medium, hard, or None for mixed
            categories: Specific question categories
        
        Returns:
            Created Interview object
        """
        # Validate inputs
        if num_questions < self.MIN_QUESTIONS or num_questions > self.MAX_QUESTIONS:
            raise ValidationError(f"Number of questions must be between {self.MIN_QUESTIONS} and {self.MAX_QUESTIONS}")
        
        if interview_type not in ["behavioral", "technical", "situational"]:
            interview_type = "behavioral"
        
        # Generate questions
        generated = self._question_generator.generate_questions(
            interview_type=interview_type,
            num_questions=num_questions,
            difficulty=difficulty,
            categories=categories,
            job_title=job_title,
            required_skills=required_skills,
        )
        
        # Convert to InterviewQuestion models
        questions = [
            InterviewQuestion(
                id=q.id,
                question=q.question,
                category=q.category,
                difficulty=q.difficulty,
                expected_topics=q.expected_topics,
                sample_answer=q.sample_answer,
            )
            for q in generated
        ]
        
        # Create interview
        interview = Interview(
            id=str(uuid.uuid4()),
            user_id=user_id,
            job_id=job_id,
            interview_type=InterviewType(interview_type),
            status=InterviewStatus.SCHEDULED,
            questions=questions,
        )
        
        return await self._repository.create(interview)
    
    async def get_interview(self, interview_id: str) -> Interview:
        """Get interview by ID."""
        interview = await self._repository.get_by_id(interview_id)
        if not interview:
            raise NotFoundError("Interview", interview_id)
        return interview
    
    async def start_interview(self, interview_id: str, user_id: str) -> Interview:
        """Start an interview session."""
        interview = await self.get_interview(interview_id)
        
        if interview.user_id != user_id:
            raise ValidationError("Not authorized to access this interview")
        
        if interview.status != InterviewStatus.SCHEDULED:
            raise ValidationError(f"Interview cannot be started. Current status: {interview.status.value}")
        
        updated = await self._repository.update(
            interview_id,
            {
                "status": InterviewStatus.IN_PROGRESS.value,
                "started_at": datetime.utcnow(),
            }
        )
        
        if not updated:
            raise NotFoundError("Interview", interview_id)
        
        return updated
    
    async def get_question(
        self,
        interview_id: str,
        question_index: int,
        user_id: str
    ) -> Dict[str, Any]:
        """Get a specific question with tips (without sample answer)."""
        interview = await self.get_interview(interview_id)
        
        if interview.user_id != user_id:
            raise ValidationError("Not authorized")
        
        if question_index < 0 or question_index >= len(interview.questions):
            raise ValidationError("Invalid question index")
        
        question = interview.questions[question_index]
        
        # Get tips from generator
        generated = self._question_generator.generate_questions(
            interview_type=interview.interview_type.value,
            num_questions=1,
            categories=[question.category]
        )
        
        tips = generated[0].tips if generated else []
        
        return {
            "question_number": question_index + 1,
            "total_questions": len(interview.questions),
            "question_id": question.id,
            "question": question.question,
            "category": question.category,
            "difficulty": question.difficulty,
            "tips": tips,
            "time_suggestion": self._get_time_suggestion(question.difficulty),
        }
    
    def _get_time_suggestion(self, difficulty: str) -> str:
        """Get suggested response time based on difficulty."""
        suggestions = {
            "easy": "1-2 minutes",
            "medium": "2-3 minutes",
            "hard": "3-5 minutes",
        }
        return suggestions.get(difficulty, "2-3 minutes")
    
    async def submit_response(
        self,
        interview_id: str,
        question_id: str,
        response_text: str,
        user_id: str,
        audio_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Submit and evaluate a response to an interview question.
        
        Returns immediate feedback on the response.
        """
        interview = await self.get_interview(interview_id)
        
        if interview.user_id != user_id:
            raise ValidationError("Not authorized")
        
        if interview.status != InterviewStatus.IN_PROGRESS:
            raise ValidationError("Interview is not in progress")
        
        # Find the question
        question = next((q for q in interview.questions if q.id == question_id), None)
        if not question:
            raise NotFoundError("Question", question_id)
        
        # Check if already answered
        existing = next((r for r in interview.responses if r.question_id == question_id), None)
        if existing:
            raise ValidationError("Question already answered")
        
        # Evaluate the response
        evaluation = self._evaluator.evaluate_response(
            question=question.question,
            response=response_text,
            category=question.category,
            difficulty=question.difficulty,
        )
        
        # Create response object
        response = InterviewResponse(
            question_id=question_id,
            response_text=response_text,
            audio_url=audio_url,
            score=evaluation.score,
            feedback=evaluation.feedback,
            strengths=evaluation.strengths,
            improvements=evaluation.improvements,
            responded_at=datetime.utcnow(),
        )
        
        # Add to interview responses
        interview.responses.append(response)
        
        # Update in database
        await self._repository.update(
            interview_id,
            {
                "responses": [
                    {
                        "question_id": r.question_id,
                        "response_text": r.response_text,
                        "audio_url": r.audio_url,
                        "score": r.score,
                        "feedback": r.feedback,
                        "strengths": r.strengths,
                        "improvements": r.improvements,
                        "responded_at": r.responded_at,
                    }
                    for r in interview.responses
                ]
            }
        )
        
        # Check if this was the last question
        is_complete = len(interview.responses) >= len(interview.questions)
        
        return {
            "question_id": question_id,
            "score": evaluation.score,
            "feedback": evaluation.feedback,
            "strengths": evaluation.strengths,
            "improvements": evaluation.improvements,
            "key_points_covered": evaluation.key_points_covered,
            "missing_points": evaluation.missing_points,
            "scores": {
                "communication": evaluation.communication_score,
                "relevance": evaluation.relevance_score,
                "depth": evaluation.depth_score,
            },
            "questions_remaining": len(interview.questions) - len(interview.responses),
            "is_complete": is_complete,
        }
    
    async def get_sample_answer(
        self,
        interview_id: str,
        question_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Get sample answer for a question (only after responding)."""
        interview = await self.get_interview(interview_id)
        
        if interview.user_id != user_id:
            raise ValidationError("Not authorized")
        
        # Check if user has answered this question
        answered = any(r.question_id == question_id for r in interview.responses)
        if not answered:
            raise ValidationError("You must answer the question before viewing the sample answer")
        
        question = next((q for q in interview.questions if q.id == question_id), None)
        if not question:
            raise NotFoundError("Question", question_id)
        
        return {
            "question_id": question_id,
            "question": question.question,
            "sample_answer": question.sample_answer,
            "expected_topics": question.expected_topics,
        }
    
    async def complete_interview(self, interview_id: str, user_id: str) -> Dict[str, Any]:
        """
        Complete an interview and get comprehensive results.
        """
        interview = await self.get_interview(interview_id)
        
        if interview.user_id != user_id:
            raise ValidationError("Not authorized")
        
        if interview.status == InterviewStatus.COMPLETED:
            raise ValidationError("Interview already completed")
        
        if not interview.responses:
            raise ValidationError("No responses submitted. Answer at least one question.")
        
        # Convert responses to evaluation format
        evaluations = [
            ResponseEvaluation(
                score=r.score,
                feedback=r.feedback,
                strengths=r.strengths,
                improvements=r.improvements,
                communication_score=r.score * 0.9,  # Approximate
                relevance_score=r.score * 0.95,
                depth_score=r.score * 0.85,
            )
            for r in interview.responses
        ]
        
        # Get overall evaluation
        overall = self._evaluator.evaluate_overall(
            responses=evaluations,
            interview_type=interview.interview_type.value
        )
        
        # Calculate duration
        duration = 0
        if interview.started_at:
            duration = int((datetime.utcnow() - interview.started_at).total_seconds() / 60)
        
        # Update interview
        await self._repository.update(
            interview_id,
            {
                "status": InterviewStatus.COMPLETED.value,
                "completed_at": datetime.utcnow(),
                "overall_score": overall.overall_score,
                "overall_feedback": overall.overall_feedback,
                "duration_minutes": duration,
            }
        )
        
        # Build detailed results
        question_results = []
        for q in interview.questions:
            response = next((r for r in interview.responses if r.question_id == q.id), None)
            question_results.append({
                "question_id": q.id,
                "question": q.question,
                "category": q.category,
                "difficulty": q.difficulty,
                "answered": response is not None,
                "score": response.score if response else 0,
                "feedback": response.feedback if response else "Not answered",
                "strengths": response.strengths if response else [],
                "improvements": response.improvements if response else [],
            })
        
        return {
            "interview_id": interview_id,
            "interview_type": interview.interview_type.value,
            "overall_score": overall.overall_score,
            "overall_feedback": overall.overall_feedback,
            "performance_level": overall.performance_level,
            "duration_minutes": duration,
            "questions_answered": len(interview.responses),
            "total_questions": len(interview.questions),
            "category_scores": overall.category_scores,
            "top_strengths": overall.top_strengths,
            "areas_to_improve": overall.areas_to_improve,
            "recommendations": overall.recommendations,
            "question_results": question_results,
        }
    
    async def get_user_interviews(
        self,
        user_id: str,
        status: Optional[str] = None,
        interview_type: Optional[str] = None,
        limit: int = 20
    ) -> List[Interview]:
        """Get all interviews for a user with optional filters."""
        interviews = await self._repository.get_by_user_id(user_id, limit)
        
        if status:
            interviews = [i for i in interviews if i.status.value == status]
        
        if interview_type:
            interviews = [i for i in interviews if i.interview_type.value == interview_type]
        
        return interviews
    
    async def get_interview_stats(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive interview statistics for a user."""
        interviews = await self._repository.get_completed_interviews(user_id)
        
        if not interviews:
            return {
                "total_interviews": 0,
                "completed_interviews": 0,
                "average_score": 0,
                "best_score": 0,
                "total_questions_answered": 0,
                "total_practice_time": 0,
                "performance_trend": "No data",
                "strongest_category": None,
                "weakest_category": None,
                "by_type": {},
                "recent_scores": [],
            }
        
        scores = [i.overall_score for i in interviews]
        total_questions = sum(len(i.responses) for i in interviews)
        total_time = sum(i.duration_minutes for i in interviews)
        
        # Calculate by type
        by_type = {}
        for i in interviews:
            t = i.interview_type.value
            if t not in by_type:
                by_type[t] = {"count": 0, "total_score": 0}
            by_type[t]["count"] += 1
            by_type[t]["total_score"] += i.overall_score
        
        for t in by_type:
            by_type[t]["average_score"] = round(by_type[t]["total_score"] / by_type[t]["count"], 1)
        
        # Performance trend (compare recent vs older)
        if len(scores) >= 4:
            recent_avg = sum(scores[:len(scores)//2]) / (len(scores)//2)
            older_avg = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
            if recent_avg > older_avg + 5:
                trend = "Improving"
            elif recent_avg < older_avg - 5:
                trend = "Declining"
            else:
                trend = "Stable"
        else:
            trend = "Not enough data"
        
        # Recent scores for chart
        recent_scores = [
            {"date": i.completed_at.isoformat() if i.completed_at else "", "score": i.overall_score}
            for i in interviews[:10]
        ]
        
        return {
            "total_interviews": len(interviews),
            "completed_interviews": len([i for i in interviews if i.status == InterviewStatus.COMPLETED]),
            "average_score": round(sum(scores) / len(scores), 1),
            "best_score": max(scores),
            "total_questions_answered": total_questions,
            "total_practice_time": total_time,
            "performance_trend": trend,
            "by_type": by_type,
            "recent_scores": recent_scores,
        }
    
    async def delete_interview(self, interview_id: str, user_id: str) -> bool:
        """Delete an interview."""
        interview = await self.get_interview(interview_id)
        
        if interview.user_id != user_id:
            raise ValidationError("Not authorized")
        
        return await self._repository.delete(interview_id)
    
    async def get_question_categories(self, interview_type: str) -> List[str]:
        """Get available question categories for an interview type."""
        categories = {
            "behavioral": ["teamwork", "leadership", "problem_solving", "achievement", "failure"],
            "technical": ["system_design", "coding", "api_design"],
            "situational": ["pressure", "conflict"],
        }
        return categories.get(interview_type, categories["behavioral"])
