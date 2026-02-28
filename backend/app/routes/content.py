"""
Публичные маршруты контента (события, новости) для главной страницы.
"""
from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime

import asyncpg
from pydantic import BaseModel

from ..database import get_db


router = APIRouter()


class EventPublic(BaseModel):
    id: int
    title: str
    description: str
    game: Optional[str]
    event_date: Optional[datetime]


@router.get("/events", response_model=List[EventPublic])
async def list_public_events(db: asyncpg.Connection = Depends(get_db)):
    """
    Публичный список событий для сайта.
    Показываем ближайшие и прошедшие, отсортированные по дате.
    """
    rows = await db.fetch(
        """
        SELECT id, title, description, game, event_date
        FROM events
        ORDER BY event_date ASC NULLS LAST, id DESC
        """
    )
    return [EventPublic(**dict(row)) for row in rows]


class NewsPublic(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime


@router.get("/news", response_model=List[NewsPublic])
async def list_public_news(db: asyncpg.Connection = Depends(get_db)):
    """
    Публичный список новостей для сайта (только опубликованные).
    """
    rows = await db.fetch(
        """
        SELECT id, title, content, created_at
        FROM news
        WHERE published = true
        ORDER BY created_at DESC, id DESC
        """
    )
    return [NewsPublic(**dict(row)) for row in rows]


