"""
Админские маршруты для управления контентом (событиями и новостями).
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import List, Optional
from datetime import datetime

import asyncpg
from pydantic import BaseModel, Field, field_validator

from ..database import get_db
from ..auth import get_current_admin_user
from ..models import User
from ..pagination import PaginatedResponse
from ..rate_limit import limiter
from ..validation import ContentValidationMixin, validate_url, validate_telegram_url


router = APIRouter(prefix="/admin", tags=["admin"])


# Статистика для админ-панели
@router.get("/stats")
async def get_admin_stats(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Получить статистику для главной страницы админки."""
    
    # Подсчет новостей
    news_count = await db.fetchval("SELECT COUNT(*) FROM news")
    news_published = await db.fetchval("SELECT COUNT(*) FROM news WHERE published = true")
    
    # Подсчет событий
    events_count = await db.fetchval("SELECT COUNT(*) FROM events")
    events_upcoming = await db.fetchval(
        "SELECT COUNT(*) FROM events WHERE event_date > NOW() OR event_date IS NULL"
    )
    
    # Подсчет записей ленты
    feed_count = await db.fetchval("SELECT COUNT(*) FROM home_feed")
    
    # Подсчет пользователей
    users_count = await db.fetchval("SELECT COUNT(*) FROM users")
    users_online = await db.fetchval(
        "SELECT COUNT(*) FROM discord_presence WHERE status IN ('online', 'idle', 'dnd')"
    )
    
    # Подсчет стримеров
    streamers_count = await db.fetchval("SELECT COUNT(*) FROM streamers")
    streamers_active = await db.fetchval("SELECT COUNT(*) FROM streamers WHERE is_active = true")
    
    # Подсчет товаров
    merch_count = await db.fetchval("SELECT COUNT(*) FROM merch")
    merch_in_stock = await db.fetchval("SELECT COUNT(*) FROM merch WHERE in_stock = true")
    
    return {
        "news": {
            "total": news_count or 0,
            "published": news_published or 0,
        },
        "events": {
            "total": events_count or 0,
            "upcoming": events_upcoming or 0,
        },
        "feed": {
            "total": feed_count or 0,
        },
        "users": {
            "total": users_count or 0,
            "online": users_online or 0,
        },
        "streamers": {
            "total": streamers_count or 0,
            "active": streamers_active or 0,
        },
        "merch": {
            "total": merch_count or 0,
            "in_stock": merch_in_stock or 0,
        },
    }


class EventCreate(BaseModel, ContentValidationMixin):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=2000)
    game: Optional[str] = Field(default="Общее", max_length=50)
    event_date: datetime
    status: str = Field(default="Планируется", max_length=30)
    telegram_url: Optional[str] = Field(None, max_length=500)
    expires_at: Optional[datetime] = Field(None, description="Дата и время когда событие автоматически скрывается")
    
    @field_validator('telegram_url', mode='before')
    @classmethod
    def validate_telegram(cls, v):
        return validate_telegram_url(v) if v else None


class EventOut(EventCreate):
    id: int
    created_by: Optional[int]
    participants: List[int] = []
    telegram_url: Optional[str] = None
    expires_at: Optional[datetime] = None


