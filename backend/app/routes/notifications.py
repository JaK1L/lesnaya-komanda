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
    friend_request_id: Optional[int] = None
    actions_available: bool = False
    actor_user_id: Optional[int] = None


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
            n.actor_user_id,
            n.metadata,
            COALESCE(u.site_nickname, u.discord_username) AS actor_name,
            u.avatar_url AS actor_avatar_url
        FROM user_notifications n
        LEFT JOIN users u ON u.id = n.actor_user_id
        WHERE n.recipient_user_id = $1
          AND n.kind <> 'friend_request'
        ORDER BY n.created_at DESC
        LIMIT $2
        """,
        current_user.id,
        max(1, min(limit, 100)),
    )

    pending_requests = await db.fetch(
        """
        SELECT
            f.id AS friend_request_id,
            f.created_at,
            f.user_id AS actor_user_id,
            COALESCE(u.site_nickname, u.discord_username) AS actor_name,
            u.avatar_url AS actor_avatar_url,
            COALESCE(u.user_tag, u.discord_id::text, u.id::text) AS actor_identifier
        FROM friendships f
        JOIN users u ON u.id = f.user_id
        WHERE f.friend_id = $1
          AND f.status = 'pending'
        ORDER BY f.created_at DESC
        LIMIT $2
        """,
        current_user.id,
        max(1, min(limit, 100)),
    )

    items = [NotificationOut(**dict(row)) for row in rows]
    for request in pending_requests:
        actor_name = request["actor_name"] or "Пользователь"
        actor_identifier = request["actor_identifier"]
        items.append(
            NotificationOut(
                id=-(int(request["friend_request_id"])),
                kind="friend_request",
                title="Новая заявка в друзья",
                body=f"{actor_name} отправил вам заявку в друзья.",
                link=f"/profile/{actor_identifier}" if actor_identifier else None,
                is_read=False,
                created_at=request["created_at"],
                read_at=None,
                actor_name=actor_name,
                actor_avatar_url=request["actor_avatar_url"],
                actor_user_id=request["actor_user_id"],
                metadata={"friend_request_id": int(request["friend_request_id"])},
                friend_request_id=int(request["friend_request_id"]),
                actions_available=True,
            )
        )

    items.sort(key=lambda item: item.created_at, reverse=True)
    return items[: max(1, min(limit, 100))]


@router.get("/unread-count")
async def unread_count(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_notifications_schema(db)
    db_count = await db.fetchval(
        """
        SELECT COUNT(*)
        FROM user_notifications
        WHERE recipient_user_id = $1
          AND is_read = FALSE
          AND kind <> 'friend_request'
        """,
        current_user.id,
    )
    pending_requests = await db.fetchval(
        """
        SELECT COUNT(*)
        FROM friendships
        WHERE friend_id = $1
          AND status = 'pending'
        """,
        current_user.id,
    )
    return {"count": int(db_count or 0) + int(pending_requests or 0)}


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
