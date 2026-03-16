from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import asyncpg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth import User, get_current_user
from ..database import get_db
from ..services.notifications_service import ensure_notifications_schema

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationOut(BaseModel):
    id: int
    kind: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    actor_name: Optional[str] = None
    actor_avatar_url: Optional[str] = None
    metadata: Dict[str, Any] = {}


@router.get("", response_model=List[NotificationOut])
async def list_notifications(
    limit: int = 20,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_notifications_schema(db)
    rows = await db.fetch(
        """
        SELECT
            n.id,
            n.kind,
            n.title,
            n.body,
            n.link,
            n.is_read,
            n.created_at,
            n.read_at,
            n.metadata,
            COALESCE(u.site_nickname, u.discord_username) AS actor_name,
            u.avatar_url AS actor_avatar_url
        FROM user_notifications n
        LEFT JOIN users u ON u.id = n.actor_user_id
        WHERE n.recipient_user_id = $1
        ORDER BY n.created_at DESC
        LIMIT $2
        """,
        current_user.id,
        max(1, min(limit, 100)),
    )
    return [NotificationOut(**dict(row)) for row in rows]


@router.get("/unread-count")
async def unread_count(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_notifications_schema(db)
    count = await db.fetchval(
        "SELECT COUNT(*) FROM user_notifications WHERE recipient_user_id = $1 AND is_read = FALSE",
        current_user.id,
    )
    return {"count": int(count or 0)}


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_notifications_schema(db)
    await db.execute(
        """
        UPDATE user_notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE id = $1 AND recipient_user_id = $2
        """,
        notification_id,
        current_user.id,
    )
    return {"status": "ok"}


@router.post("/read-all")
async def mark_all_read(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_notifications_schema(db)
    await db.execute(
        """
        UPDATE user_notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE recipient_user_id = $1 AND is_read = FALSE
        """,
        current_user.id,
    )
    return {"status": "ok"}
