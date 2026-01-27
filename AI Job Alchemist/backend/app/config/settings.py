"""Application settings using Pydantic Settings."""

from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )
    
    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = "./firebase-service-account.json"
    
    # Qdrant Cloud
    QDRANT_URL: str = "https://142fb9e2-82a7-44e0-b732-cee47eed7c4e.us-east4-0.gcp.cloud.qdrant.io:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_JOBS: str = "jobs"
    QDRANT_COLLECTION_RESUMES: str = "resumes"
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    
    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
