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
    event_date: Optional[datetime] = None  # Может быть NULL в БД
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
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"list_events called: page={page}, limit={limit}, user={current_user.username}")
    
    offset = (page - 1) * limit
    
    logger.info(f"Fetching events from DB...")
    rows = await db.fetch(
        """
        SELECT id, title, description, game, event_date, created_by, participants, status, telegram_url, expires_at
        FROM events
        ORDER BY event_date DESC NULLS LAST, id DESC
        LIMIT $1 OFFSET $2
        """,
        limit, offset
    )
    logger.info(f"Fetched {len(rows)} events")
    
    total = await db.fetchval("SELECT COUNT(*) FROM events")
    logger.info(f"Total events: {total}")
    
    # Преобразуем participants из asyncpg array в list
    items = []
    for i, row in enumerate(rows):
        logger.info(f"Processing event {i+1}/{len(rows)}")
        row_dict = dict(row)
        logger.info(f"  Row data: {list(row_dict.keys())}")
        
        # Преобразуем participants в обычный список
        if row_dict.get('participants') is None:
            row_dict['participants'] = []
        else:
            row_dict['participants'] = list(row_dict['participants'])
        
        logger.info(f"  Creating EventOut model...")
        try:
            event = EventOut(**row_dict)
            items.append(event)
            logger.info(f"  ✅ Event {event.id} created successfully")
        except Exception as e:
            logger.error(f"  ❌ Error creating EventOut: {e}")
            logger.error(f"  Row dict: {row_dict}")
            raise
    
    logger.info(f"Creating paginated response...")
    result = PaginatedResponse.create(
        items=items,
        total=total,
        page=page,
        limit=limit
    )
    logger.info(f"✅ list_events completed successfully")
    return result


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
    if result == "DELETE 0":
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
    tags: List[str] = Field(default_factory=list)
    
    @field_validator('image_url', mode='before')
    @classmethod
    def validate_image(cls, v):
        return validate_url(v) if v else None
    
    @field_validator('tags', mode='before')
    @classmethod
    def validate_tags(cls, v):
        if v is None:
            return []
        # Ограничиваем количество тегов и их длину
        tags = [tag.strip() for tag in v if tag.strip()][:10]
        return [tag[:30] for tag in tags]


class NewsOut(NewsCreate):
    id: int
    author_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    image_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


