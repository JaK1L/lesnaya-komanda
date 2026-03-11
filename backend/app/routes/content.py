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
    telegram_url: Optional[str] = None


@router.get("/events", response_model=List[EventPublic])
async def list_public_events(db: asyncpg.Connection = Depends(get_db)):
    """
    Публичный список событий для сайта.
    Показываем только активные события (не истекшие).
    """
    from fastapi import Response
    
    rows = await db.fetch(
        """
        SELECT id, title, description, game, event_date, telegram_url
        FROM events
        WHERE expires_at IS NULL OR expires_at > NOW()
        ORDER BY event_date ASC NULLS LAST, id DESC
        """
    )
    return [EventPublic(**dict(row)) for row in rows]


@router.get("/debug/database-info")
async def debug_database_info(db: asyncpg.Connection = Depends(get_db)):
    """
    Временный эндпоинт для отладки - показывает информацию о базе данных
    """
    db_info = await db.fetchrow("SELECT current_database(), current_user, version()")
    events = await db.fetch("SELECT id, title FROM events ORDER BY id")
    
    return {
        "database": db_info["current_database"],
        "user": db_info["current_user"],
        "version": db_info["version"],
        "events_count": len(events),
        "events": [{"id": e["id"], "title": e["title"]} for e in events]
    }


from ..services.twitch_service import twitch_service


class StreamerPublic(BaseModel):
    discord_id: int
    discord_username: str
    avatar_url: Optional[str]
    forest_rank: str
    is_online: Optional[bool] = False
    game: Optional[str] = None
    twitch_username: Optional[str] = None
    viewer_count: Optional[int] = 0
    stream_title: Optional[str] = None


@router.get("/streamers", response_model=List[StreamerPublic])
async def list_public_streamers(db: asyncpg.Connection = Depends(get_db)):
    """
    Публичный список стримеров для сайта.
    Показываем пользователей которые являются стримерами + данные с Twitch API.
    """
    try:
        rows = await db.fetch(
            """
            SELECT 
                discord_id,
                discord_username,
                avatar_url,
                forest_rank,
                twitch_username
            FROM users
            WHERE is_streamer = true
            ORDER BY rating DESC, id ASC
            LIMIT 10
            """
        )
    except Exception as e:
        # Если колонка is_streamer не существует, возвращаем пустой список
        print(f"Error fetching streamers: {e}")
        return []
    
    # Собираем Twitch usernames (парсим из URL если нужно)
    twitch_usernames = []
    for row in rows:
        twitch_url = row.get('twitch_username')
        if twitch_url:
            username = twitch_service.extract_username_from_url(twitch_url)
            if username:
                twitch_usernames.append(username)
    
    # Получаем данные о стримах с Twitch
    twitch_data = {}
    if twitch_usernames:
        twitch_data = await twitch_service.get_streams(twitch_usernames)
    
    # Формируем результат
    result = []
    for row in rows:
        twitch_url = row.get('twitch_username')
        twitch_username = twitch_service.extract_username_from_url(twitch_url) if twitch_url else None
        stream_info = twitch_data.get(twitch_username.lower()) if twitch_username else None
        
        streamer = StreamerPublic(
            discord_id=row['discord_id'],
            discord_username=row['discord_username'],
            avatar_url=row['avatar_url'],
            forest_rank=row['forest_rank'],
            twitch_username=twitch_username,
            is_online=stream_info is not None if stream_info else False,
            game=stream_info.get('game_name') if stream_info else None,
            viewer_count=stream_info.get('viewer_count', 0) if stream_info else 0,
            stream_title=stream_info.get('title') if stream_info else None
        )
        result.append(streamer)
    
    return result


