"""
Маршруты для работы с пользователями
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import User, UserProfile, LeaderboardRequest, ActivityStatsRequest
from ..services.user_service import UserService
from ..auth import get_current_admin_user
import asyncpg

router = APIRouter()


@router.get("/", response_model=dict)
async def root():
    """Корневой эндпоинт"""
    return {"message": "🌲 Лесная Команда API", "status": "active"}


@router.get("/stats", response_model=dict)
async def get_stats(db: asyncpg.Connection = Depends(get_db)):
    """Сводная статистика для главной страницы: число участников, достижений, онлайн (пока 0)"""
    service = UserService(db)
    members = await db.fetchval("SELECT COUNT(*) FROM users")
    achievements = await db.fetchval("SELECT COUNT(*) FROM achievements")
    online = await service.get_discord_online_count()
    return {
        "members": members or 0,
        "online": online,
        "achievements": achievements or 0,
    }


@router.get("/discord/overview", response_model=dict)
async def discord_overview(db: asyncpg.Connection = Depends(get_db)):
    """Сводка по Discord: онлайн, кто во что играет, топы."""
    service = UserService(db)
    online = await service.get_discord_online_count()
    top_messages = await service.get_discord_top_messages(3)
    top_voice = await service.get_discord_top_voice(3)
    now_playing = await service.get_discord_now_playing(10)
    return {
        "online": online,
        "top_messages": top_messages,
        "top_voice": top_voice,
        "now_playing": now_playing,
    }


@router.get("/discord/top/messages", response_model=list)
async def discord_top_messages(
    limit: int = Query(default=3, ge=1, le=50),
    db: asyncpg.Connection = Depends(get_db),
):
    service = UserService(db)
    return await service.get_discord_top_messages(limit)


@router.get("/discord/top/voice", response_model=list)
async def discord_top_voice(
    limit: int = Query(default=3, ge=1, le=50),
    db: asyncpg.Connection = Depends(get_db),
):
    service = UserService(db)
    return await service.get_discord_top_voice(limit)


@router.get("/discord/now-playing", response_model=list)
async def discord_now_playing(
    limit: int = Query(default=10, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_db),
):
    service = UserService(db)
    return await service.get_discord_now_playing(limit)


@router.get("/players", response_model=List[dict])
async def get_players(
    limit: int = Query(default=50, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: asyncpg.Connection = Depends(get_db)
):
    """Получить список всех игроков"""
    service = UserService(db)
    try:
        players = await service.get_players(limit, offset)
        return players
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching players: {str(e)}")


@router.get("/players/{discord_id}", response_model=UserProfile)
async def get_player(discord_id: int, db: asyncpg.Connection = Depends(get_db)):
    """Получить профиль игрока по Discord ID"""
    service = UserService(db)
    try:
        player = await service.get_player_by_discord_id(discord_id)
        if not player:
            raise HTTPException(status_code=404, detail="Игрок не найден")
        return player
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching player: {str(e)}")


@router.get("/leaderboard")
async def get_leaderboard(
    request: LeaderboardRequest = Depends(),
    db: asyncpg.Connection = Depends(get_db)
):
    """Получить таблицу лидеров"""
    service = UserService(db)
    try:
        leaderboard = await service.get_leaderboard(request.game, request.limit)
        return leaderboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leaderboard: {str(e)}")


@router.get("/achievements")
async def get_achievements(
    user_id: Optional[int] = Query(None, description="Discord ID пользователя"),
    db: asyncpg.Connection = Depends(get_db)
):
    """Получить достижения"""
    service = UserService(db)
    try:
        achievements = await service.get_achievements(user_id)
        return achievements
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching achievements: {str(e)}")


@router.post("/update-rating")
async def update_ratings(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить рейтинги всех игроков (только для администраторов)"""
    service = UserService(db)
    try:
        updated_count = await service.update_ratings()
        return {"status": "ok", "updated": updated_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating ratings: {str(e)}")


@router.get("/stats/activity")
async def get_activity_stats(
    request: ActivityStatsRequest = Depends(),
    db: asyncpg.Connection = Depends(get_db)
):
    """Статистика активности по дням"""
    service = UserService(db)
    try:
        stats = await service.get_activity_stats(request.days)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity stats: {str(e)}")


@router.get("/stats/games")
async def get_game_stats(db: asyncpg.Connection = Depends(get_db)):
    """Статистика по играм"""
    service = UserService(db)
    try:
        stats = await service.get_game_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching game stats: {str(e)}")


@router.get("/events")
async def get_events(db: asyncpg.Connection = Depends(get_db)):
    """
    Список событий для блока «Что происходит в стае».

    Пока что возвращаем статический список мероприятий. В будущем
    можно вынести в отдельную таблицу events и админку.
    """
    # TODO: заменить на данные из таблицы events (см. init.sql)
    return [
        {
            "id": 1,
            "title": "CS2 КЛАТЧ-ТУРНИР",
            "description": "Собираем 5 команд для вечерних замесов",
            "game": "cs2",
            "event_date": None,
        },
        {
            "id": 2,
            "title": "DOTA 2 ИНХАУС",
            "description": "Играем 5х5, все уровни приветствуются",
            "game": "dota2",
            "event_date": None,
        },
        {
            "id": 3,
            "title": "VALORANT ТУРНИР",
            "description": "Приз — звание «Лесной Ас»",
            "game": "valorant",
            "event_date": None,
        },
    ]