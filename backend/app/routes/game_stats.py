"""
API для получения игровой статистики
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import asyncpg
from pydantic import BaseModel, Field
import logging

from ..database import get_db
from ..auth import get_current_user
from ..models import User
from ..services.game_api_service import game_api_service
from ..services.game_profiles_service import (
    PROFILE_KEY_TO_GAME,
    normalize_game_profile_input,
    serialize_game_profile_row,
    validate_profile_key,
)
from ..services.user_identity import resolve_user_by_identifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/game-stats", tags=["game_stats"])


async def _build_game_stats_payload(accounts) -> dict:
    result: dict = {}

    for account in accounts:
        game = account["game"]
        account_id = account["account_id"]

        try:
            if game == "steam":
                profile = await game_api_service.get_steam_profile(account_id)
                cs2_stats = await game_api_service.get_cs2_stats(account_id)
                faceit = await game_api_service.get_faceit_cs2_data(account_id)
                if cs2_stats:
                    matches_played = int(cs2_stats.get("matches_played") or 0)
                    wins = int(cs2_stats.get("wins") or 0)
                    cs2_stats["losses"] = max(matches_played - wins, 0)
                result["steam"] = {
                    "profile": profile,
                    "cs2_stats": cs2_stats,
                    "match_history": [],
                    "faceit": faceit,
                }

            elif game == "dota2":
                profile = await game_api_service.get_dota2_profile(account_id)
                stats = await game_api_service.get_dota2_stats(account_id)
                recent_matches = await game_api_service.get_dota2_recent_matches(account_id, 5) or []

                average_kd = None
                if recent_matches:
                    total_kills = sum(int(match.get("kills") or 0) for match in recent_matches)
                    total_deaths = sum(int(match.get("deaths") or 0) for match in recent_matches)
                    average_kd = round(total_kills / max(total_deaths, 1), 2)

                result["dota2"] = {
                    "profile": profile,
                    "stats": {
                        **(stats or {}),
                        "average_kd": average_kd,
                    } if stats or average_kd is not None else stats,
                    "match_history": [],
                }

                for match in recent_matches:
                    hero_id = match.get("hero_id")
                    result["dota2"]["match_history"].append(
                        {
                            "match_id": match.get("match_id"),
                            "hero_id": hero_id,
                            "hero_name": await game_api_service.get_dota_hero_name(hero_id),
                            "kills": match.get("kills", 0),
                            "deaths": match.get("deaths", 0),
                            "assists": match.get("assists", 0),
                            "duration": match.get("duration", 0),
                            "start_time": match.get("start_time"),
                            "won": bool(match.get("won")),
                        }
                    )

            elif game == "valorant":
                riot_id = account_id
                tag = account.get("account_tag")
                region = account.get("region") or "eu"
                if not tag:
                    continue

                profile = await game_api_service.get_valorant_profile(riot_id, tag, region)
                mmr = await game_api_service.get_valorant_mmr(riot_id, tag, region)
                result["valorant"] = {
                    "profile": profile,
                    "mmr": mmr,
                    "match_history": [],
                }
        except Exception as exc:
            logger.error(f"Error fetching {game} stats for {account_id}: {exc}", exc_info=True)
            continue

    return result


# Test endpoint
@router.get("/test")
async def test_game_stats_api():
    """Тестовый endpoint для проверки работы Game Stats API"""
    import os
    return {
        "status": "ok",
        "message": "Game Stats API is working!",
        "config": {
            "steam_api_key_set": bool(os.getenv("STEAM_API_KEY")),
            "faceit_api_key_set": bool(os.getenv("FACEIT_API_KEY")),
            "riot_api_key_set": bool(os.getenv("RIOT_API_KEY")),
        },
        "endpoints": [
            "/game-stats/test",
            "/game-stats/link",
            "/game-stats/my-accounts",
            "/game-stats/steam/{steam_id}",
            "/game-stats/cs2/{steam_id}",
            "/game-stats/dota2/{account_id}/profile",
            "/game-stats/dota2/{account_id}/stats",
            "/game-stats/valorant/{riot_id}/{tag}/profile",
            "/game-stats/valorant/{riot_id}/{tag}/mmr",
        ]
    }


# Модели
class GameAccountLink(BaseModel):
    game: str = Field(..., pattern="^(steam|cs2|dota2|valorant)$")
    account_id: str
    account_tag: Optional[str] = None  # Для Valorant
    region: Optional[str] = "eu"  # Для Valorant


class GameAccountOut(GameAccountLink):
    id: int
    user_id: int
    linked_at: str


# Эндпоинты
@router.post("/link")
async def link_game_account(
    payload: GameAccountLink,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Привязать игровой аккаунт к профилю."""
    normalized = await normalize_game_profile_input(
        payload.game,
        payload.account_id if payload.game != "valorant" else f"{payload.account_id}#{payload.account_tag or ''}",
    )
    if normalized is None:
        raise HTTPException(status_code=400, detail="Account value is required")

    existing = await db.fetchrow(
        "SELECT id FROM game_accounts WHERE user_id = $1 AND game = $2",
        current_user.id, normalized.storage_game
    )

    if existing:
        await db.execute(
            """
            UPDATE game_accounts
            SET account_id = $1, account_tag = $2, region = $3
            WHERE user_id = $4 AND game = $5
            """,
            normalized.account_id,
            normalized.account_tag,
            normalized.region,
            current_user.id,
            normalized.storage_game,
        )
    else:
        await db.execute(
            """
            INSERT INTO game_accounts (user_id, game, account_id, account_tag, region)
            VALUES ($1, $2, $3, $4, $5)
            """,
            current_user.id,
            normalized.storage_game,
            normalized.account_id,
            normalized.account_tag,
            normalized.region,
        )

    return {
        "message": "Аккаунт привязан",
        "profile": {
            "game": normalized.profile_key,
            "value": normalized.account_id,
            "displayValue": normalized.display_value,
        },
    }


