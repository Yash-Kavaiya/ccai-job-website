"""Dependency injection container and service initialization."""

from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore, storage
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

from app.config.settings import settings


# Global service instances (Singleton pattern)
_firebase_app: Optional[firebase_admin.App] = None
_firestore_client = None
_storage_bucket = None
_qdrant_client: Optional[QdrantClient] = None
_embedding_model: Optional[SentenceTransformer] = None


async def init_services():
    """Initialize all services on application startup."""
    global _firebase_app, _firestore_client, _storage_bucket, _qdrant_client, _embedding_model
    
    # Initialize Firebase
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        _firebase_app = firebase_admin.initialize_app(cred, {
            "storageBucket": settings.FIREBASE_STORAGE_BUCKET
        })
    
    _firestore_client = firestore.client()
    _storage_bucket = storage.bucket()
    
    # Initialize Qdrant Cloud
    _qdrant_client = QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY,
    )
    
    # Initialize embedding model
    _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    
    # Ensure Qdrant collections exist
    await _ensure_qdrant_collections()
    
    print(f"✅ Connected to Qdrant Cloud: {settings.QDRANT_URL}")
    print(f"✅ Collections: {_qdrant_client.get_collections()}")


async def _ensure_qdrant_collections():
    """Create Qdrant collections if they don't exist."""
    from qdrant_client.models import Distance, VectorParams
    
    collections = [settings.QDRANT_COLLECTION_JOBS, settings.QDRANT_COLLECTION_RESUMES]
    
    for collection_name in collections:
        try:
            _qdrant_client.get_collection(collection_name)
            print(f"✅ Collection '{collection_name}' exists")
        except Exception:
            _qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIMENSION,
                    distance=Distance.COSINE
                )
            )
            print(f"✅ Created collection '{collection_name}'")


async def shutdown_services():
    """Cleanup services on application shutdown."""
    global _qdrant_client
    if _qdrant_client:
        _qdrant_client.close()


def get_firestore_client():
    """Get Firestore client instance."""
    return _firestore_client


def get_storage_bucket():
    """Get Firebase Storage bucket instance."""
    return _storage_bucket


def get_qdrant_client() -> QdrantClient:
    """Get Qdrant client instance."""
    return _qdrant_client


def get_embedding_model() -> SentenceTransformer:
    """Get embedding model instance."""
    return _embedding_model
