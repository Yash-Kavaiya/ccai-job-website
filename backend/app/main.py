"""
Main FastAPI application.
Entry point for the CCAI Jobs API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database import init_db

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Production-level FastAPI backend for CCAI Jobs Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print("✅ Database initialized successfully")
    print(f"✅ {settings.APP_NAME} v{settings.VERSION} started")
    print(f"✅ Environment: {settings.ENVIRONMENT}")
    print(f"✅ Debug mode: {settings.DEBUG}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("👋 Shutting down CCAI Jobs API")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint to verify API is running."""
    return {
        "message": "Welcome to CCAI Jobs API",
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"},
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Import and include routers
from app.api.v1 import auth, users, resumes, ai_agents

# Authentication & Users (Phase 2 - Complete)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

# Resumes & AI (Phase 3 - Complete)
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["Resumes"])
app.include_router(ai_agents.router, prefix="/api/v1/ai", tags=["AI Agents"])

# Additional routers (will be added in later phases)
# from app.api.v1 import jobs, applications, interviews, social
# app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
# app.include_router(applications.router, prefix="/api/v1/applications", tags=["Applications"])
# app.include_router(interviews.router, prefix="/api/v1/interviews", tags=["Interviews"])
# app.include_router(social.router, prefix="/api/v1/social", tags=["Social"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
