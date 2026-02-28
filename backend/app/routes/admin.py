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
        SELECT id, title, description, game, event_date, created_by, participants
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
        INSERT INTO events (title, description, game, event_date, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, description, game, event_date, created_by, participants
        """,
        payload.title,
        payload.description,
        payload.game,
        payload.event_date,
        current_user.id,
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


