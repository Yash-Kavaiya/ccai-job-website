"""Firebase Storage service for file operations."""

from typing import Optional
from datetime import timedelta

from app.core.dependencies import get_storage_bucket


class StorageService:
    """
    Firebase Storage service for blob storage operations.
    
    Single Responsibility: File storage operations only.
    """
    
    def __init__(self):
        self._bucket = get_storage_bucket()
    
    async def upload_file(
        self,
        file_content: bytes,
        destination_path: str,
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload a file to Firebase Storage.
        
        Returns the public URL of the uploaded file.
        """
        blob = self._bucket.blob(destination_path)
        blob.upload_from_string(file_content, content_type=content_type)
        
        # Make publicly accessible (or use signed URLs for private files)
        blob.make_public()
        
        return blob.public_url
    
    async def upload_file_private(
        self,
        file_content: bytes,
        destination_path: str,
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload a private file to Firebase Storage.
        
        Returns the storage path (use get_signed_url for access).
        """
        blob = self._bucket.blob(destination_path)
        blob.upload_from_string(file_content, content_type=content_type)
        
        return destination_path
    
    async def get_signed_url(
        self,
        file_path: str,
        expiration_minutes: int = 60
    ) -> str:
        """
        Generate a signed URL for private file access.
        """
        blob = self._bucket.blob(file_path)
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="GET"
        )
        
        return url
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from Firebase Storage."""
        try:
            blob = self._bucket.blob(file_path)
            blob.delete()
            return True
        except Exception:
            return False
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if a file exists in storage."""
        blob = self._bucket.blob(file_path)
        return blob.exists()
    
    async def get_file_metadata(self, file_path: str) -> Optional[dict]:
        """Get file metadata."""
        blob = self._bucket.blob(file_path)
        
        if not blob.exists():
            return None
        
        blob.reload()
        
        return {
            "name": blob.name,
            "size": blob.size,
            "content_type": blob.content_type,
            "created": blob.time_created,
            "updated": blob.updated,
        }
    
    async def copy_file(self, source_path: str, destination_path: str) -> str:
        """Copy a file within storage."""
        source_blob = self._bucket.blob(source_path)
        destination_blob = self._bucket.copy_blob(
            source_blob, self._bucket, destination_path
        )
        return destination_blob.public_url