@router.get("/public/{profile_identifier}/accounts")
async def get_public_game_accounts(
    profile_identifier: str,
    db: asyncpg.Connection = Depends(get_db),
):
    """Получить привязанные игровые аккаунты пользователя по Discord ID (публично)"""
    user = await resolve_user_by_identifier(db, profile_identifier)
    if not user:
        return []
    user_id = int(user["id"])
    rows = await db.fetch(
        "SELECT game, account_id, account_tag, region, linked_at FROM game_accounts WHERE user_id = $1 ORDER BY linked_at DESC",
        user_id
    )
    return [serialize_game_profile_row(row) for row in rows]


@router.get("/public/{profile_identifier}/stats")
async def get_public_game_stats(
    profile_identifier: str,
    db: asyncpg.Connection = Depends(get_db),
):
    user = await resolve_user_by_identifier(db, profile_identifier)
    if not user:
        return {}

    rows = await db.fetch(
        """
        SELECT game, account_id, account_tag, region
        FROM game_accounts
        WHERE user_id = $1
        ORDER BY linked_at DESC
        """,
        int(user["id"]),
    )
    return await _build_game_stats_payload(rows)


@router.get("/my-accounts")
async def get_my_game_accounts(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить список привязанных игровых аккаунтов"""
    
    rows = await db.fetch(
        """
        SELECT id, user_id, game, account_id, account_tag, region, linked_at
        FROM game_accounts
        WHERE user_id = $1
        ORDER BY linked_at DESC
        """,
        current_user.id
    )

    return [serialize_game_profile_row(row) for row in rows]


@router.delete("/{game}")
async def unlink_game_account(
    game: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Отвязать игровой аккаунт"""
    profile_key = validate_profile_key(game)
    storage_game = PROFILE_KEY_TO_GAME[profile_key]

    result = await db.execute(
        "DELETE FROM game_accounts WHERE user_id = $1 AND game = $2",
        current_user.id, storage_game
    )
    
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Аккаунт не найден")
    
    return {"message": "Аккаунт отвязан"}


@router.get("/steam/{steam_id}")
async def get_steam_profile(steam_id: str):
    """Получить профиль Steam"""
    try:
        profile = await game_api_service.get_steam_profile(steam_id)
        
        if not profile:
            raise HTTPException(
                status_code=404, 
                detail="Профиль не найден. Возможно, Steam API ключ не настроен или профиль приватный."
            )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_steam_profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка при получении профиля: {str(e)}")


@router.get("/cs2/{steam_id}")
async def get_cs2_stats(steam_id: str):
    """Получить статистику CS2"""
    try:
        stats = await game_api_service.get_cs2_stats(steam_id)
        
        if not stats:
            raise HTTPException(
                status_code=404, 
                detail="Статистика не найдена. Возможно, профиль приватный или игрок не играл в CS2."
            )
        
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_cs2_stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка при получении статистики: {str(e)}")


@router.get("/dota2/{account_id}/profile")
async def get_dota2_profile(account_id: str):
    """Получить профиль Dota 2"""
    profile = await game_api_service.get_dota2_profile(account_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    
    return profile


@router.get("/dota2/{account_id}/stats")
async def get_dota2_stats(account_id: str):
    """Получить статистику Dota 2"""
    stats = await game_api_service.get_dota2_stats(account_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Статистика не найдена")
    
    return stats


@router.get("/dota2/{account_id}/matches")
async def get_dota2_matches(account_id: str, limit: int = 10):
    """Получить последние матчи Dota 2"""
    matches = await game_api_service.get_dota2_recent_matches(account_id, limit)
    
    if not matches:
        raise HTTPException(status_code=404, detail="Матчи не найдены")
    
    return matches


@router.get("/valorant/{riot_id}/{tag}/profile")
async def get_valorant_profile(riot_id: str, tag: str, region: str = "eu"):
    """Получить профиль Valorant"""
    try:
        # Декодируем riot_id если он закодирован
        import urllib.parse
        riot_id = urllib.parse.unquote(riot_id)
        
        profile = await game_api_service.get_valorant_profile(riot_id, tag, region)
        
        if not profile:
            raise HTTPException(
                status_code=404, 
                detail="Профиль не найден. Проверьте правильность Riot ID и тега."
            )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_valorant_profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка при получении профиля: {str(e)}")


@router.get("/valorant/{riot_id}/{tag}/mmr")
async def get_valorant_mmr(riot_id: str, tag: str, region: str = "eu"):
    """Получить MMR и ранг Valorant"""
    try:
        # Декодируем riot_id если он закодирован
        import urllib.parse
        riot_id = urllib.parse.unquote(riot_id)
        
        mmr = await game_api_service.get_valorant_mmr(riot_id, tag, region)
        
        if not mmr:
            raise HTTPException(
                status_code=404, 
                detail="MMR не найден. Проверьте правильность Riot ID и тега."
            )
        
        return mmr
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_valorant_mmr: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка при получении MMR: {str(e)}")


@router.get("/user/{discord_id}/stats")
async def get_user_game_stats(
    discord_id: int,
    db: asyncpg.Connection = Depends(get_db),
):
    """Получить игровую статистику пользователя по всем играм (по Discord ID)"""
    
    # Получаем user_id по discord_id
    user = await db.fetchrow("SELECT id FROM users WHERE discord_id = $1", discord_id)
    if not user:
        return {}  # Возвращаем пустой объект если пользователь не найден
    
    user_id = user['id']
    
    # Получаем привязанные аккаунты
    accounts = await db.fetch(
        """
        SELECT game, account_id, account_tag, region
        FROM game_accounts
        WHERE user_id = $1
        """,
        user_id
    )
    
    return await _build_game_stats_payload(accounts)
