"""
Админские маршруты для управления контентом (событиями и новостями).
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime

import asyncpg
from pydantic import BaseModel, Field

from ..database import get_db
from ..auth import get_current_admin_user
from ..models import User


router = APIRouter(prefix="/admin", tags=["admin"])


class EventCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=2000)
    game: Optional[str] = Field(default="Общее", max_length=50)
    event_date: datetime
    status: str = Field(default="Планируется", max_length=30)


class EventOut(EventCreate):
    id: int
    created_by: Optional[int]
    participants: List[int] = []


@router.get("/events", response_model=List[EventOut])
async def list_events(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех событий (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, title, description, game, event_date, created_by, participants, status
        FROM events
        ORDER BY event_date DESC NULLS LAST, id DESC
        """
    )
    return [EventOut(**dict(row)) for row in rows]


@router.post("/events", response_model=EventOut)
async def create_event(
    payload: EventCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать новое событие."""
    row = await db.fetchrow(
        """
        INSERT INTO events (title, description, game, event_date, created_by, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, description, game, event_date, created_by, participants, status
        """,
        payload.title,
        payload.description,
        payload.game,
        payload.event_date,
        current_user.id,
        payload.status,
    )
    if not row:
        raise HTTPException(status_code=500, detail="Не удалось создать событие")
    return EventOut(**dict(row))


@router.delete("/events/{event_id}", response_model=dict)
async def delete_event(
    event_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить событие."""
    result = await db.execute("DELETE FROM events WHERE id = $1", event_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Событие не найдено")
    return {"status": "ok"}


@router.put("/events/{event_id}", response_model=EventOut)
async def update_event(
    event_id: int,
    payload: EventCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить событие."""
    row = await db.fetchrow(
        """
        UPDATE events
        SET title = $2, description = $3, game = $4, event_date = $5, status = $6
        WHERE id = $1
        RETURNING id, title, description, game, event_date, created_by, participants, status
        """,
        event_id,
        payload.title,
        payload.description,
        payload.game,
        payload.event_date,
        payload.status,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    return EventOut(**dict(row))


class NewsCreate(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=5000)
    published: bool = True


class NewsOut(NewsCreate):
    id: int
    author_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]


@router.get("/news", response_model=List[NewsOut])
async def list_news(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех новостей (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, title, content, author_id, published, created_at, updated_at
        FROM news
        ORDER BY created_at DESC, id DESC
        """
    )
    return [NewsOut(**dict(row)) for row in rows]


@router.post("/news", response_model=NewsOut)
async def create_news(
    payload: NewsCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать новость."""
    row = await db.fetchrow(
        """
        INSERT INTO news (title, content, author_id, published)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, content, author_id, published, created_at, updated_at
        """,
        payload.title,
        payload.content,
        current_user.id,
        payload.published,
    )
    if not row:
        raise HTTPException(status_code=500, detail="Не удалось создать новость")
    return NewsOut(**dict(row))


@router.delete("/news/{news_id}", response_model=dict)
async def delete_news(
    news_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить новость."""
    result = await db.execute("DELETE FROM news WHERE id = $1", news_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Новость не найдена")
    return {"status": "ok"}


@router.put("/news/{news_id}", response_model=NewsOut)
async def update_news(
    news_id: int,
    payload: NewsCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить новость."""
    row = await db.fetchrow(
        """
        UPDATE news
        SET title = $2, content = $3, published = $4, updated_at = NOW()
        WHERE id = $1
        RETURNING id, title, content, author_id, published, created_at, updated_at
        """,
        news_id,
        payload.title,
        payload.content,
        payload.published,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    return NewsOut(**dict(row))


class FeedCreate(BaseModel):
    kind: str = Field(..., pattern="^(post|achievement)$")
    title: str = Field(..., max_length=200)
    content: Optional[str] = Field(default=None, max_length=2000)


class FeedOut(FeedCreate):
    id: int
    created_at: datetime


@router.get("/feed", response_model=List[FeedOut])
async def list_feed(
    kind: Optional[str] = None,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Лента для админки: короткие посты и достижения."""
    if kind:
        rows = await db.fetch(
            """
            SELECT id, kind, title, content, created_at
            FROM home_feed
            WHERE kind = $1
            ORDER BY created_at DESC, id DESC
            """,
            kind,
        )
    else:
        rows = await db.fetch(
            """
            SELECT id, kind, title, content, created_at
            FROM home_feed
            ORDER BY created_at DESC, id DESC
            """
        )
    return [FeedOut(**dict(row)) for row in rows]


@router.post("/feed", response_model=FeedOut)
async def create_feed_item(
    payload: FeedCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать элемент ленты (пост или достижение)."""
    row = await db.fetchrow(
        """
        INSERT INTO home_feed (kind, title, content)
        VALUES ($1, $2, $3)
        RETURNING id, kind, title, content, created_at
        """,
        payload.kind,
        payload.title,
        payload.content,
    )
    if not row:
        raise HTTPException(status_code=500, detail="Не удалось создать запись ленты")
    return FeedOut(**dict(row))


@router.delete("/feed/{feed_id}", response_model=dict)
async def delete_feed_item(
    feed_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить элемент ленты."""
    result = await db.execute("DELETE FROM home_feed WHERE id = $1", feed_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return {"status": "ok"}


@router.put("/feed/{feed_id}", response_model=FeedOut)
async def update_feed_item(
    feed_id: int,
    payload: FeedCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить элемент ленты."""
    row = await db.fetchrow(
        """
        UPDATE home_feed
        SET kind = $2, title = $3, content = $4
        WHERE id = $1
        RETURNING id, kind, title, content, created_at
        """,
        feed_id,
        payload.kind,
        payload.title,
        payload.content,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return FeedOut(**dict(row))


class CommonSettings(BaseModel):
    discord_join_url: str
    maintenance_enabled: bool = False
    maintenance_message: Optional[str] = None


@router.get("/settings/common", response_model=CommonSettings)
async def get_admin_common_settings(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    row = await db.fetchrow("SELECT value FROM site_settings WHERE key = 'common'")
    if not row:
        return CommonSettings(
            discord_join_url="https://discord.gg/YgX4RQZ",
            maintenance_enabled=False,
            maintenance_message=None,
        )
    data = row["value"] or {}
    return CommonSettings(
        discord_join_url=data.get("discord_join_url", "https://discord.gg/YgX4RQZ"),
        maintenance_enabled=bool(data.get("maintenance_enabled", False)),
        maintenance_message=data.get("maintenance_message"),
    )


@router.put("/settings/common", response_model=CommonSettings)
async def update_common_settings(
    payload: CommonSettings,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    await db.execute(
        """
        INSERT INTO site_settings (key, value)
        VALUES ('common', $1)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        """,
        {
            "discord_join_url": payload.discord_join_url,
            "maintenance_enabled": payload.maintenance_enabled,
            "maintenance_message": payload.maintenance_message,
        },
    )
    return payload