class MerchPublic(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    image_url: Optional[str]
    category: Optional[str]
    sizes: Optional[str]


@router.get("/merch", response_model=List[MerchPublic])
async def list_public_merch(db: asyncpg.Connection = Depends(get_db)):
    """
    Публичный список товаров для магазина.
    Показываем только товары в наличии.
    """
    rows = await db.fetch(
        """
        SELECT id, name, description, price, image_url, category, sizes
        FROM merch
        WHERE in_stock = true
        ORDER BY display_order ASC, id ASC
        """
    )
    return [MerchPublic(**dict(row)) for row in rows]


class NewsPublic(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    created_at: datetime


@router.get("/news", response_model=List[NewsPublic])
async def list_public_news(db: asyncpg.Connection = Depends(get_db)):
    """
    Публичный список новостей для сайта (только опубликованные).
    """
    rows = await db.fetch(
        """
        SELECT id, title, content, image_url, created_at
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
    try:
        row = await db.fetchrow(
            "SELECT value FROM site_settings WHERE key = 'common'"
        )
        if not row:
            # значения по умолчанию
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
    except Exception as e:
        # Если таблица не существует или другая ошибка - возвращаем дефолт
        print(f"Error fetching settings: {e}")
        return CommonSettings(
            discord_join_url="https://discord.gg/YgX4RQZ",
            maintenance_enabled=False,
            maintenance_message=None,
        )




# News Reactions and Comments

from ..auth import get_current_user, get_optional_current_user, User

class NewsReactionsResponse(BaseModel):
    likes: int
    dislikes: int
    user_reaction: Optional[str] = None


@router.get("/news/{news_id}/reactions", response_model=NewsReactionsResponse)
async def get_news_reactions(
    news_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Получить количество лайков и дизлайков для новости
    """
    # Подсчитываем лайки и дизлайки
    likes = await db.fetchval(
        "SELECT COUNT(*) FROM news_reactions WHERE news_id = $1 AND reaction = 'like'",
        news_id
    ) or 0
    
    dislikes = await db.fetchval(
        "SELECT COUNT(*) FROM news_reactions WHERE news_id = $1 AND reaction = 'dislike'",
        news_id
    ) or 0
    
    # Проверяем реакцию текущего пользователя
    user_reaction = None
    if current_user:
        reaction_row = await db.fetchrow(
            "SELECT reaction FROM news_reactions WHERE news_id = $1 AND user_id = $2",
            news_id, current_user.id
        )
        if reaction_row:
            user_reaction = reaction_row['reaction']
    
    return NewsReactionsResponse(
        likes=likes,
        dislikes=dislikes,
        user_reaction=user_reaction
    )


class NewsReactionRequest(BaseModel):
    reaction: str  # 'like' or 'dislike'


@router.post("/news/{news_id}/react")
async def react_to_news(
    news_id: int,
    request: NewsReactionRequest,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Поставить лайк или дизлайк на новость
    """
    if request.reaction not in ['like', 'dislike']:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid reaction type")
    
    # Проверяем существует ли новость
    news_exists = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM news WHERE id = $1)",
        news_id
    )
    if not news_exists:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="News not found")
    
    # Проверяем текущую реакцию пользователя
    current_reaction = await db.fetchrow(
        "SELECT reaction FROM news_reactions WHERE news_id = $1 AND user_id = $2",
        news_id, current_user.id
    )
    
    if current_reaction:
        if current_reaction['reaction'] == request.reaction:
            # Убираем реакцию
            await db.execute(
                "DELETE FROM news_reactions WHERE news_id = $1 AND user_id = $2",
                news_id, current_user.id
            )
            return {"status": "removed", "reaction": request.reaction}
        else:
            # Меняем реакцию
            await db.execute(
                "UPDATE news_reactions SET reaction = $1 WHERE news_id = $2 AND user_id = $3",
                request.reaction, news_id, current_user.id
            )
            return {"status": "updated", "reaction": request.reaction}
    else:
        # Добавляем новую реакцию
        await db.execute(
            "INSERT INTO news_reactions (news_id, user_id, reaction) VALUES ($1, $2, $3)",
            news_id, current_user.id, request.reaction
        )
        return {"status": "added", "reaction": request.reaction}


class NewsComment(BaseModel):
    id: int
    user_name: str
    content: str
    created_at: datetime


@router.get("/news/{news_id}/comments", response_model=List[NewsComment])
async def get_news_comments(
    news_id: int,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Получить комментарии к новости
    """
    rows = await db.fetch(
        """
        SELECT 
            nc.id,
            COALESCE(u.discord_username, u.email) as user_name,
            nc.content,
            nc.created_at
        FROM news_comments nc
        JOIN users u ON nc.user_id = u.id
        WHERE nc.news_id = $1
        ORDER BY nc.created_at DESC
        """,
        news_id
    )
    
    return [NewsComment(**dict(row)) for row in rows]


class NewsCommentRequest(BaseModel):
    content: str


@router.post("/news/{news_id}/comments")
async def add_news_comment(
    news_id: int,
    request: NewsCommentRequest,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Добавить комментарий к новости
    """
    if not request.content or len(request.content.strip()) == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    
    if len(request.content) > 1000:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Comment is too long (max 1000 characters)")
    
    # Проверяем существует ли новость
    news_exists = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM news WHERE id = $1)",
        news_id
    )
    if not news_exists:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="News not found")
    
    # Добавляем комментарий
    comment_id = await db.fetchval(
        """
        INSERT INTO news_comments (news_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING id
        """,
        news_id, current_user.id, request.content.strip()
    )
    
    return {
        "status": "success",
        "comment_id": comment_id,
        "message": "Comment added successfully"
    }


# Team Members

class TeamMemberPublic(BaseModel):
    discord_id: int
    discord_username: str
    real_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    forest_rank: str
    team_role: Optional[str] = None
    twitch_username: Optional[str] = None
    telegram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    youtube_url: Optional[str] = None


@router.get("/team", response_model=List[TeamMemberPublic])
async def list_team_members(db: asyncpg.Connection = Depends(get_db)):
    """
    Публичный список членов команды для страницы /team
    """
    rows = await db.fetch(
        """
        SELECT 
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
            youtube_url
        FROM users
        WHERE is_team_member = true
        ORDER BY team_order ASC, discord_username ASC
        """
    )
    return [TeamMemberPublic(**dict(row)) for row in rows]
