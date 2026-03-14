"""
Медиа-галерея: загрузка и просмотр изображений/клипов сообщества.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import asyncpg
import uuid
import io

from ..database import get_db
from ..auth import get_current_user, get_optional_current_user, User

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "media"
ALLOWED_FORMATS = {"JPEG", "PNG", "GIF", "WEBP"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class MediaItemOut(BaseModel):
    id: int
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    title: str
    description: Optional[str] = None
    media_type: str
    file_url: str
    created_at: datetime


class MediaUrlCreate(BaseModel):
    title: str
    description: Optional[str] = None
    media_type: str  # image | youtube | twitch | tiktok
    file_url: str    # final URL (ImgBB for images, original for videos)


# ── Public list ─────────────────────────────────────────────────────────────

@router.get("/media", response_model=List[MediaItemOut])
async def list_media(
    offset: int = 0,
    limit: int = 30,
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch(
        """
        SELECT
            m.id, m.user_id,
            COALESCE(u.site_nickname, u.discord_username) AS username,
            u.avatar_url,
            m.title, m.description, m.media_type, m.file_url, m.created_at
        FROM media_items m
        JOIN users u ON u.id = m.user_id
        ORDER BY m.created_at DESC
        LIMIT $1 OFFSET $2
        """,
        limit, offset,
    )
    return [MediaItemOut(**dict(r)) for r in rows]


# ── Add by URL (images via ImgBB, videos by link) ────────────────────────────

@router.post("/media/add-url", response_model=MediaItemOut)
async def add_media_url(
    payload: MediaUrlCreate,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    allowed_types = ("image", "youtube", "twitch", "tiktok")
    if payload.media_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"media_type must be one of {allowed_types}")
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="title is required")
    if not payload.file_url.strip():
        raise HTTPException(status_code=400, detail="file_url is required")

    row = await db.fetchrow(
        """
        INSERT INTO media_items (user_id, title, description, media_type, file_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, description, media_type, file_url, created_at
        """,
        current_user.id, payload.title.strip(), payload.description, payload.media_type, payload.file_url.strip(),
    )
    user_row = await db.fetchrow(
        "SELECT COALESCE(site_nickname, discord_username) AS username, avatar_url FROM users WHERE id = $1",
        current_user.id,
    )
    return MediaItemOut(**dict(row), username=user_row["username"], avatar_url=user_row["avatar_url"])


# ── Upload ───────────────────────────────────────────────────────────────────

@router.post("/media/upload", response_model=MediaItemOut)
async def upload_media(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    media_type: str = Form("image"),
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    if media_type not in ("image", "clip"):
        raise HTTPException(status_code=400, detail="media_type must be 'image' or 'clip'")
    if not title.strip():
        raise HTTPException(status_code=400, detail="title is required")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    # Validate image
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        if img.format not in ALLOWED_FORMATS:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, WEBP allowed")
        ext = img.format.lower().replace("jpeg", "jpg")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    (UPLOAD_DIR / filename).write_bytes(content)
    file_url = f"/api/uploads/media/{filename}"

    row = await db.fetchrow(
        """
        INSERT INTO media_items (user_id, title, description, media_type, file_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, description, media_type, file_url, created_at
        """,
        current_user.id, title.strip(), description, media_type, file_url,
    )
    user_row = await db.fetchrow(
        "SELECT COALESCE(site_nickname, discord_username) AS username, avatar_url FROM users WHERE id = $1",
        current_user.id,
    )
    return MediaItemOut(
        **dict(row),
        username=user_row["username"],
        avatar_url=user_row["avatar_url"],
    )


# ── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/media/{item_id}")
async def delete_media(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow("SELECT user_id, file_url FROM media_items WHERE id = $1", item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    if row["user_id"] != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delete file
    file_path = Path(__file__).parent.parent.parent / row["file_url"].lstrip("/api/")
    if file_path.exists():
        file_path.unlink()

    await db.execute("DELETE FROM media_items WHERE id = $1", item_id)
    return {"status": "deleted"}


# ── Serve files ───────────────────────────────────────────────────────────────

@router.get("/uploads/media/{filename}")
async def serve_media(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    if not str(file_path.resolve()).startswith(str(UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=403)
    return FileResponse(file_path)
