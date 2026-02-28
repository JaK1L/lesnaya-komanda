"""
REST API endpoints для Discord данных
"""
from fastapi import APIRouter, Depends
import asyncpg
import json
from typing import List, Optional
from datetime import datetime, timedelta
from ..models.websocket_messages import ActivityData, RoleData
from ..database import get_db

router = APIRouter(prefix="/api/discord", tags=["discord"])

# Кэш для данных присутствия
_presence_cache: Optional[List[ActivityData]] = None
_cache_timestamp: Optional[datetime] = None
CACHE_TTL_SECONDS = 5


@router.get("/presence", response_model=List[ActivityData])
async def get_presence_data(db: asyncpg.Connection = Depends(get_db)):
    """
    Получить текущие данные присутствия всех пользователей
    
    Возвращает список пользователей с их статусами, активностями и ролями.
    Кэшируется на 5 секунд для снижения нагрузки на БД.
    
    Returns:
        List[ActivityData]: Список данных активности пользователей
    """
    global _presence_cache, _cache_timestamp
    
    # Проверяем кэш
    now = datetime.now()
    if _presence_cache is not None and _cache_timestamp is not None:
        cache_age = (now - _cache_timestamp).total_seconds()
        if cache_age < CACHE_TTL_SECONDS:
            return _presence_cache
    
    # Получаем данные из БД
    rows = await db.fetch("""
        SELECT
            p.discord_id,
            COALESCE(u.discord_username, 'Unknown') AS username,
            COALESCE(u.avatar_url, CONCAT('https://cdn.discordapp.com/embed/avatars/', (p.discord_id >> 22) % 6, '.png')) AS avatar_url,
            p.activity_name as game,
            p.status,
            p.roles,
            p.activity_started_at,
            p.game_icon_url
        FROM discord_presence p
        LEFT JOIN users u ON u.discord_id = p.discord_id
        WHERE p.status IS NOT NULL AND p.status <> 'offline'
        ORDER BY p.updated_at DESC
        LIMIT 50
    """)
    
    # Преобразуем в модели
    result = [
        ActivityData(
            user_id=str(row["discord_id"]),
            username=row["username"],
            avatar_url=row["avatar_url"],
            game=row["game"],
            status=row["status"],
            roles=[RoleData(**r) for r in (json.loads(row["roles"]) if isinstance(row["roles"], str) else (row["roles"] or []))],
            activity_started_at=row["activity_started_at"].isoformat() if row["activity_started_at"] else None,
            game_icon_url=row["game_icon_url"]
        )
        for row in rows
    ]
    
    # Обновляем кэш
    _presence_cache = result
    _cache_timestamp = now
    
    return result
