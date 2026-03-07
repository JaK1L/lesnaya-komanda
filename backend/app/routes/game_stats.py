"""
API для получения игровой статистики
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import asyncpg
from pydantic import BaseModel, Field

from ..database import get_db
from ..auth import get_current_user
from ..models import User
from ..services.game_api_service import game_api_service

router = APIRouter(prefix="/game-stats", tags=["game_stats"])


# Модели
class GameAccountLink(BaseModel):
    game: str = Field(..., pattern="^(steam|dota2|valorant)$")
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
    """Привязать игровой аккаунт к профилю"""
    
    # Проверяем не привязан ли уже
    existing = await db.fetchrow(
        "SELECT id FROM game_accounts WHERE user_id = $1 AND game = $2",
        current_user.id, payload.game
    )
    
    if existing:
        # Обновляем существующий
        await db.execute(
            """
            UPDATE game_accounts
            SET account_id = $1, account_tag = $2, region = $3
            WHERE user_id = $4 AND game = $5
            """,
            payload.account_id, payload.account_tag, payload.region,
            current_user.id, payload.game
        )
    else:
        # Создаем новый
        await db.execute(
            """
            INSERT INTO game_accounts (user_id, game, account_id, account_tag, region)
            VALUES ($1, $2, $3, $4, $5)
            """,
            current_user.id, payload.game, payload.account_id,
            payload.account_tag, payload.region
        )
    
    return {"message": "Аккаунт привязан"}


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
    
    return [dict(row) for row in rows]


@router.delete("/{game}")
async def unlink_game_account(
    game: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Отвязать игровой аккаунт"""
    
    result = await db.execute(
        "DELETE FROM game_accounts WHERE user_id = $1 AND game = $2",
        current_user.id, game
    )
    
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Аккаунт не найден")
    
    return {"message": "Аккаунт отвязан"}


@router.get("/steam/{steam_id}")
async def get_steam_profile(steam_id: str):
    """Получить профиль Steam"""
    profile = await game_api_service.get_steam_profile(steam_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    
    return profile


@router.get("/cs2/{steam_id}")
async def get_cs2_stats(steam_id: str):
    """Получить статистику CS2"""
    stats = await game_api_service.get_cs2_stats(steam_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Статистика не найдена")
    
    return stats


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
    profile = await game_api_service.get_valorant_profile(riot_id, tag, region)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    
    return profile


@router.get("/valorant/{riot_id}/{tag}/mmr")
async def get_valorant_mmr(riot_id: str, tag: str, region: str = "eu"):
    """Получить MMR и ранг Valorant"""
    mmr = await game_api_service.get_valorant_mmr(riot_id, tag, region)
    
    if not mmr:
        raise HTTPException(status_code=404, detail="MMR не найден")
    
    return mmr


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
    
    result = {}
    
    for account in accounts:
        game = account['game']
        account_id = account['account_id']
        
        try:
            if game == "steam":
                profile = await game_api_service.get_steam_profile(account_id)
                cs2_stats = await game_api_service.get_cs2_stats(account_id)
                result['steam'] = {
                    'profile': profile,
                    'cs2_stats': cs2_stats,
                }
            
            elif game == "dota2":
                profile = await game_api_service.get_dota2_profile(account_id)
                stats = await game_api_service.get_dota2_stats(account_id)
                result['dota2'] = {
                    'profile': profile,
                    'stats': stats,
                }
            
            elif game == "valorant":
                riot_id = account_id
                tag = account['account_tag']
                region = account['region'] or 'eu'
                
                profile = await game_api_service.get_valorant_profile(riot_id, tag, region)
                mmr = await game_api_service.get_valorant_mmr(riot_id, tag, region)
                result['valorant'] = {
                    'profile': profile,
                    'mmr': mmr,
                }
        except Exception as e:
            print(f"Error fetching {game} stats: {e}")
            continue
    
    return result
