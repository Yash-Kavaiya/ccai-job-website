"""API v1 router aggregating all endpoints."""

from fastapi import APIRouter

from .users import router as users_router
from .jobs import router as jobs_router
from .resumes import router as resumes_router
from .matching import router as matching_router
from .interviews import router as interviews_router

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(resumes_router, prefix="/resumes", tags=["Resumes"])
api_router.include_router(matching_router, prefix="/matching", tags=["Job Matching"])
api_router.include_router(interviews_router, prefix="/interviews", tags=["Mock Interviews"])
