"""
Сервис для работы с профилем пользователя
"""
from typing import Optional, List, Dict, Tuple
import asyncpg
from pathlib import Path
import uuid
from datetime import datetime
from PIL import Image, ImageOps
import io
import os
import base64
import httpx
from fastapi import UploadFile, HTTPException

from ..schemas import ProfileResponse, ProfileUpdate
from .verification_service import ensure_verification_schema, get_user_verification_request

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except Exception:
    register_heif_opener = None


class ProfileService:
    """Service for managing user profiles"""
    
    # Supported image formats
    ALLOWED_FORMATS = {'JPEG', 'PNG', 'GIF', 'WEBP', 'HEIF', 'HEIC'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
    
    MAX_BANNER_SIZE = 8 * 1024 * 1024  # 8MB

    def __init__(self, db: asyncpg.Connection):
        self.db = db
        self.imgbb_api_key = os.getenv("IMGBB_API_KEY") or os.getenv("NEXT_PUBLIC_IMGBB_API_KEY")
        self.require_persistent_storage = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RENDER"))
        self.upload_dir = Path(__file__).parent.parent.parent / "uploads" / "avatars"
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.banner_dir = Path(__file__).parent.parent.parent / "uploads" / "banners"
        self.banner_dir.mkdir(parents=True, exist_ok=True)

    def _validate_image_content(self, content: bytes, max_size: int, label: str) -> Tuple[bytes, str]:
        try:
            original_image = Image.open(io.BytesIO(content))
            image_format = (original_image.format or "").upper()

            if image_format not in self.ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=400,
                    detail=f"{label} must be {', '.join(self.ALLOWED_FORMATS)}"
                )

            if image_format == 'GIF':
                if len(content) > max_size:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{label} GIF must be under {max_size / 1024 / 1024}MB"
                    )
                return content, 'gif'

            image = ImageOps.exif_transpose(original_image)

            max_dimensions = (2048, 2048) if label == "Avatar" else (2560, 1440)
            if image.width > max_dimensions[0] or image.height > max_dimensions[1]:
                image.thumbnail(max_dimensions, Image.Resampling.LANCZOS)

            if image.mode not in ('RGB', 'L'):
                flattened = Image.new('RGB', image.size, (12, 12, 12))
                flattened.paste(image.convert('RGBA'), mask=image.convert('RGBA').getchannel('A') if 'A' in image.getbands() else None)
                image = flattened
            else:
                image = image.convert('RGB')

            if len(content) <= max_size and image_format in {'JPEG', 'JPG', 'PNG', 'WEBP'}:
                ext = 'jpg' if image_format in {'JPEG', 'JPG'} else image_format.lower()
                return content, ext

            working_image = image
            for _ in range(5):
                for quality in (88, 82, 76, 70, 64):
                    buffer = io.BytesIO()
                    working_image.save(buffer, format='JPEG', quality=quality, optimize=True)
                    normalized = buffer.getvalue()
                    if len(normalized) <= max_size:
                        return normalized, 'jpg'

                new_size = (
                    max(320, int(working_image.width * 0.82)),
                    max(320, int(working_image.height * 0.82)),
                )
                if new_size == working_image.size:
                    break
                working_image = working_image.resize(new_size, Image.Resampling.LANCZOS)

            raise HTTPException(
                status_code=400,
                detail=f"{label} file is too large even after optimization. Try a smaller image."
            )
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file")

    async def _upload_to_imgbb(self, content: bytes, file_stem: str) -> str:
        if not self.imgbb_api_key:
            raise HTTPException(
                status_code=500,
                detail="Image storage is not configured. Set IMGBB_API_KEY on the backend."
            )

        encoded_image = base64.b64encode(content).decode("ascii")
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.imgbb.com/1/upload",
                    params={"key": self.imgbb_api_key},
                    data={
                        "image": encoded_image,
                        "name": file_stem,
                    },
                )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Image upload failed: {exc}") from exc

        if not payload.get("success") or not payload.get("data", {}).get("url"):
            raise HTTPException(status_code=502, detail="Image upload failed")

        return payload["data"]["url"]

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
        await ensure_verification_schema(self.db)

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
                twitch_username,
                is_verified,
                verification_badge
            FROM users
            WHERE id = $1
        """
        
        try:
            row = await self.db.fetchrow(query, user_id)

            if not row:
                return None

            roles = await self._fetch_user_roles(user_id)
            verification_request = await get_user_verification_request(self.db, user_id)

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
                is_verified=row.get('is_verified', False) or False,
                verification_badge=row.get('verification_badge'),
                verification_status=verification_request["status"] if verification_request else None,
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
            await self.db.execute(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500)"
            )
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
                    is_hidden = $4,
                    banner_url = COALESCE($5, banner_url)
                WHERE id = $6
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
                data.banner_url,
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
        content = await file.read()
        timestamp = int(datetime.now().timestamp())
        unique_id = uuid.uuid4().hex[:8]
        _, ext = self._validate_image_content(content, self.MAX_FILE_SIZE, "Avatar")
        filename = f"{user_id}_{unique_id}_{timestamp}.{ext}"

        if self.imgbb_api_key:
            return await self._upload_to_imgbb(content, Path(filename).stem)
        if self.require_persistent_storage:
            raise HTTPException(
                status_code=500,
                detail="Persistent image storage is not configured. Set IMGBB_API_KEY on the backend."
            )

        file_path = self.upload_dir / filename
        with open(file_path, 'wb') as f:
            f.write(content)
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
        timestamp = int(datetime.now().timestamp())
        _, ext = self._validate_image_content(content, self.MAX_BANNER_SIZE, "Banner")
        filename = f"banner_{user_id}_{uuid.uuid4().hex[:8]}_{timestamp}.{ext}"

        if self.imgbb_api_key:
            return await self._upload_to_imgbb(content, Path(filename).stem)
        if self.require_persistent_storage:
            raise HTTPException(
                status_code=500,
                detail="Persistent image storage is not configured. Set IMGBB_API_KEY on the backend."
            )

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
