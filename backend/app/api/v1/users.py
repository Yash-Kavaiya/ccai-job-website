"""
User API endpoints.
Handles user profile management, skills, and achievements.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserPublicProfile,
    UserSkillCreate,
    UserSkillResponse,
    AchievementCreate,
    AchievementResponse,
)
from app.models.user import User, UserSkill, Achievement
from app.api.deps import get_current_user, get_current_active_user
from app.core.config import settings
import os
import uuid
from datetime import datetime

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current user's full profile.

    - Requires: Valid access token
    - Returns: User profile with skills and achievements
    """
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user's profile.

    - **full_name**: User's full name
    - **phone**: Phone number
    - **bio**: User biography
    - **location**: Location/city
    - **current_position**: Current job title
    - **company**: Current company
    - **linkedin_url**: LinkedIn profile URL
    - **github_url**: GitHub profile URL
    - **portfolio_url**: Portfolio website URL

    Returns updated user profile.
    """
    # Update user fields
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload user avatar image.

    - **file**: Image file (JPG, PNG, GIF)
    - Max size: 5MB
    - Returns: Updated user profile with avatar URL
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        )

    # Validate file size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
        )

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Create avatars directory if it doesn't exist
    avatars_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(avatars_dir, exist_ok=True)

    # Save file
    file_path = os.path.join(avatars_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Update user avatar URL
    current_user.avatar_url = f"/uploads/avatars/{unique_filename}"
    current_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.get("/{user_id}", response_model=UserPublicProfile)
async def get_user_public_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get public profile of any user by ID.

    - **user_id**: User ID
    - Returns: Limited public profile information
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserPublicProfile.model_validate(user)


# ============================================================================
# SKILLS ENDPOINTS
# ============================================================================

@router.post("/me/skills", response_model=UserSkillResponse, status_code=status.HTTP_201_CREATED)
async def add_skill(
    skill: UserSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a skill to current user's profile.

    - **skill_name**: Name of the skill
    - **proficiency_level**: beginner, intermediate, advanced, expert
    - **years_of_experience**: Years of experience (optional)
    """
    # Check if skill already exists
    existing_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_name == skill.skill_name
    ).first()

    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skill already exists"
        )

    # Create new skill
    new_skill = UserSkill(
        user_id=current_user.id,
        **skill.model_dump()
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)

    return UserSkillResponse.model_validate(new_skill)


@router.get("/me/skills", response_model=List[UserSkillResponse])
async def get_my_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all skills of current user.

    Returns list of user's skills.
    """
    skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    return [UserSkillResponse.model_validate(skill) for skill in skills]


@router.put("/me/skills/{skill_id}", response_model=UserSkillResponse)
async def update_skill(
    skill_id: int,
    skill_update: UserSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a skill.

    - **skill_id**: ID of the skill to update
    """
    skill = db.query(UserSkill).filter(
        UserSkill.id == skill_id,
        UserSkill.user_id == current_user.id
    ).first()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )

    # Update skill
    for field, value in skill_update.model_dump(exclude_unset=True).items():
        setattr(skill, field, value)

    db.commit()
    db.refresh(skill)

    return UserSkillResponse.model_validate(skill)


@router.delete("/me/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a skill.

    - **skill_id**: ID of the skill to delete
    """
    skill = db.query(UserSkill).filter(
        UserSkill.id == skill_id,
        UserSkill.user_id == current_user.id
    ).first()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )

    db.delete(skill)
    db.commit()

    return None


# ============================================================================
# ACHIEVEMENTS ENDPOINTS
# ============================================================================

@router.post("/me/achievements", response_model=AchievementResponse, status_code=status.HTTP_201_CREATED)
async def add_achievement(
    achievement: AchievementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add an achievement to current user's profile.

    - **title**: Achievement title
    - **description**: Achievement description
    - **icon**: Icon name/emoji (optional)
    - **date_achieved**: Date when achieved (optional)
    """
    new_achievement = Achievement(
        user_id=current_user.id,
        **achievement.model_dump()
    )

    db.add(new_achievement)
    db.commit()
    db.refresh(new_achievement)

    return AchievementResponse.model_validate(new_achievement)


@router.get("/me/achievements", response_model=List[AchievementResponse])
async def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all achievements of current user.

    Returns list of user's achievements.
    """
    achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).all()
    return [AchievementResponse.model_validate(achievement) for achievement in achievements]


@router.delete("/me/achievements/{achievement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_achievement(
    achievement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an achievement.

    - **achievement_id**: ID of the achievement to delete
    """
    achievement = db.query(Achievement).filter(
        Achievement.id == achievement_id,
        Achievement.user_id == current_user.id
    ).first()

    if not achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement not found"
        )

    db.delete(achievement)
    db.commit()

    return None
