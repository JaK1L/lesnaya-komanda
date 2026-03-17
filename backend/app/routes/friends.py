"""
Friends system: requests, list, status.
"""
from datetime import datetime
from typing import List, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import User, get_current_user, get_optional_current_user
from ..database import get_db
from ..services.notifications_service import create_notification, ensure_notifications_schema
from ..services.user_identity import resolve_user_by_identifier

router = APIRouter(prefix="/friends", tags=["friends"])


class FriendOut(BaseModel):
    id: int
    discord_id: Optional[int]
    username: str
    avatar_url: Optional[str]
    forest_rank: str
    since: datetime


class RequestOut(BaseModel):
    id: int
    from_discord_id: Optional[int]
    from_username: str
    from_avatar: Optional[str]
    created_at: datetime


async def _resolve_target_user_id(
    db: asyncpg.Connection,
    target_identifier: str,
) -> Optional[int]:
    row = await resolve_user_by_identifier(db, target_identifier)
    if not row:
        return None
    return int(row["id"])


@router.get("/status/{target_identifier}")
async def friend_status(
    target_identifier: str,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    target_user_id = await _resolve_target_user_id(db, target_identifier)
    if not target_user_id or target_user_id == current_user.id:
        return {"status": "none"}

    row = await db.fetchrow(
        """
        SELECT id, status, user_id, friend_id
        FROM friendships
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        """,
        current_user.id,
        target_user_id,
    )
    if not row:
        return {"status": "none"}

    if row["status"] == "accepted":
        return {"status": "friends"}

    if row["user_id"] == current_user.id:
        return {"status": "pending"}
    return {"status": "incoming"}


@router.post("/request/{target_identifier}")
async def send_request(
    target_identifier: str,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    await ensure_notifications_schema(db)
    target_user_id = await _resolve_target_user_id(db, target_identifier)
    if not target_user_id:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")

    existing = await db.fetchrow(
        """
        SELECT id, status, user_id, friend_id
        FROM friendships
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        """,
        current_user.id,
        target_user_id,
    )
    if existing:
        if existing["status"] == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")

        # Counter-request accepts an incoming pending request.
        if (
            existing["status"] == "pending"
            and existing["user_id"] == target_user_id
            and existing["friend_id"] == current_user.id
        ):
            await db.execute(
                "UPDATE friendships SET status = 'accepted', accepted_at = NOW() WHERE id = $1",
                existing["id"],
            )
            return {"status": "accepted"}

        raise HTTPException(status_code=400, detail="Request already exists")

    await db.execute(
        "INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')",
        current_user.id,
        target_user_id,
    )
    return {"status": "sent"}


@router.post("/accept/{request_id}")
async def accept_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    await ensure_notifications_schema(db)
    row = await db.fetchrow(
        "SELECT id FROM friendships WHERE id = $1 AND friend_id = $2 AND status = 'pending'",
        request_id,
        current_user.id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")

    await db.execute(
        "UPDATE friendships SET status = 'accepted', accepted_at = NOW() WHERE id = $1",
        request_id,
    )
    sender_id = await db.fetchval("SELECT user_id FROM friendships WHERE id = $1", request_id)
    current_identifier = await db.fetchval(
        "SELECT COALESCE(user_tag, discord_id::text, id::text) FROM users WHERE id = $1",
        current_user.id,
    )
    if sender_id:
        await create_notification(
            db,
            recipient_user_id=int(sender_id),
            actor_user_id=current_user.id,
            kind="friend_accept",
            title="Заявка в друзья принята",
            body=f"{current_user.username} принял заявку в друзья.",
            link=f"/profile/{current_identifier}" if current_identifier else "/profile",
            metadata={"friend_user_id": current_user.id},
        )
    return {"status": "accepted"}


@router.post("/accept-user/{target_identifier}")
async def accept_request_from_user(
    target_identifier: str,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    await ensure_notifications_schema(db)
    target_user_id = await _resolve_target_user_id(db, target_identifier)
    if not target_user_id:
        raise HTTPException(status_code=404, detail="User not found")

    row = await db.fetchrow(
        """
        SELECT id
        FROM friendships
        WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
        """,
        target_user_id,
        current_user.id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Incoming request not found")

    await db.execute(
        "UPDATE friendships SET status = 'accepted', accepted_at = NOW() WHERE id = $1",
        row["id"],
    )
    current_identifier = await db.fetchval(
        "SELECT COALESCE(user_tag, discord_id::text, id::text) FROM users WHERE id = $1",
        current_user.id,
    )
    await create_notification(
        db,
        recipient_user_id=target_user_id,
        actor_user_id=current_user.id,
        kind="friend_accept",
        title="Заявка в друзья принята",
        body=f"{current_user.username} принял заявку в друзья.",
        link=f"/profile/{current_identifier}" if current_identifier else "/profile",
        metadata={"friend_user_id": current_user.id},
    )
    return {"status": "accepted"}


@router.post("/decline/{request_id}")
async def decline_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        "SELECT id FROM friendships WHERE id = $1 AND friend_id = $2 AND status = 'pending'",
        request_id,
        current_user.id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")

    await db.execute("DELETE FROM friendships WHERE id = $1", request_id)
    return {"status": "declined"}


@router.delete("/remove/{other_identifier}")
async def remove_friend(
    other_identifier: str,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    other_user_id = await _resolve_target_user_id(db, other_identifier)
    if not other_user_id:
        raise HTTPException(status_code=404, detail="User not found")

    await db.execute(
        """
        DELETE FROM friendships
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        """,
        current_user.id,
        other_user_id,
    )
    return {"status": "removed"}


@router.get("/list", response_model=List[FriendOut])
async def list_friends(
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch(
        """
        SELECT
            u.id,
            u.discord_id,
            COALESCE(u.site_nickname, u.discord_username) AS username,
            u.avatar_url,
            u.forest_rank,
            f.accepted_at AS since
        FROM friendships f
        JOIN users u ON u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
        WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
        ORDER BY f.accepted_at DESC
        """,
        current_user.id,
    )
    return [FriendOut(**dict(r)) for r in rows]


@router.get("/public/{profile_identifier}", response_model=List[FriendOut])
async def list_public_friends(
    profile_identifier: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    target = await resolve_user_by_identifier(db, profile_identifier)
    if not target:
        return []

    target_user_id = int(target["id"])
    if target["is_hidden"] and (current_user is None or current_user.id != target_user_id):
        raise HTTPException(status_code=403, detail="This profile is hidden")

    rows = await db.fetch(
        """
        SELECT
            u.id,
            u.discord_id,
            COALESCE(u.site_nickname, u.discord_username) AS username,
            u.avatar_url,
            u.forest_rank,
            f.accepted_at AS since
        FROM friendships f
        JOIN users u ON u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
        WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
        ORDER BY f.accepted_at DESC
        """,
        target_user_id,
    )
    return [FriendOut(**dict(r)) for r in rows]


@router.get("/requests", response_model=List[RequestOut])
async def incoming_requests(
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch(
        """
        SELECT
            f.id,
            u.discord_id AS from_discord_id,
            COALESCE(u.site_nickname, u.discord_username) AS from_username,
            u.avatar_url AS from_avatar,
            f.created_at
        FROM friendships f
        JOIN users u ON u.id = f.user_id
        WHERE f.friend_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC
        """,
        current_user.id,
    )
    return [RequestOut(**dict(r)) for r in rows]
