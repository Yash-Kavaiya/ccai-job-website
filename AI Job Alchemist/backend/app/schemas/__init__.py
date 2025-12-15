"""Pydantic schemas for API request/response validation."""
from .user import UserCreate, UserUpdate, UserResponse, UserProfileUpdate
from .job import JobCreate, JobUpdate, JobResponse, JobSearchQuery, JobMatchResult
from .resume import (
    ResumeCreate,
    ResumeUpdate,
    ResumeResponse,
    ResumeAnalysisResponse,
    ResumeStatsResponse,
    ResumeCompareRequest,
    ResumeCompareResponse,
    ResumeComparisonItem,
    JobMatchRequest,
    JobMatchResponse,
    SkillExtractionResponse,
)
from .interview import (
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
    InterviewFeedback,
    InterviewSubmitResponse,
)
from .matching import (
    IndexJobRequest,
    IndexResumeRequest,
    JobMatchResult as MatchingJobMatchResult,
    SemanticSearchResult,
    CandidateMatchResult,
    DetailedMatchScore,
    MatchingStatsResponse,
)

__all__ = [
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserProfileUpdate",
    # Job
    "JobCreate",
    "JobUpdate",
    "JobResponse",
    "JobSearchQuery",
    "JobMatchResult",
    # Resume
    "ResumeCreate",
    "ResumeUpdate",
    "ResumeResponse",
    "ResumeAnalysisResponse",
    "ResumeStatsResponse",
    "ResumeCompareRequest",
    "ResumeCompareResponse",
    "ResumeComparisonItem",
    "JobMatchRequest",
    "JobMatchResponse",
    "SkillExtractionResponse",
    # Interview
    "InterviewCreate",
    "InterviewResponse",
    "InterviewResponseSubmit",
    "InterviewQuestionResponse",
    "InterviewQuestionDetail",
    "ResponseFeedback",
    "SampleAnswerResponse",
    "InterviewCompleteResponse",
    "InterviewStatsResponse",
    "InterviewListItem",
    "CategoriesResponse",
    "InterviewFeedback",
    "InterviewSubmitResponse",
    # Matching
    "IndexJobRequest",
    "IndexResumeRequest",
    "MatchingJobMatchResult",
    "SemanticSearchResult",
    "CandidateMatchResult",
    "DetailedMatchScore",
    "MatchingStatsResponse",
]
