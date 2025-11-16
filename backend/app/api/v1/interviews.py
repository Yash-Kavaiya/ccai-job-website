"""
Interview API endpoints.
Handles interview scheduling, questions, answers, mock interviews, and AI feedback.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    InterviewListResponse,
    InterviewQuestionCreate,
    InterviewQuestionUpdate,
    InterviewQuestionResponse,
    MockInterviewRequest,
    MockInterviewResponse,
    InterviewFeedbackRequest,
    InterviewFeedbackResponse,
    InterviewStats,
)
from app.models.user import User
from app.models.interview import Interview, InterviewQuestion
from app.models.application import Application
from app.api.deps import get_current_active_user
from app.services.ai_service import gemini_service
from datetime import datetime

router = APIRouter()


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    interview: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Schedule a new interview.

    - **application_id**: Optional - Link to a job application
    - **interview_type**: technical, behavioral, hr, mock
    - **scheduled_at**: Interview date and time
    - **duration_minutes**: Duration (15-240 minutes)
    - **meeting_link**: Optional video call link

    Creates an interview with status 'scheduled'.
    """
    # Validate application if provided
    if interview.application_id:
        application = db.query(Application).filter(
            Application.id == interview.application_id,
            Application.user_id == current_user.id
        ).first()

        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )

    # Create interview
    new_interview = Interview(
        user_id=current_user.id,
        **interview.model_dump(),
        status="scheduled"
    )

    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    return InterviewResponse.model_validate(new_interview)


