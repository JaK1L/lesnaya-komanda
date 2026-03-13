"""
Система дружбы: заявки, список друзей, статус.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import asyncpg

from ..database import get_db
from ..auth import get_current_user, User

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


# ── Status ────────────────────────────────────────────────────────────────────

@router.get("/status/{target_discord_id}")
async def friend_status(
    target_discord_id: int,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    target = await db.fetchval("SELECT id FROM users WHERE discord_id = $1", target_discord_id)
    if not target:
        return {"status": "none"}

    row = await db.fetchrow(
        """
        SELECT status FROM friendships
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        """,
        current_user.id, target,
    )
    if not row:
        return {"status": "none"}
    if row["status"] == "accepted":
        return {"status": "friends"}
    # pending — check direction
    req = await db.fetchrow(
        "SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'",
        current_user.id, target,
    )
    return {"status": "pending" if req else "incoming"}


# ── Send request ──────────────────────────────────────────────────────────────

@router.post("/request/{target_discord_id}")
async def send_request(
    target_discord_id: int,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    target_id = await db.fetchval("SELECT id FROM users WHERE discord_id = $1", target_discord_id)
    if not target_id:
        raise HTTPException(404, "User not found")
    if target_id == current_user.id:
        raise HTTPException(400, "Cannot friend yourself")

    existing = await db.fetchrow(
        "SELECT id, status FROM friendships WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)",
        current_user.id, target_id,
    )
    if existing:
        if existing["status"] == "accepted":
            raise HTTPException(400, "Already friends")
        raise HTTPException(400, "Request already exists")

    await db.execute(
        "INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')",
        current_user.id, target_id,
    )
    return {"status": "sent"}


# ── Accept / decline ──────────────────────────────────────────────────────────

@router.post("/accept/{request_id}")
async def accept_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        "SELECT * FROM friendships WHERE id=$1 AND friend_id=$2 AND status='pending'",
        request_id, current_user.id,
    )
    if not row:
        raise HTTPException(404, "Request not found")
    await db.execute("UPDATE friendships SET status='accepted', accepted_at=NOW() WHERE id=$1", request_id)
    return {"status": "accepted"}


@router.post("/decline/{request_id}")
async def decline_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        "SELECT id FROM friendships WHERE id=$1 AND friend_id=$2 AND status='pending'",
        request_id, current_user.id,
    )
    if not row:
        raise HTTPException(404, "Request not found")
    await db.execute("DELETE FROM friendships WHERE id=$1", request_id)
    return {"status": "declined"}


# ── Remove friend ─────────────────────────────────────────────────────────────

@router.delete("/remove/{other_discord_id}")
async def remove_friend(
    other_discord_id: int,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    other_id = await db.fetchval("SELECT id FROM users WHERE discord_id=$1", other_discord_id)
    if not other_id:
        raise HTTPException(404, "User not found")
    await db.execute(
        "DELETE FROM friendships WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)",
        current_user.id, other_id,
    )
    return {"status": "removed"}


# ── List friends ──────────────────────────────────────────────────────────────

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


# ── Incoming requests ─────────────────────────────────────────────────────────

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
