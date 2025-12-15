"""Qdrant Cloud implementation of Vector repository for semantic search."""

from typing import List, Optional, Dict, Any
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue, Distance, VectorParams

from app.repositories.base import VectorRepository
from app.core.dependencies import get_qdrant_client
from app.config.settings import settings


class QdrantVectorRepository(VectorRepository):
    """
    Qdrant Cloud implementation of Vector repository.
    
    Used for semantic job matching and resume similarity search.
    Single Responsibility: Only handles vector operations.
    """
    
    def __init__(self, collection_name: str):
        self._collection_name = collection_name
        self._client: Optional[QdrantClient] = None
    
    @property
    def client(self) -> QdrantClient:
        """Lazy load Qdrant client."""
        if self._client is None:
            self._client = get_qdrant_client()
        return self._client
    
    def _ensure_collection(self):
        """Ensure collection exists."""
        try:
            self.client.get_collection(self._collection_name)
        except Exception:
            self.client.create_collection(
                collection_name=self._collection_name,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIMENSION,
                    distance=Distance.COSINE
                )
            )
    
    async def upsert_vector(
        self, 
        id: str, 
        vector: List[float], 
        payload: Dict[str, Any]
    ) -> str:
        """Insert or update a vector with payload."""
        self._ensure_collection()
        
        point = PointStruct(
            id=id,
            vector=vector,
            payload=payload
        )
        
        self.client.upsert(
            collection_name=self._collection_name,
            points=[point]
        )
        
        return id
    
    async def search_similar(
        self, 
        query_vector: List[float], 
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        score_threshold: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors using cosine similarity.
        
        Returns list of matches with scores and payloads.
        """
        self._ensure_collection()
        
        qdrant_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                if isinstance(value, bool):
                    conditions.append(FieldCondition(key=key, match=MatchValue(value=value)))
                elif isinstance(value, (str, int, float)):
                    conditions.append(FieldCondition(key=key, match=MatchValue(value=value)))
            if conditions:
                qdrant_filter = Filter(must=conditions)
        
        results = self.client.search(
            collection_name=self._collection_name,
            query_vector=query_vector,
            limit=limit,
            query_filter=qdrant_filter,
            score_threshold=score_threshold
        )
        
        return [
            {
                "id": str(result.id),
                "score": result.score,
                "payload": result.payload
            }
            for result in results
        ]
    
    async def delete_vector(self, id: str) -> bool:
        """Delete a vector by ID."""
        try:
            self.client.delete(
                collection_name=self._collection_name,
                points_selector=[id]
            )
            return True
        except Exception:
            return False
    
    async def get_vector(self, id: str) -> Optional[Dict[str, Any]]:
        """Get a vector by ID."""
        try:
            results = self.client.retrieve(
                collection_name=self._collection_name,
                ids=[id],
                with_payload=True,
                with_vectors=True
            )
            
            if results:
                point = results[0]
                return {
                    "id": str(point.id),
                    "vector": point.vector,
                    "payload": point.payload
                }
            return None
        except Exception:
            return None
    
    async def batch_upsert(
        self, 
        points: List[Dict[str, Any]]
    ) -> int:
        """
        Batch insert/update vectors.
        
        Args:
            points: List of dicts with 'id', 'vector', 'payload' keys
        
        Returns:
            Number of points upserted
        """
        self._ensure_collection()
        
        qdrant_points = [
            PointStruct(
                id=p["id"],
                vector=p["vector"],
                payload=p["payload"]
            )
            for p in points
        ]
        
        self.client.upsert(
            collection_name=self._collection_name,
            points=qdrant_points
        )
        
        return len(qdrant_points)
    
    async def count(self) -> int:
        """Get total count of vectors in collection."""
        try:
            info = self.client.get_collection(self._collection_name)
            return info.points_count
        except Exception:
            return 0
    
    async def get_all_ids(self, limit: int = 1000) -> List[str]:
        """Get all vector IDs in collection."""
        try:
            results = self.client.scroll(
                collection_name=self._collection_name,
                limit=limit,
                with_payload=False,
                with_vectors=False
            )
            return [str(point.id) for point in results[0]]
        except Exception:
            return []


def get_jobs_vector_repository() -> QdrantVectorRepository:
    """Factory function for jobs vector repository."""
    return QdrantVectorRepository(settings.QDRANT_COLLECTION_JOBS)


def get_resumes_vector_repository() -> QdrantVectorRepository:
    """Factory function for resumes vector repository."""
    return QdrantVectorRepository(settings.QDRANT_COLLECTION_RESUMES)
