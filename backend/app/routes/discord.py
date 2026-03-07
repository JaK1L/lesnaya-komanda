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
            p.game_icon_url,
            p.custom_status,
            u.bio,
            u.created_at,
            u.joined_at
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
            game_icon_url=row["game_icon_url"],
            custom_status=row["custom_status"],
            bio=row["bio"],
            created_at=row["created_at"].isoformat() if row["created_at"] else None,
            joined_at=row["joined_at"].isoformat() if row["joined_at"] else None
        )
        for row in rows
    ]
    
    # Обновляем кэш
    _presence_cache = result
    _cache_timestamp = now
    
    return result


@router.get("/stats")
async def get_discord_stats(db: asyncpg.Connection = Depends(get_db)):
    """
    Получить статистику Discord сервера
    
    Returns:
        dict: Статистика сервера (всего участников, онлайн и т.д.)
    """
    # Получаем общее количество участников (уникальных discord_id в presence)
    total_row = await db.fetchrow("""
        SELECT COUNT(DISTINCT discord_id) as total
        FROM discord_presence
    """)
    
    # Получаем количество онлайн участников
    online_row = await db.fetchrow("""
        SELECT COUNT(DISTINCT discord_id) as online
        FROM discord_presence
        WHERE status IN ('online', 'idle', 'dnd')
    """)
    
    total_members = total_row["total"] if total_row else 0
    online_members = online_row["online"] if online_row else 0
    
    return {
        "total_members": total_members,
        "online_members": online_members,
        "activity_percent": round((online_members / total_members * 100) if total_members > 0 else 0)
    }


@router.get("/elite", response_model=List[dict])
async def get_elite_users(db: asyncpg.Connection = Depends(get_db)):
    """
    Получить пользователей с ролью "ПИТУХ" (элита леса)
    
    Возвращает список пользователей с ролью ПИТУХ, отсортированных по статусу (онлайн/оффлайн).
    Скрытые пользователи (is_hidden=true) исключаются из списка.
    
    Returns:
        List[dict]: Список элитных пользователей
    """
    rows = await db.fetch("""
        SELECT
            p.discord_id,
            COALESCE(u.discord_username, 'Unknown') AS discord_username,
            COALESCE(u.avatar_url, CONCAT('https://cdn.discordapp.com/embed/avatars/', (p.discord_id >> 22) % 6, '.png')) AS avatar_url,
            COALESCE(u.forest_rank, 'Волк') AS forest_rank,
            COALESCE(u.rating, 0) AS rating,
            u.last_seen,
            u.is_hidden,
            p.status,
            p.roles
        FROM discord_presence p
        LEFT JOIN users u ON u.discord_id = p.discord_id
        WHERE p.roles IS NOT NULL AND (u.is_hidden = false OR u.is_hidden IS NULL)
        ORDER BY 
            CASE WHEN p.status = 'online' THEN 1
                 WHEN p.status = 'idle' THEN 2
                 WHEN p.status = 'dnd' THEN 3
                 ELSE 4 END,
            COALESCE(u.rating, 0) DESC
    """)
    
    result = []
    for row in rows:
        # Парсим роли
        roles_data = row["roles"]
        if isinstance(roles_data, str):
            roles = json.loads(roles_data)
        else:
            roles = roles_data or []
        
        # Проверяем, есть ли роль "🐓ПИТУХ🐓"
        # Ищем роль, которая содержит эмодзи петуха (🐓) или точное название
        has_pituh = False
        for role in roles:
            role_name = role.get("name", "")
            # Проверяем наличие эмодзи петуха или слова ПИТУХ
            if "🐓" in role_name or role_name == "🐓ПИТУХ🐓":
                has_pituh = True
                break
        
        if has_pituh:
            result.append({
                "discord_id": row["discord_id"],
                "discord_username": row["discord_username"],
                "avatar_url": row["avatar_url"] or f"https://cdn.discordapp.com/embed/avatars/{(row['discord_id'] >> 22) % 6}.png",
                "forest_rank": row["forest_rank"],
                "rating": row["rating"],
                "last_seen": row["last_seen"].isoformat() if row["last_seen"] else None,
                "status": row["status"] or "offline",
                "is_online": row["status"] in ['online', 'idle', 'dnd'] if row["status"] else False
            })
    
    return result