@router.get("/news", response_model=List[NewsOut])
async def list_news(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех новостей (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, title, content, image_url, author_id, published, created_at, updated_at, tags
        FROM news
        ORDER BY created_at DESC, id DESC
        """
    )
    result = []
    for row in rows:
        row_dict = dict(row)
        # Преобразуем tags из asyncpg array в list
        if row_dict.get('tags') is None:
            row_dict['tags'] = []
        else:
            row_dict['tags'] = list(row_dict['tags'])
        result.append(NewsOut(**row_dict))
    return result


@router.post("/news", response_model=NewsOut)
async def create_news(
    payload: NewsCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать новость."""
    row = await db.fetchrow(
        """
        INSERT INTO news (title, content, image_url, author_id, published, tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, content, image_url, author_id, published, created_at, updated_at, tags
        """,
        payload.title,
        payload.content,
        payload.image_url,
        current_user.id,
        payload.published,
        payload.tags,
    )
    if not row:
        raise HTTPException(status_code=500, detail="Не удалось создать новость")
    row_dict = dict(row)
    if row_dict.get('tags') is None:
        row_dict['tags'] = []
    else:
        row_dict['tags'] = list(row_dict['tags'])
    return NewsOut(**row_dict)


@router.delete("/news/{news_id}", response_model=dict)
async def delete_news(
    news_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить новость."""
    result = await db.execute("DELETE FROM news WHERE id = $1", news_id)
    if result == "DELETE 0":
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
        SET title = $2, content = $3, image_url = $4, published = $5, tags = $6, updated_at = NOW()
        WHERE id = $1
        RETURNING id, title, content, image_url, author_id, published, created_at, updated_at, tags
        """,
        news_id,
        payload.title,
        payload.content,
        payload.image_url,
        payload.published,
        payload.tags,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    row_dict = dict(row)
    if row_dict.get('tags') is None:
        row_dict['tags'] = []
    else:
        row_dict['tags'] = list(row_dict['tags'])
    return NewsOut(**row_dict)


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
    if result == "DELETE 0":
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
    twitch_url: str = Field(..., max_length=500, description="Ссылка на Twitch канал (например: https://twitch.tv/username)")
    is_active: bool = True
    display_order: int = 0


class StreamerOut(BaseModel):
    id: int
    twitch_username: str
    display_name: str
    avatar_url: Optional[str]
    description: Optional[str]
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
    # Live данные (если онлайн)
    is_live: bool = False
    game_name: Optional[str] = None
    stream_title: Optional[str] = None
    viewer_count: int = 0


@router.get("/streamers", response_model=List[StreamerOut])
async def list_streamers(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех стримеров (для админки) с актуальными данными из Twitch API."""
    from ..services.twitch_service import twitch_service
    
    rows = await db.fetch(
        """
        SELECT id, twitch_username, display_name, avatar_url, description, 
               is_active, display_order, created_at, updated_at
        FROM streamers
        ORDER BY display_order ASC, id DESC
        """
    )
    
    if not rows:
        return []
    
    # Получаем актуальные данные о стримах
    usernames = [row['twitch_username'] for row in rows]
    streams_data = await twitch_service.get_streams(usernames)
    
    result = []
    for row in rows:
        username = row['twitch_username'].lower()
        stream_info = streams_data.get(username)
        
        streamer = StreamerOut(
            id=row['id'],
            twitch_username=row['twitch_username'],
            display_name=row['display_name'],
            avatar_url=row['avatar_url'],
            description=row['description'],
            is_active=row['is_active'],
            display_order=row['display_order'],
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            is_live=stream_info is not None if stream_info else False,
            game_name=stream_info.get('game_name') if stream_info else None,
            stream_title=stream_info.get('title') if stream_info else None,
            viewer_count=stream_info.get('viewer_count', 0) if stream_info else 0
        )
        result.append(streamer)
    
    return result


@router.post("/streamers", response_model=StreamerOut)
async def create_streamer(
    payload: StreamerCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать стримера - автоматически получает данные из Twitch API."""
    from ..services.twitch_service import twitch_service
    
    # Извлекаем username из URL
    username = twitch_service.extract_username_from_url(payload.twitch_url)
    if not username:
        raise HTTPException(status_code=400, detail="Неверная ссылка на Twitch канал")
    
    # Получаем полную информацию о стримере из Twitch API
    streamer_info = await twitch_service.get_full_streamer_info(payload.twitch_url)
    if not streamer_info:
        raise HTTPException(status_code=404, detail="Стример не найден на Twitch")
    
    # Проверяем, не добавлен ли уже этот стример
    existing = await db.fetchval(
        "SELECT id FROM streamers WHERE LOWER(twitch_username) = LOWER($1)",
        streamer_info['username']
    )
    if existing:
        raise HTTPException(status_code=400, detail="Этот стример уже добавлен")
    
    # Сохраняем в базу
    row = await db.fetchrow(
        """
        INSERT INTO streamers (twitch_username, display_name, avatar_url, description, is_active, display_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, twitch_username, display_name, avatar_url, description, is_active, display_order, created_at, updated_at
        """,
        streamer_info['username'],
        streamer_info['display_name'],
        streamer_info['avatar_url'],
        streamer_info['description'],
        payload.is_active,
        payload.display_order,
    )
    
    if not row:
        raise HTTPException(status_code=500, detail="Не удалось создать стримера")
    
    return StreamerOut(
        **dict(row),
        is_live=streamer_info.get('is_live', False),
        game_name=streamer_info.get('game'),
        stream_title=streamer_info.get('stream_title'),
        viewer_count=streamer_info.get('viewer_count', 0)
    )


@router.put("/streamers/{streamer_id}", response_model=StreamerOut)
async def update_streamer(
    streamer_id: int,
    payload: StreamerCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить стримера - обновляет данные из Twitch API."""
    from ..services.twitch_service import twitch_service
    
    # Извлекаем username из URL
    username = twitch_service.extract_username_from_url(payload.twitch_url)
    if not username:
        raise HTTPException(status_code=400, detail="Неверная ссылка на Twitch канал")
    
    # Получаем полную информацию о стримере из Twitch API
    streamer_info = await twitch_service.get_full_streamer_info(payload.twitch_url)
    if not streamer_info:
        raise HTTPException(status_code=404, detail="Стример не найден на Twitch")
    
    # Обновляем в базе
    row = await db.fetchrow(
        """
        UPDATE streamers
        SET twitch_username = $2, display_name = $3, avatar_url = $4, description = $5,
            is_active = $6, display_order = $7, updated_at = NOW()
        WHERE id = $1
        RETURNING id, twitch_username, display_name, avatar_url, description, is_active, display_order, created_at, updated_at
        """,
        streamer_id,
        streamer_info['username'],
        streamer_info['display_name'],
        streamer_info['avatar_url'],
        streamer_info['description'],
        payload.is_active,
        payload.display_order,
    )
    
    if not row:
        raise HTTPException(status_code=404, detail="Стример не найден")
    
    return StreamerOut(
        **dict(row),
        is_live=streamer_info.get('is_live', False),
        game_name=streamer_info.get('game'),
        stream_title=streamer_info.get('stream_title'),
        viewer_count=streamer_info.get('viewer_count', 0)
    )


@router.delete("/streamers/{streamer_id}", response_model=dict)
async def delete_streamer(
    streamer_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить стримера."""
    result = await db.execute("DELETE FROM streamers WHERE id = $1", streamer_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Стример не найден")
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
    discord_id: Optional[int] = None
    discord_username: Optional[str] = None
    forest_rank: str
    rating: float
    avatar_url: Optional[str] = None
    site_nickname: Optional[str] = None
    joined_at: Optional[datetime] = None
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


# Team Members Management

class TeamMemberUpdate(BaseModel):
    discord_id: Optional[int] = None
    real_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    team_role: Optional[str] = Field(None, max_length=100)
    telegram_url: Optional[str] = Field(None, max_length=200)
    tiktok_url: Optional[str] = Field(None, max_length=200)
    youtube_url: Optional[str] = Field(None, max_length=200)
    is_team_member: bool = True
    team_order: int = Field(default=0, ge=0)


class TeamMemberResponse(BaseModel):
    id: int
    discord_id: Optional[int] = None
    discord_username: Optional[str] = None
    real_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    forest_rank: str
    team_role: Optional[str] = None
    twitch_username: Optional[str] = None
    telegram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    youtube_url: Optional[str] = None
    is_team_member: bool
    team_order: int


@router.get("/team", response_model=List[TeamMemberResponse])
async def get_team_members(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Получить список всех членов команды (для админки)"""
    rows = await db.fetch(
        """
        SELECT
            id,
            discord_id,
            discord_username,
            real_name,
            avatar_url,
            bio,
            forest_rank,
            team_role,
            twitch_username,
            telegram_url,
            tiktok_url,
            youtube_url,
            COALESCE(is_team_member, false) as is_team_member,
            COALESCE(team_order, 0) as team_order
        FROM users
        WHERE is_team_member = true
        ORDER BY team_order ASC, discord_username ASC
        """
    )
    return [TeamMemberResponse(**dict(row)) for row in rows]


@router.put("/team/{user_id}")
async def update_team_member(
    user_id: int,
    data: TeamMemberUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить информацию о члене команды"""

    user_exists = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)",
        user_id
    )

    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")

    await db.execute(
        """
        UPDATE users SET
            real_name = $1,
            bio = $2,
            team_role = $3,
            telegram_url = $4,
            tiktok_url = $5,
            youtube_url = $6,
            is_team_member = $7,
            team_order = $8
        WHERE id = $9
        """,
        data.real_name,
        data.bio,
        data.team_role,
        data.telegram_url,
        data.tiktok_url,
        data.youtube_url,
        data.is_team_member,
        data.team_order,
        user_id
    )

    return {"status": "success", "message": "Team member updated"}


@router.delete("/team/{user_id}")
async def remove_team_member(
    user_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Убрать пользователя из команды"""

    await db.execute(
        """
        UPDATE users SET
            is_team_member = false,
            team_order = 0
        WHERE id = $1
        """,
        user_id
    )

    return {"status": "success", "message": "User removed from team"}


@router.get("/users/search")
async def search_users(
    q: str = Query(..., min_length=2),
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Поиск пользователей для добавления в команду"""
    rows = await db.fetch(
        """
        SELECT
            id,
            discord_id,
            discord_username,
            avatar_url,
            forest_rank,
            COALESCE(is_team_member, false) as is_team_member
        FROM users
        WHERE discord_username ILIKE $1
        ORDER BY discord_username ASC
        LIMIT 20
        """,
        f"%{q}%"
    )
    
    return [dict(row) for row in rows]


# Merch Management

class MerchItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: float = Field(..., gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    sizes: Optional[str] = Field(None, max_length=100)
    in_stock: bool = True
    display_order: int = Field(default=0, ge=0)


class MerchItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    sizes: Optional[str] = Field(None, max_length=100)
    in_stock: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)


class MerchItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    image_url: Optional[str]
    category: Optional[str]
    sizes: Optional[str]
    in_stock: bool
    display_order: int


@router.get("/merch", response_model=List[MerchItemResponse])
async def get_merch_items(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Получить все товары (для админки)"""
    rows = await db.fetch(
        """
        SELECT id, name, description, price, image_url, category, sizes, in_stock, display_order
        FROM merch
        ORDER BY display_order ASC, id ASC
        """
    )
    return [MerchItemResponse(**dict(row)) for row in rows]


@router.post("/merch")
async def create_merch_item(
    data: MerchItemCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать новый товар"""
    item_id = await db.fetchval(
        """
        INSERT INTO merch (name, description, price, image_url, category, sizes, in_stock, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        """,
        data.name,
        data.description,
        data.price,
        data.image_url,
        data.category,
        data.sizes,
        data.in_stock,
        data.display_order
    )
    
    return {"status": "success", "id": item_id, "message": "Merch item created"}


@router.put("/merch/{item_id}")
async def update_merch_item(
    item_id: int,
    data: MerchItemUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить товар"""
    
    # Проверяем существует ли товар
    item_exists = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM merch WHERE id = $1)",
        item_id
    )
    
    if not item_exists:
        raise HTTPException(status_code=404, detail="Merch item not found")
    
    # Формируем запрос обновления только для переданных полей
    update_fields = []
    values = []
    param_count = 1
    
    if data.name is not None:
        update_fields.append(f"name = ${param_count}")
        values.append(data.name)
        param_count += 1
    
    if data.description is not None:
        update_fields.append(f"description = ${param_count}")
        values.append(data.description)
        param_count += 1
    
    if data.price is not None:
        update_fields.append(f"price = ${param_count}")
        values.append(data.price)
        param_count += 1
    
    if data.image_url is not None:
        update_fields.append(f"image_url = ${param_count}")
        values.append(data.image_url)
        param_count += 1
    
    if data.category is not None:
        update_fields.append(f"category = ${param_count}")
        values.append(data.category)
        param_count += 1
    
    if data.sizes is not None:
        update_fields.append(f"sizes = ${param_count}")
        values.append(data.sizes)
        param_count += 1
    
    if data.in_stock is not None:
        update_fields.append(f"in_stock = ${param_count}")
        values.append(data.in_stock)
        param_count += 1
    
    if data.display_order is not None:
        update_fields.append(f"display_order = ${param_count}")
        values.append(data.display_order)
        param_count += 1
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    values.append(item_id)
    query = f"UPDATE merch SET {', '.join(update_fields)} WHERE id = ${param_count}"
    
    await db.execute(query, *values)
    
    return {"status": "success", "message": "Merch item updated"}


@router.delete("/merch/{item_id}")
async def delete_merch_item(
    item_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить товар"""
    
    result = await db.execute(
        "DELETE FROM merch WHERE id = $1",
        item_id
    )
    
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Merch item not found")

    return {"status": "success", "message": "Merch item deleted"}


# ─── Roles ────────────────────────────────────────────────────────────────────

class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#99aab5", pattern=r"^#[0-9a-fA-F]{6}$")


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


class RoleOut(BaseModel):
    id: int
    name: str
    color: str


@router.get("/roles", response_model=List[RoleOut])
async def list_roles(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    rows = await db.fetch("SELECT id, name, color FROM roles ORDER BY name")
    return [dict(r) for r in rows]


@router.post("/roles", response_model=RoleOut, status_code=201)
async def create_role(
    data: RoleCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    try:
        row = await db.fetchrow(
            "INSERT INTO roles (name, color) VALUES ($1, $2) RETURNING id, name, color",
            data.name, data.color
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Role with this name already exists")
    return dict(row)


@router.put("/roles/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: int,
    data: RoleUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    fields, vals = [], []
    if data.name is not None:
        fields.append(f"name = ${len(vals)+1}"); vals.append(data.name)
    if data.color is not None:
        fields.append(f"color = ${len(vals)+1}"); vals.append(data.color)
    if not fields:
        raise HTTPException(status_code=400, detail="Nothing to update")
    vals.append(role_id)
    row = await db.fetchrow(
        f"UPDATE roles SET {', '.join(fields)} WHERE id = ${len(vals)} RETURNING id, name, color",
        *vals
    )
    if not row:
        raise HTTPException(status_code=404, detail="Role not found")
    return dict(row)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    result = await db.execute("DELETE FROM roles WHERE id = $1", role_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Role not found")
    return {"status": "success"}


@router.post("/users/{user_id}/roles/{role_id}", status_code=201)
async def assign_role(
    user_id: int,
    role_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    user_exists = await db.fetchval("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", user_id)
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")
    role_exists = await db.fetchval("SELECT EXISTS(SELECT 1 FROM roles WHERE id = $1)", role_id)
    if not role_exists:
        raise HTTPException(status_code=404, detail="Role not found")
    await db.execute(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        user_id, role_id
    )
    return {"status": "success"}


@router.delete("/users/{user_id}/roles/{role_id}")
async def remove_role(
    user_id: int,
    role_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    await db.execute(
        "DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2",
        user_id, role_id
    )
    return {"status": "success"}


@router.get("/users/{user_id}/roles", response_model=List[RoleOut])
async def get_user_roles(
    user_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(get_current_admin_user),
):
    rows = await db.fetch(
        "SELECT r.id, r.name, r.color FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1 ORDER BY r.name",
        user_id
    )
    return [dict(r) for r in rows]
