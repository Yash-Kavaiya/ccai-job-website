"""User API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserProfileUpdate
from app.services.user_service import UserService
from app.core.exceptions import NotFoundError, DuplicateError
from .deps import get_current_user, get_user_service

router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service)
):
    """Create a new user (called after Firebase auth)."""
    try:
        user = await service.create_user(
            email=user_data.email,
            display_name=user_data.display_name,
            firebase_uid=user_data.firebase_uid
        )
        return UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            profile=user.profile.__dict__,
            subscription_tier=user.subscription_tier.value,
            created_at=user.created_at,
            is_active=user.is_active,
        )
    except DuplicateError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e.message))


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    """Get current user's profile."""
    user = await service.get_user_by_firebase_uid(current_user.get("uid"))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        profile=user.profile.__dict__,
        subscription_tier=user.subscription_tier.value,
        created_at=user.created_at,
        is_active=user.is_active,
    )


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    """Update current user's profile."""
    user = await service.get_user_by_firebase_uid(current_user.get("uid"))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if "profile" in update_dict and update_dict["profile"]:
        user = await service.update_profile(user.id, update_dict["profile"])
        del update_dict["profile"]
    
    if update_dict:
        user = await service.update_user(user.id, update_dict)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        profile=user.profile.__dict__,
        subscription_tier=user.subscription_tier.value,
        created_at=user.created_at,
        is_active=user.is_active,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    service: UserService = Depends(get_user_service)
):
    """Get user by ID (public profiles only)."""
    try:
        user = await service.get_user(user_id)
        if not user.profile.is_public:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Profile is private")
        
        return UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            profile=user.profile.__dict__,
            subscription_tier=user.subscription_tier.value,
            created_at=user.created_at,
            is_active=user.is_active,
        )
    except NotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
