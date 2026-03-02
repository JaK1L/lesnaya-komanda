"""
Маршруты для работы с профилем пользователя
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse
from pathlib import Path
import asyncpg

from ..database import get_db
from ..schemas import ProfileResponse, ProfileUpdate
from ..services.profile_service import ProfileService
from ..auth import get_current_user, User

router = APIRouter()


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get current user's profile data
    
    Requires authentication via JWT token.
    Returns profile information including site_nickname, bio, avatar, etc.
    """
    service = ProfileService(db)
    
    try:
        print(f"[DEBUG] Getting profile for user_id: {current_user.id}")
        profile = await service.get_user_profile(current_user.id)
        
        if not profile:
            print(f"[DEBUG] Profile not found for user_id: {current_user.id}")
            raise HTTPException(status_code=404, detail="Profile not found")
        
        print(f"[DEBUG] Profile found: {profile.discord_username}")
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error fetching profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching profile: {str(e)}"
        )


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Update current user's profile data
    
    Requires authentication via JWT token.
    Updates profile fields in a single atomic transaction.
    All fields are validated before persistence.
    """
    service = ProfileService(db)
    
    try:
        updated_profile = await service.update_user_profile(current_user.id, data)
        return updated_profile
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating profile: {str(e)}"
        )


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Upload avatar file for current user
    
    Requires authentication via JWT token.
    Accepts JPEG, PNG, GIF, WebP formats up to 5MB.
    Returns the new avatar URL.
    """
    service = ProfileService(db)
    
    try:
        # Delete old avatar if exists
        await service.delete_old_avatar(current_user.id)
        
        # Save new avatar file
        avatar_url = await service.save_avatar_file(current_user.id, file)
        
        # Update database with new avatar URL
        await db.execute(
            "UPDATE users SET avatar_url = $1 WHERE id = $2",
            avatar_url,
            current_user.id
        )
        
        return {
            "status": "success",
            "avatar_url": avatar_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading avatar: {str(e)}"
        )


@router.get("/uploads/avatars/{filename}")
async def get_avatar(filename: str):
    """
    Serve avatar files
    
    Public endpoint for serving uploaded avatar images.
    No authentication required.
    """
    upload_dir = Path(__file__).parent.parent.parent / "uploads" / "avatars"
    file_path = upload_dir / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")
    
    # Security check: ensure file is within upload directory
    if not str(file_path.resolve()).startswith(str(upload_dir.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return FileResponse(file_path)
