"""
Роуты для работы с системой опыта и поинтов
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
import asyncpg

from ..database import get_db
from ..auth import get_current_admin_user
from ..schemas import (
    XPTransactionCreate, 
    UserXPUpdate,
    User
)
from ..services.xp_service import XPService

router = APIRouter(prefix="/api/xp", tags=["xp"])


@router.post("/add-xp")
async def add_xp(
    transaction: XPTransactionCreate,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Добавить опыт пользователю (только для админов)"""
    if transaction.type != 'xp':
        raise HTTPException(status_code=400, detail="Use type='xp' for this endpoint")
    
    try:
        result = await XPService.add_xp(
            conn=conn,
            discord_id=transaction.discord_id,
            amount=transaction.amount,
            reason=transaction.reason,
            source=transaction.source or 'admin',
            created_by=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding XP: {str(e)}")


@router.post("/add-points")
async def add_points(
    transaction: XPTransactionCreate,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Добавить поинты пользователю (только для админов)"""
    if transaction.type != 'points':
        raise HTTPException(status_code=400, detail="Use type='points' for this endpoint")
    
    try:
        result = await XPService.add_points(
            conn=conn,
            discord_id=transaction.discord_id,
            amount=transaction.amount,
            reason=transaction.reason,
            source=transaction.source or 'admin',
            created_by=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding points: {str(e)}")


@router.put("/update-user")
async def update_user_xp(
    update: UserXPUpdate,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Обновить статистику пользователя (только для админов)"""
    try:
        result = await XPService.update_user_stats(
            conn=conn,
            discord_id=update.discord_id,
            level=update.level,
            current_xp=update.current_xp,
            total_xp=update.total_xp,
            points=update.points,
            admin_id=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")


@router.get("/transactions/{discord_id}")
async def get_user_transactions(
    discord_id: int,
    limit: int = 50,
    conn: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Получить историю транзакций пользователя"""
    try:
        transactions = await XPService.get_user_transactions(
            conn=conn,
            discord_id=discord_id,
            limit=limit
        )
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")


@router.get("/leaderboard")
async def get_leaderboard(
    by: str = 'level',
    limit: int = 100,
    conn: asyncpg.Connection = Depends(get_db)
):
    """Получить таблицу лидеров (публичный эндпоинт)"""
    if by not in ['level', 'total_xp', 'points']:
        raise HTTPException(status_code=400, detail="Invalid 'by' parameter. Use: level, total_xp, or points")
    
    try:
        leaderboard = await XPService.get_leaderboard(
            conn=conn,
            by=by,
            limit=min(limit, 100)  # Максимум 100
        )
        return leaderboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leaderboard: {str(e)}")


@router.get("/xp-for-level/{level}")
async def get_xp_for_level(level: int):
    """Получить необходимый XP для достижения уровня"""
    if level < 1 or level > 100:
        raise HTTPException(status_code=400, detail="Level must be between 1 and 100")
    
    return {
        'level': level,
        'xp_required': XPService.xp_for_level(level)
    }
