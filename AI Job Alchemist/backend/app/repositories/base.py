"""Abstract base repository implementing Repository pattern (SOLID - DIP, OCP)."""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository defining the interface for data access.
    
    Follows:
    - Interface Segregation Principle: Small, focused interface
    - Dependency Inversion Principle: High-level modules depend on abstractions
    - Open/Closed Principle: Open for extension, closed for modification
    """
    
    @abstractmethod
    async def create(self, entity: T) -> T:
        """Create a new entity."""
        pass
    
    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[T]:
        """Get entity by ID."""
        pass
    
    @abstractmethod
    async def get_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        """Get all entities with pagination."""
        pass
    
    @abstractmethod
    async def update(self, id: str, data: Dict[str, Any]) -> Optional[T]:
        """Update an entity."""
        pass
    
    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Delete an entity."""
        pass
    
    @abstractmethod
    async def query(self, filters: Dict[str, Any], limit: int = 100) -> List[T]:
        """Query entities with filters."""
        pass


class VectorRepository(ABC):
    """
    Abstract repository for vector database operations.
    Used for semantic search and job matching with Qdrant.
    """
    
    @abstractmethod
    async def upsert_vector(
        self, 
        id: str, 
        vector: List[float], 
        payload: Dict[str, Any]
    ) -> str:
        """Insert or update a vector with payload."""
        pass
    
    @abstractmethod
    async def search_similar(
        self, 
        query_vector: List[float], 
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors."""
        pass
    
    @abstractmethod
    async def delete_vector(self, id: str) -> bool:
        """Delete a vector by ID."""
        pass
    
    @abstractmethod
    async def get_vector(self, id: str) -> Optional[Dict[str, Any]]:
        """Get a vector by ID."""
        pass
