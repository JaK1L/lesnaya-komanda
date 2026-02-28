"""
Публичные маршруты контента (события, новости) для главной страницы.
"""
from fastapi import APIRouter, Depends, Query
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


class FeedPublic(BaseModel):
    id: int
    kind: str
    title: str
    content: Optional[str]
    created_at: datetime


@router.get("/feed", response_model=List[FeedPublic])
async def list_public_feed(
    kind: Optional[str] = Query(None, description="post или achievement"),
    db: asyncpg.Connection = Depends(get_db),
):
    """
    Публичная лента: короткие посты и достижения для главной.
    """
    if kind:
        rows = await db.fetch(
            """
            SELECT id, kind, title, content, created_at
            FROM home_feed
            WHERE kind = $1
            ORDER BY created_at DESC, id DESC
            LIMIT 50
            """,
            kind,
        )
    else:
        rows = await db.fetch(
            """
            SELECT id, kind, title, content, created_at
            FROM home_feed
            ORDER BY created_at DESC, id DESC
            LIMIT 50
            """
        )
    return [FeedPublic(**dict(row)) for row in rows]


class CommonSettings(BaseModel):
    discord_join_url: str
    maintenance_enabled: bool = False
    maintenance_message: Optional[str] = None


@router.get("/settings/common", response_model=CommonSettings)
async def get_common_settings(db: asyncpg.Connection = Depends(get_db)):
    """
    Публичные общие настройки (ссылка на Discord, режим тех.работ).
    """
    row = await db.fetchrow(
        "SELECT value FROM site_settings WHERE key = 'common'"
    )
    if not row:
        # значения по умолчанию: локальная разработка
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