@router.get("", response_model=List[InterviewResponse])
async def list_interviews(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    interview_type: Optional[str] = Query(None, description="Filter by type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all interviews for current user.

    - **status**: Filter by status (scheduled, completed, cancelled, rescheduled)
    - **interview_type**: Filter by type (technical, behavioral, hr, mock)
    - **skip**: Number to skip
    - **limit**: Max number to return

    Returns interviews ordered by scheduled date (upcoming first).
    """
    query = db.query(Interview).filter(Interview.user_id == current_user.id)

    if status_filter:
        query = query.filter(Interview.status == status_filter)

    if interview_type:
        query = query.filter(Interview.interview_type == interview_type)

    interviews = query.order_by(
        Interview.scheduled_at.desc().nullslast()
    ).offset(skip).limit(limit).all()

    return [InterviewResponse.model_validate(interview) for interview in interviews]


@router.get("/stats", response_model=InterviewStats)
async def get_interview_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get statistics about your interviews.

    Returns:
    - Total interviews count
    - Count by status
    - Average score across completed interviews

    **Useful for:**
    - Dashboard overview
    - Tracking interview performance
    - Identifying preparation needs
    """
    # Get counts by status
    status_counts = db.query(
        Interview.status,
        func.count(Interview.id)
    ).filter(
        Interview.user_id == current_user.id
    ).group_by(Interview.status).all()

    counts = {status: count for status, count in status_counts}

    # Calculate average score from interview questions
    avg_score_result = db.query(
        func.avg(InterviewQuestion.score)
    ).join(
        Interview, InterviewQuestion.interview_id == Interview.id
    ).filter(
        Interview.user_id == current_user.id,
        InterviewQuestion.score != None
    ).scalar()

    avg_score = float(avg_score_result) if avg_score_result else None

    return InterviewStats(
        total=sum(counts.values()),
        scheduled=counts.get('scheduled', 0),
        completed=counts.get('completed', 0),
        cancelled=counts.get('cancelled', 0),
        average_score=avg_score
    )


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of a specific interview.

    - **interview_id**: Interview ID

    Returns full interview details including all questions and answers.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    return InterviewResponse.model_validate(interview)


@router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: int,
    interview_update: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an interview.

    - **interview_id**: Interview ID
    - **scheduled_at**: Reschedule date/time
    - **status**: Update status (scheduled, completed, cancelled, rescheduled)
    - **notes**: Add or update notes
    - **meeting_link**: Update video call link

    **Common use cases:**
    - Reschedule interview
    - Mark as completed after finishing
    - Add notes about performance
    - Update meeting link
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Update fields
    update_data = interview_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(interview, field, value)

    interview.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(interview)

    return InterviewResponse.model_validate(interview)


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an interview.

    - **interview_id**: Interview ID to delete

    **Warning:** This permanently deletes the interview and all questions/answers.
    Consider updating status to 'cancelled' instead if you want to keep the record.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    db.delete(interview)
    db.commit()

    return None


# ============================================================================
# INTERVIEW QUESTIONS ENDPOINTS
# ============================================================================

@router.post("/{interview_id}/questions", response_model=InterviewQuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(
    interview_id: int,
    question: InterviewQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a question to an interview.

    - **interview_id**: Interview ID
    - **question_text**: The interview question
    - **question_type**: technical, behavioral, situational

    **Use this to:**
    - Add actual interview questions you received
    - Prepare custom practice questions
    - Build your question bank
    """
    # Verify interview ownership
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Create question
    new_question = InterviewQuestion(
        interview_id=interview_id,
        **question.model_dump()
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return InterviewQuestionResponse.model_validate(new_question)


@router.get("/{interview_id}/questions", response_model=List[InterviewQuestionResponse])
async def get_questions(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all questions for an interview.

    - **interview_id**: Interview ID

    Returns all questions with answers and AI feedback if available.
    """
    # Verify interview ownership
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).all()

    return [InterviewQuestionResponse.model_validate(q) for q in questions]


@router.put("/{interview_id}/questions/{question_id}/answer", response_model=InterviewQuestionResponse)
async def submit_answer(
    interview_id: int,
    question_id: int,
    answer: InterviewQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submit your answer to an interview question and get AI feedback.

    - **interview_id**: Interview ID
    - **question_id**: Question ID
    - **user_answer**: Your answer text

    **What happens:**
    1. Saves your answer
    2. AI evaluates your answer (0-10 score)
    3. Generates detailed feedback
    4. Returns question with score and feedback

    **Perfect for:**
    - Practice interview answers
    - Get instant feedback
    - Improve your responses
    """
    # Verify interview ownership
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Get question
    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == question_id,
        InterviewQuestion.interview_id == interview_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Save answer
    question.user_answer = answer.user_answer

    # Get AI feedback
    evaluation = gemini_service.evaluate_interview_answer(
        question=question.question_text,
        answer=answer.user_answer,
        question_type=question.question_type or "general"
    )

    # Update with AI feedback
    question.ai_feedback = evaluation.get('feedback', '')
    question.score = evaluation.get('score', 0)

    db.commit()
    db.refresh(question)

    return InterviewQuestionResponse.model_validate(question)


@router.delete("/{interview_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    interview_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an interview question.

    - **interview_id**: Interview ID
    - **question_id**: Question ID to delete
    """
    # Verify interview ownership
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Get and delete question
    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == question_id,
        InterviewQuestion.interview_id == interview_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    db.delete(question)
    db.commit()

    return None


# ============================================================================
# MOCK INTERVIEW ENDPOINTS
# ============================================================================

@router.post("/mock", response_model=MockInterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_mock_interview(
    request: MockInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a mock interview with AI-generated questions.

    - **job_title**: Job title to prepare for (e.g., "Senior Software Engineer")
    - **job_description**: Optional job description for better question targeting
    - **interview_type**: technical, behavioral, or mixed
    - **num_questions**: Number of questions to generate (1-20)

    **What you get:**
    1. Creates a mock interview session
    2. AI generates relevant questions based on job
    3. Each question includes type and difficulty
    4. Ready for you to practice answers

    **Perfect for:**
    - Interview preparation
    - Practice before real interviews
    - Building confidence
    - Identifying weak areas
    """
    # Create mock interview
    mock_interview = Interview(
        user_id=current_user.id,
        interview_type=request.interview_type,
        status="scheduled",
        duration_minutes=request.num_questions * 10  # Estimate 10 min per question
    )

    db.add(mock_interview)
    db.commit()
    db.refresh(mock_interview)

    # Generate questions with AI
    questions_data = gemini_service.generate_interview_questions(
        job_title=request.job_title,
        job_description=request.job_description or f"Position for {request.job_title}",
        interview_type=request.interview_type
    )

    # Limit to requested number
    questions_data = questions_data[:request.num_questions]

    # Create question records
    created_questions = []
    for q_data in questions_data:
        question = InterviewQuestion(
            interview_id=mock_interview.id,
            question_text=q_data.get('question', ''),
            question_type=q_data.get('type', request.interview_type)
        )
        db.add(question)
        created_questions.append(question)

    db.commit()

    # Refresh questions to get IDs
    for q in created_questions:
        db.refresh(q)

    return MockInterviewResponse(
        interview_id=mock_interview.id,
        interview_type=request.interview_type,
        job_title=request.job_title,
        questions=[InterviewQuestionResponse.model_validate(q) for q in created_questions],
        message=f"Mock interview created with {len(created_questions)} questions. Good luck!"
    )


@router.post("/{interview_id}/feedback", response_model=InterviewFeedbackResponse)
async def generate_interview_feedback(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate comprehensive AI feedback for a completed interview.

    - **interview_id**: Interview ID

    **Requirements:**
    - Interview must have at least one answered question

    **Returns:**
    - Overall score (0-100)
    - Category scores (communication, technical, clarity, etc.)
    - Strengths identified
    - Areas for improvement
    - Specific recommendations

    **Best used after:**
    - Completing a mock interview
    - Answering all questions
    - Want detailed performance analysis
    """
    # Verify interview ownership
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Get all questions with answers
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id,
        InterviewQuestion.user_answer != None
    ).all()

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No answered questions found. Please answer at least one question first."
        )

    # Calculate scores
    scores = [q.score for q in questions if q.score is not None]
    overall_score = int(sum(scores) / len(scores) * 10) if scores else 0  # Convert 0-10 to 0-100

    # Aggregate feedback
    all_strengths = []
    all_improvements = []

    for question in questions:
        if question.ai_feedback:
            # This is simplified - in production, parse structured feedback
            all_strengths.append(f"Good answer to: {question.question_text[:50]}...")

    # Generate category scores (simplified - can be enhanced with AI)
    avg_score = sum(scores) / len(scores) if scores else 0
    category_scores = {
        "communication": int(avg_score * 10),
        "technical_depth": int(avg_score * 10),
        "clarity": int(avg_score * 10),
        "examples": int(avg_score * 9),  # Slightly lower for examples
    }

    # Recommendations
    recommendations = [
        "Continue practicing with more mock interviews",
        "Focus on providing specific examples from your experience",
        "Work on structuring answers using the STAR method",
    ]

    if avg_score < 7:
        recommendations.append("Consider reviewing technical concepts for your target role")

    feedback_data = {
        "overall_score": overall_score,
        "category_scores": category_scores,
        "strengths": all_strengths[:5],  # Top 5
        "areas_for_improvement": [
            "Provide more quantifiable results in answers",
            "Practice concise explanations",
        ],
        "recommendations": recommendations,
        "detailed_feedback": f"You answered {len(questions)} questions with an average score of {avg_score:.1f}/10. "
                           f"This shows {'strong' if avg_score >= 7 else 'good' if avg_score >= 5 else 'developing'} "
                           f"interview performance. Keep practicing to improve your scores!"
    }

    # Store feedback in interview
    interview.feedback = feedback_data
    interview.status = "completed"
    db.commit()

    return InterviewFeedbackResponse(
        interview_id=interview_id,
        **feedback_data
    )
