"""Full-featured Mock Interview API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewResponseSubmit,
    InterviewQuestionResponse,
    InterviewQuestionDetail,
    ResponseFeedback,
    SampleAnswerResponse,
    InterviewCompleteResponse,
    InterviewStatsResponse,
    InterviewListItem,
    CategoriesResponse,
)
from app.services.interview_service import InterviewService
from app.core.exceptions import NotFoundError, ValidationError
from .deps import get_current_user, get_interview_service

router = APIRouter()


# ============== CREATE ==============

@router.post("/", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    data: InterviewCreate,
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """
    Create a new mock interview session.
    
    - Generates AI-powered questions based on type and preferences
    - Supports behavioral, technical, and situational interviews
    - Can be customized for specific jobs and skills
    """
    try:
        user_id = current_user.get("uid")
        
        interview = await service.create_interview(
            user_id=user_id,
            interview_type=data.interview_type,
            job_id=data.job_id,
            job_title=data.job_title,
            required_skills=data.required_skills,
            num_questions=data.num_questions,
            difficulty=data.difficulty,
            categories=data.categories,
        )
        
        return _to_response(interview)
    
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.message))


# ============== READ ==============

@router.get("/", response_model=List[InterviewListItem])
async def list_my_interviews(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    interview_type: Optional[str] = Query(None, description="Filter by type"),
    limit: int = Query(20, le=50),
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """List current user's interviews with optional filters."""
    user_id = current_user.get("uid")
    
    interviews = await service.get_user_interviews(
        user_id=user_id,
        status=status_filter,
        interview_type=interview_type,
        limit=limit
    )
    
    return [
        InterviewListItem(
            id=i.id,
            interview_type=i.interview_type.value,
            status=i.status.value,
            overall_score=i.overall_score,
            questions_count=len(i.questions),
            duration_minutes=i.duration_minutes,
            created_at=i.created_at,
            completed_at=i.completed_at,
        )
        for i in interviews
    ]


@router.get("/stats", response_model=InterviewStatsResponse)
async def get_interview_stats(
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """Get comprehensive interview statistics for current user."""
    user_id = current_user.get("uid")
    stats = await service.get_interview_stats(user_id)
    return InterviewStatsResponse(**stats)


@router.get("/categories/{interview_type}", response_model=CategoriesResponse)
async def get_question_categories(
    interview_type: str,
    service: InterviewService = Depends(get_interview_service)
):
    """Get available question categories for an interview type."""
    categories = await service.get_question_categories(interview_type)
    return CategoriesResponse(interview_type=interview_type, categories=categories)


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """Get a specific interview by ID."""
    try:
        interview = await service.get_interview(interview_id)
        
        if interview.user_id != current_user.get("uid"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
        return _to_response(interview)
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")


@router.get("/{interview_id}/questions/{question_index}", response_model=InterviewQuestionDetail)
async def get_question(
    interview_id: str,
    question_index: int,
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """
    Get a specific question with tips.
    
    - question_index is 0-based
    - Returns tips but not sample answer (available after answering)
    """
    try:
        user_id = current_user.get("uid")
        result = await service.get_question(interview_id, question_index, user_id)
        return InterviewQuestionDetail(**result)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.message))
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")


# ============== INTERVIEW FLOW ==============

@router.post("/{interview_id}/start", response_model=InterviewResponse)
async def start_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """
    Start an interview session.
    
    - Changes status from 'scheduled' to 'in_progress'
    - Records start time for duration tracking
    """
    try:
        user_id = current_user.get("uid")
        interview = await service.start_interview(interview_id, user_id)
        return _to_response(interview)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.message))
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")


@router.post("/{interview_id}/respond", response_model=ResponseFeedback)
async def submit_response(
    interview_id: str,
    response_data: InterviewResponseSubmit,
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """
    Submit a response to an interview question.
    
    - Evaluates response using AI (STAR method, relevance, depth)
    - Returns immediate feedback with scores and suggestions
    - Tracks progress toward completion
    """
    try:
        user_id = current_user.get("uid")
        
        result = await service.submit_response(
            interview_id=interview_id,
            question_id=response_data.question_id,
            response_text=response_data.response_text,
            user_id=user_id,
            audio_url=response_data.audio_url,
        )
        
        return ResponseFeedback(**result)
    
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.message))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e.message))


@router.get("/{interview_id}/questions/{question_id}/sample-answer", response_model=SampleAnswerResponse)
async def get_sample_answer(
    interview_id: str,
    question_id: str,
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """
    Get sample answer for a question.
    
    - Only available after submitting your response
    - Includes expected topics for comparison
    """
    try:
        user_id = current_user.get("uid")
        result = await service.get_sample_answer(interview_id, question_id, user_id)
        return SampleAnswerResponse(**result)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.message))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e.message))


@router.post("/{interview_id}/complete", response_model=InterviewCompleteResponse)
async def complete_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """
    Complete an interview and get comprehensive results.
    
    - Calculates overall score and performance level
    - Provides detailed feedback for each question
    - Generates personalized recommendations
    """
    try:
        user_id = current_user.get("uid")
        result = await service.complete_interview(interview_id, user_id)
        return InterviewCompleteResponse(**result)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.message))
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")


# ============== DELETE ==============

@router.delete("/{interview_id}")
async def delete_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_user),
    service: InterviewService = Depends(get_interview_service)
):
    """Delete an interview."""
    try:
        user_id = current_user.get("uid")
        await service.delete_interview(interview_id, user_id)
        return {"message": "Interview deleted", "interview_id": interview_id}
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.message))
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")


# ============== HELPER FUNCTIONS ==============

def _to_response(interview) -> InterviewResponse:
    """Convert Interview model to InterviewResponse schema."""
    return InterviewResponse(
        id=interview.id,
        user_id=interview.user_id,
        job_id=interview.job_id,
        interview_type=interview.interview_type.value,
        status=interview.status.value,
        questions=[
            InterviewQuestionResponse(
                id=q.id,
                question=q.question,
                category=q.category,
                difficulty=q.difficulty,
            )
            for q in interview.questions
        ],
        overall_score=interview.overall_score,
        overall_feedback=interview.overall_feedback,
        duration_minutes=interview.duration_minutes,
        started_at=interview.started_at,
        completed_at=interview.completed_at,
        created_at=interview.created_at,
    )
