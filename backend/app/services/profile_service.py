"""
Сервис для работы с профилем пользователя
"""
from typing import Optional, List, Dict
import asyncpg
from pathlib import Path
import uuid
from datetime import datetime
from PIL import Image
import io
from fastapi import UploadFile, HTTPException

from ..schemas import ProfileResponse, ProfileUpdate


class ProfileService:
    """Service for managing user profiles"""
    
    # Supported image formats
    ALLOWED_FORMATS = {'JPEG', 'PNG', 'GIF', 'WEBP'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
    
    MAX_BANNER_SIZE = 8 * 1024 * 1024  # 8MB

    def __init__(self, db: asyncpg.Connection):
        self.db = db
        self.upload_dir = Path(__file__).parent.parent.parent / "uploads" / "avatars"
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.banner_dir = Path(__file__).parent.parent.parent / "uploads" / "banners"
        self.banner_dir.mkdir(parents=True, exist_ok=True)

    async def _fetch_user_roles(self, user_id: int) -> List[Dict]:
        """Fetch roles defensively: legacy environments may not have role tables."""
        try:
            roles_rows = await self.db.fetch(
                "SELECT r.id, r.name, r.color FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1 ORDER BY r.name",
                user_id
            )
            return [{"id": r["id"], "name": r["name"], "color": r.get("color", "#9147ff")} for r in roles_rows]
        except (asyncpg.UndefinedTableError, asyncpg.UndefinedColumnError):
            return []
    
    async def get_user_profile(self, user_id: int) -> Optional[ProfileResponse]:
        """
        Retrieve user profile data from database
        
        Args:
            user_id: User ID in the database
            
        Returns:
            ProfileResponse object or None if user not found
        """
        query = """
            SELECT 
                discord_id,
                site_nickname,
                discord_username,
                user_tag,
                avatar_url,
                bio,
                is_hidden,
                forest_rank,
                rating,
                joined_at,
                is_admin,
                game_preferences,
                level,
                current_xp,
                total_xp,
                points,
                twitch_username
            FROM users
            WHERE id = $1
        """
        
        try:
            row = await self.db.fetchrow(query, user_id)

            if not row:
                return None

            roles = await self._fetch_user_roles(user_id)

            # Safely extract game_preferences
            game_prefs = row['game_preferences']
            if game_prefs is None:
                game_prefs = None
            elif isinstance(game_prefs, str):
                import json
                try:
                    game_prefs = json.loads(game_prefs)
                    # Ensure it's a list
                    if game_prefs and not isinstance(game_prefs, list):
                        game_prefs = [game_prefs]
                except:
                    game_prefs = None
            elif isinstance(game_prefs, dict):
                # If it's a dict, wrap it in a list
                game_prefs = [game_prefs]
            elif not isinstance(game_prefs, list):
                # If it's not a list, set to None
                game_prefs = None
            
            return ProfileResponse(
                user_id=user_id,
                discord_id=row['discord_id'] if row['discord_id'] else None,
                site_nickname=row['site_nickname'],
                discord_username=row['discord_username'],
                user_tag=row.get('user_tag'),
                avatar_url=row['avatar_url'],
                banner_url=await self._fetch_banner_url(user_id),
                bio=row['bio'],
                is_hidden=row['is_hidden'] or False,
                forest_rank=row['forest_rank'],
                rating=row['rating'],
                joined_at=row['joined_at'],
                is_admin=row['is_admin'] or False,
                game_preferences=game_prefs,
                level=row.get('level', 0),
                current_xp=row.get('current_xp', 0),
                total_xp=row.get('total_xp', 0),
                points=row.get('points', 0),
                twitch_username=row.get('twitch_username'),
                roles=roles
            )
        except Exception as e:
            print(f"[ERROR] get_user_profile failed for user_id {user_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    async def update_user_profile(
        self, 
        user_id: int, 
        data: ProfileUpdate
    ) -> ProfileResponse:
        """
        Update user profile data in database
        
        Args:
            user_id: User ID in the database
            data: ProfileUpdate object with new values
            
        Returns:
            Updated ProfileResponse object
            
        Raises:
            HTTPException: If user not found or update fails
        """
        # Start transaction for atomic update
        async with self.db.transaction():
            # Check if user exists
            exists = await self.db.fetchval(
                "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)",
                user_id
            )
            
            if not exists:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Update profile fields
            query = """
                UPDATE users
                SET 
                    site_nickname = $1,
                    avatar_url = COALESCE($2, avatar_url),
                    bio = $3,
                    is_hidden = $4
                WHERE id = $5
                RETURNING 
                    discord_id,
                    site_nickname,
                    discord_username,
                    avatar_url,
                    bio,
                    is_hidden,
                    forest_rank,
                    rating,
                    joined_at,
                    is_admin,
                    level,
                    current_xp,
                    total_xp,
                    points
            """
            
            row = await self.db.fetchrow(
                query,
                data.site_nickname,
                data.avatar_url,
                data.bio,
                data.is_hidden,
                user_id
            )
            
            if not row:
                raise HTTPException(status_code=500, detail="Failed to update profile")

            refreshed_profile = await self.get_user_profile(user_id)
            if not refreshed_profile:
                raise HTTPException(status_code=500, detail="Failed to load updated profile")

            return refreshed_profile

    async def _fetch_banner_url(self, user_id: int) -> Optional[str]:
        """Load banner defensively because legacy databases may not have the column yet."""
        try:
            return await self.db.fetchval(
                "SELECT banner_url FROM users WHERE id = $1",
                user_id,
            )
        except (asyncpg.UndefinedTableError, asyncpg.UndefinedColumnError):
            return None
    
    async def save_avatar_file(
        self, 
        user_id: int, 
        file: UploadFile
    ) -> str:
        """
        Validate and save avatar file to filesystem
        
        Args:
            user_id: User ID in the database
            file: Uploaded file object
            
        Returns:
            Relative path to saved file (for storing in database)
            
        Raises:
            HTTPException: If file validation fails
        """
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Avatar file must be under {self.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Validate image format using Pillow
        try:
            image = Image.open(io.BytesIO(content))
            image_format = image.format
            
            if image_format not in self.ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Avatar must be {', '.join(self.ALLOWED_FORMATS)}"
                )
            
            # Get file extension
            ext = image_format.lower()
            if ext == 'jpeg':
                ext = 'jpg'
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=400,
                detail="Invalid image file"
            )
        
        # Generate unique filename
        timestamp = int(datetime.now().timestamp())
        unique_id = uuid.uuid4().hex[:8]
        filename = f"{user_id}_{unique_id}_{timestamp}.{ext}"
        
        # Save file
        file_path = self.upload_dir / filename
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Return relative path for database
        return f"/api/uploads/avatars/{filename}"
    
    async def delete_old_avatar(self, user_id: int) -> None:
        """
        Delete user's old avatar file from filesystem
        
        Args:
            user_id: User ID in the database
            
        Note:
            Failures are logged but don't raise exceptions to avoid
            blocking profile updates if file deletion fails
        """
        try:
            # Get current avatar URL
            avatar_url = await self.db.fetchval(
                "SELECT avatar_url FROM users WHERE id = $1",
                user_id
            )
            
            if not avatar_url or not avatar_url.startswith('/api/uploads/avatars/'):
                return
            
            # Extract filename
            filename = avatar_url.split('/')[-1]
            file_path = self.upload_dir / filename
            
            # Delete file if it exists
            if file_path.exists():
                file_path.unlink()
                
        except Exception as e:
            # Log error but don't raise exception
            print(f"Warning: Failed to delete old avatar for user {user_id}: {e}")

    async def save_banner_file(self, user_id: int, file: UploadFile) -> str:
        content = await file.read()
        if len(content) > self.MAX_BANNER_SIZE:
            raise HTTPException(status_code=400, detail="Banner must be under 8MB")
        try:
            image = Image.open(io.BytesIO(content))
            if image.format not in self.ALLOWED_FORMATS:
                raise HTTPException(status_code=400, detail=f"Banner must be {', '.join(self.ALLOWED_FORMATS)}")
            ext = image.format.lower()
            if ext == 'jpeg':
                ext = 'jpg'
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file")
        timestamp = int(datetime.now().timestamp())
        filename = f"banner_{user_id}_{uuid.uuid4().hex[:8]}_{timestamp}.{ext}"
        with open(self.banner_dir / filename, 'wb') as f:
            f.write(content)
        return f"/api/uploads/banners/{filename}"

    async def delete_old_banner(self, user_id: int) -> None:
        try:
            url = await self.db.fetchval("SELECT banner_url FROM users WHERE id = $1", user_id)
            if url and '/api/uploads/banners/' in url:
                fname = url.split('/')[-1]
                fp = self.banner_dir / fname
                if fp.exists():
                    fp.unlink()
        except Exception as e:
            print(f"Warning: Failed to delete old banner for user {user_id}: {e}")