@router.get("/events")
async def list_events(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех событий с пагинацией (для админки)."""
    offset = (page - 1) * limit
    
    rows = await db.fetch(
        """
        SELECT id, title, description, game, event_date, created_by, participants, status, telegram_url, expires_at
        FROM events
        ORDER BY event_date DESC NULLS LAST, id DESC
        LIMIT $1 OFFSET $2
        """,
        limit, offset
    )
    
    total = await db.fetchval("SELECT COUNT(*) FROM events")
    
    return PaginatedResponse.create(
        items=[EventOut(**dict(row)) for row in rows],
        total=total,
        page=page,
        limit=limit
    )


@router.post("/events", response_model=EventOut)
async def create_event(
    payload: EventCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать новое событие."""
    row = await db.fetchrow(
        """
        INSERT INTO events (title, description, game, event_date, created_by, status, telegram_url, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title, description, game, event_date, created_by, participants, status, telegram_url, expires_at
        """,
        payload.title,
        payload.description,
        payload.game,
        payload.event_date,
        current_user.id,
        payload.status,
        payload.telegram_url,
        payload.expires_at,
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
        SET title = $2, description = $3, game = $4, event_date = $5, status = $6, telegram_url = $7, expires_at = $8
        WHERE id = $1
        RETURNING id, title, description, game, event_date, created_by, participants, status, telegram_url, expires_at
        """,
        event_id,
        payload.title,
        payload.description,
        payload.game,
        payload.event_date,
        payload.status,
        payload.telegram_url,
        payload.expires_at,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    return EventOut(**dict(row))
    
class NewsCreate(BaseModel, ContentValidationMixin):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=5000)
    image_url: Optional[str] = Field(None, max_length=500)
    published: bool = True
    
    @field_validator('image_url', mode='before')
    @classmethod
    def validate_image(cls, v):
        return validate_url(v) if v else None


class NewsOut(NewsCreate):
    id: int
    author_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    image_url: Optional[str] = None


@router.get("/news", response_model=List[NewsOut])
async def list_news(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех новостей (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, title, content, image_url, author_id, published, created_at, updated_at
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
        INSERT INTO news (title, content, image_url, author_id, published)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, content, image_url, author_id, published, created_at, updated_at
        """,
        payload.title,
        payload.content,
        payload.image_url,
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
        SET title = $2, content = $3, image_url = $4, published = $5, updated_at = NOW()
        WHERE id = $1
        RETURNING id, title, content, image_url, author_id, published, created_at, updated_at
        """,
        news_id,
        payload.title,
        payload.content,
        payload.image_url,
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


# ============================================
# СТРИМЕРЫ
# ============================================

# ============================================
# СТРИМЕРЫ
# ============================================

class StreamerCreate(BaseModel):
    name: str = Field(..., max_length=100)
    game: Optional[str] = Field(None, max_length=200)
    avatar_url: Optional[str] = Field(None, max_length=500)
    platform: str = Field(default="twitch", max_length=20)
    stream_url: str = Field(..., max_length=500)
    schedule: Optional[str] = Field(None, max_length=200)
    is_active: bool = True
    display_order: int = 0


class StreamerOut(StreamerCreate):
    id: int
    created_at: datetime
    updated_at: datetime


@router.get("/streamers", response_model=List[StreamerOut])
async def list_streamers(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех стримеров (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, name, game, avatar_url, platform, stream_url, schedule, is_active, display_order, created_at, updated_at
        FROM streamers
        ORDER BY display_order ASC, id DESC
        """
    )
    return [StreamerOut(**dict(row)) for row in rows]


@router.post("/streamers", response_model=StreamerOut)
async def create_streamer(
    payload: StreamerCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать стримера."""
    row = await db.fetchrow(
        """
        INSERT INTO streamers (name, game, avatar_url, platform, stream_url, schedule, is_active, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, game, avatar_url, platform, stream_url, schedule, is_active, display_order, created_at, updated_at
        """,
        payload.name,
        payload.game,
        payload.avatar_url,
        payload.platform,
        payload.stream_url,
        payload.schedule,
        payload.is_active,
        payload.display_order,
    )
    if not row:
        raise HTTPException(status_code=500, detail="Не удалось создать стримера")
    return StreamerOut(**dict(row))


@router.put("/streamers/{streamer_id}", response_model=StreamerOut)
async def update_streamer(
    streamer_id: int,
    payload: StreamerCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить стримера."""
    row = await db.fetchrow(
        """
        UPDATE streamers
        SET name = $2, game = $3, avatar_url = $4, platform = $5, stream_url = $6, 
            schedule = $7, is_active = $8, display_order = $9, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, game, avatar_url, platform, stream_url, schedule, is_active, display_order, created_at, updated_at
        """,
        streamer_id,
        payload.name,
        payload.game,
        payload.avatar_url,
        payload.platform,
        payload.stream_url,
        payload.schedule,
        payload.is_active,
        payload.display_order,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Стример не найден")
    return StreamerOut(**dict(row))


@router.delete("/streamers/{streamer_id}", response_model=dict)
async def delete_streamer(
    streamer_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить стримера."""
    result = await db.execute("DELETE FROM streamers WHERE id = $1", streamer_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Стример не найден")
    return {"status": "ok"}


# ============================================
# МЕРЧ (ТОВАРЫ)
# ============================================

class MerchCreate(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    sizes: Optional[str] = Field(None, max_length=200)
    in_stock: bool = True
    display_order: int = 0


class MerchOut(MerchCreate):
    id: int
    created_at: datetime
    updated_at: datetime


@router.get("/merch", response_model=List[MerchOut])
async def list_merch(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех товаров (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, name, description, price, image_url, category, sizes, in_stock, display_order, created_at, updated_at
        FROM merch
        ORDER BY display_order ASC, id DESC
        """
    )
    return [MerchOut(**dict(row)) for row in rows]


@router.post("/merch", response_model=MerchOut)
async def create_merch(
    payload: MerchCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать товар."""
    row = await db.fetchrow(
        """
        INSERT INTO merch (name, description, price, image_url, category, sizes, in_stock, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, description, price, image_url, category, sizes, in_stock, display_order, created_at, updated_at
        """,
        payload.name,
        payload.description,
        payload.price,
        payload.image_url,
        payload.category,
        payload.sizes,
        payload.in_stock,
        payload.display_order,
    )
    if not row:
        raise HTTPException(status_code=500, detail="Не удалось создать товар")
    return MerchOut(**dict(row))


@router.put("/merch/{merch_id}", response_model=MerchOut)
async def update_merch(
    merch_id: int,
    payload: MerchCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить товар."""
    row = await db.fetchrow(
        """
        UPDATE merch
        SET name = $2, description = $3, price = $4, image_url = $5, category = $6,
            sizes = $7, in_stock = $8, display_order = $9, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, description, price, image_url, category, sizes, in_stock, display_order, created_at, updated_at
        """,
        merch_id,
        payload.name,
        payload.description,
        payload.price,
        payload.image_url,
        payload.category,
        payload.sizes,
        payload.in_stock,
        payload.display_order,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return MerchOut(**dict(row))


@router.delete("/merch/{merch_id}", response_model=dict)
async def delete_merch(
    merch_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить товар."""
    result = await db.execute("DELETE FROM merch WHERE id = $1", merch_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Товар не найден")
    return {"status": "ok"}


# ============================================
# НАСТРОЙКИ
# ============================================

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
    
    # Парсим value если это строка JSON
    data = row["value"]
    if isinstance(data, str):
        import json
        data = json.loads(data)
    
    if not data:
        data = {}
        
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




# Управление пользователями
class UserUpdate(BaseModel):
    forest_rank: Optional[str] = None
    rating: Optional[float] = None


class UserOut(BaseModel):
    id: int
    discord_id: int
    discord_username: str
    forest_rank: str
    rating: float
    avatar_url: Optional[str]
    site_nickname: Optional[str]
    joined_at: Optional[datetime]
    last_seen: datetime


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(50, ge=1, le=100, description="Элементов на странице (макс 100)"),
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Получить список всех пользователей с пагинацией (только для админов)."""
    offset = (page - 1) * limit
    
    rows = await db.fetch(
        """
        SELECT id, discord_id, discord_username, forest_rank, rating, 
               avatar_url, site_nickname, joined_at, last_seen
        FROM users
        ORDER BY last_seen DESC, id DESC
        LIMIT $1 OFFSET $2
        """,
        limit, offset
    )
    
    total = await db.fetchval("SELECT COUNT(*) FROM users")
    
    return PaginatedResponse.create(
        items=[UserOut(**dict(row)) for row in rows],
        total=total,
        page=page,
        limit=limit
    )


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить данные пользователя (только для админов)."""
    
    # Проверяем существует ли пользователь
    user = await db.fetchrow("SELECT id FROM users WHERE id = $1", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Обновляем данные
    update_fields = []
    values = []
    param_count = 1
    
    if payload.forest_rank is not None:
        update_fields.append(f"forest_rank = ${param_count}")
        values.append(payload.forest_rank)
        param_count += 1
    
    if payload.rating is not None:
        update_fields.append(f"rating = ${param_count}")
        values.append(payload.rating)
        param_count += 1
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="Нет данных для обновления")
    
    values.append(user_id)
    query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ${param_count}"
    
    await db.execute(query, *values)
    
    return {"message": "Пользователь обновлен"}
