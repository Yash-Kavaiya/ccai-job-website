"""
AI Agents API endpoints.
Handles AI chatbot, project generation, interview questions, and job matching.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ProjectIdeaRequest,
    ProjectIdeasResponse,
    InterviewQuestionGenRequest,
    InterviewQuestionsResponse,
    InterviewAnswerRequest,
    InterviewAnswerEvaluation,
    JobMatchRequest,
    JobMatchResponse,
)
from app.models.user import User
from app.models.ai_agent import AIChatHistory
from app.models.resume import Resume
from app.models.job import Job
from app.api.deps import get_current_active_user
from app.services.ai_service import gemini_service
import uuid

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Chat with AI career assistant.

    - **message**: Your message to the AI assistant
    - **session_id**: Optional session ID to maintain conversation context

    The AI assistant can help with:
    - Resume writing and improvement
    - Job search strategies
    - Interview preparation
    - Career advice
    - Skill development recommendations
    """
    # Generate session ID if not provided
    session_id = request.session_id or str(uuid.uuid4())

    # Get conversation history for this session
    history = []
    if request.session_id:
        chat_records = db.query(AIChatHistory).filter(
            AIChatHistory.user_id == current_user.id,
            AIChatHistory.session_id == session_id
        ).order_by(AIChatHistory.created_at.asc()).limit(10).all()

        history = [
            {"role": record.role, "content": record.content}
            for record in chat_records
        ]

    # Get AI response
    ai_response = gemini_service.chat(request.message, history)

    # Save user message
    user_message = AIChatHistory(
        user_id=current_user.id,
        session_id=session_id,
        role="user",
        content=request.message,
        model="gemini-1.5-flash"
    )
    db.add(user_message)

    # Save assistant response
    assistant_message = AIChatHistory(
        user_id=current_user.id,
        session_id=session_id,
        role="assistant",
        content=ai_response,
        model="gemini-1.5-flash"
    )
    db.add(assistant_message)

    db.commit()

    return ChatResponse(
        message=ai_response,
        session_id=session_id,
        model="gemini-1.5-flash"
    )


@router.get("/chat/history", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    session_id: str = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get chat history for current user.

    - **session_id**: Optional session ID to filter by
    - **limit**: Maximum number of messages to return (default: 50)

    Returns chat history ordered by most recent first.
    """
    query = db.query(AIChatHistory).filter(AIChatHistory.user_id == current_user.id)

    if session_id:
        query = query.filter(AIChatHistory.session_id == session_id)

    chat_history = query.order_by(AIChatHistory.created_at.desc()).limit(limit).all()

    return [ChatHistoryResponse.model_validate(msg) for msg in chat_history]


@router.post("/generate-projects", response_model=ProjectIdeasResponse)
async def generate_project_ideas(
    request: ProjectIdeaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate project ideas based on user's skills and experience.

    - **skills**: List of your skills (e.g., ["Python", "React", "Machine Learning"])
    - **experience_level**: Your experience level (beginner, intermediate, advanced)
    - **interests**: Optional list of interests or domains

    Returns 5 project ideas tailored to your skill level with:
    - Project description
    - Technologies to use
    - Difficulty level
    - Estimated time
    - Learning outcomes
    - Portfolio impact
    """
    projects = gemini_service.generate_project_ideas(
        user_skills=request.skills,
        experience_level=request.experience_level,
        interests=request.interests
    )

    return ProjectIdeasResponse(
        projects=projects,
        generated_for={
            "skills": request.skills,
            "experience_level": request.experience_level,
            "interests": request.interests
        }
    )


@router.post("/interview/generate-questions", response_model=InterviewQuestionsResponse)
async def generate_interview_questions(
    request: InterviewQuestionGenRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate interview questions for a specific job.

    - **job_title**: The job title/position
    - **job_description**: Full job description
    - **interview_type**: Type of interview (technical, behavioral, situational)

    Returns 10 relevant interview questions with:
    - Question text
    - Question type
    - Difficulty level
    - Key points to cover in answer
    """
    questions = gemini_service.generate_interview_questions(
        job_title=request.job_title,
        job_description=request.job_description,
        interview_type=request.interview_type
    )

    return InterviewQuestionsResponse(
        questions=questions,
        job_title=request.job_title,
        interview_type=request.interview_type
    )


@router.post("/interview/evaluate-answer", response_model=InterviewAnswerEvaluation)
async def evaluate_interview_answer(
    request: InterviewAnswerRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Evaluate an interview answer and get feedback.

    - **question**: The interview question
    - **answer**: Your answer to the question
    - **question_type**: Type of question (technical, behavioral, situational)

    Returns:
    - Score (0-10)
    - Strengths of your answer
    - Areas for improvement
    - Detailed feedback
    - Suggestions for improvement
    """
    evaluation = gemini_service.evaluate_interview_answer(
        question=request.question,
        answer=request.answer,
        question_type=request.question_type
    )

    return InterviewAnswerEvaluation(**evaluation)


@router.post("/job-match", response_model=JobMatchResponse)
async def calculate_job_match(
    request: JobMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Calculate how well your resume matches a job posting.

    - **job_id**: ID of the job to match against
    - **resume_id**: Optional resume ID (uses primary resume if not specified)

    Returns:
    - Match score (0-100)
    - Category breakdown (skills, experience, education, fit)
    - Matching and missing skills
    - Strengths and concerns
    - Recommendation (highly_recommended, recommended, maybe, not_recommended)
    - Reasoning for the recommendation
    """
    # Get job
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Get resume
    if request.resume_id:
        resume = db.query(Resume).filter(
            Resume.id == request.resume_id,
            Resume.user_id == current_user.id
        ).first()
    else:
        # Use primary resume
        resume = db.query(Resume).filter(
            Resume.user_id == current_user.id,
            Resume.is_primary == True
        ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found. Please upload a resume first."
        )

    # Ensure resume has been analyzed
    if not resume.parsed_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume must be analyzed first. Please analyze your resume before matching."
        )

    # Calculate match
    match_analysis = gemini_service.calculate_job_match_score(
        resume_data=resume.parsed_data,
        job_description=job.description or "",
        job_requirements=job.requirements or ""
    )

    return JobMatchResponse(
        job_id=job.id,
        resume_id=resume.id,
        **match_analysis
    )
