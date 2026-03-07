"""
API для системы достижений
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import asyncpg
from pydantic import BaseModel, Field

from ..database import get_db
from ..auth import get_current_user, get_current_admin_user
from ..models import User

router = APIRouter(prefix="/achievements", tags=["achievements"])


# Модели
class AchievementTypeCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    icon: str = Field(default="🏆", max_length=50)
    category: str = Field(default="general", max_length=50)
    requirement: dict = Field(default_factory=dict)
    points: int = Field(default=10, ge=0)
    is_active: bool = True


class AchievementTypeOut(AchievementTypeCreate):
    id: int
    created_at: datetime


class UserAchievementOut(BaseModel):
    id: int
    user_id: int
    achievement_type_id: int
    progress: int
    max_progress: int
    earned_at: Optional[datetime]
    is_completed: bool
    created_at: datetime
    # Данные типа достижения
    name: str
    description: Optional[str]
    icon: str
    category: str
    points: int


# Публичные эндпоинты
@router.get("/types", response_model=List[AchievementTypeOut])
async def list_achievement_types(
    category: Optional[str] = None,
    db: asyncpg.Connection = Depends(get_db),
):
    """Получить список всех типов достижений."""
    try:
        if category:
            rows = await db.fetch(
                "SELECT * FROM achievement_types WHERE is_active = true AND category = $1 ORDER BY points, id",
                category
            )
        else:
            rows = await db.fetch(
                "SELECT * FROM achievement_types WHERE is_active = true ORDER BY category, points, id"
            )
        
        return [AchievementTypeOut(**dict(row)) for row in rows]
    except asyncpg.UndefinedTableError:
        # Таблица не существует - вернуть пустой список
        return []
    except Exception as e:
        # Логируем ошибку и возвращаем пустой список вместо 500
        import logging
        logging.error(f"Error fetching achievement types: {e}", exc_info=True)
        return []


@router.get("/user/{discord_id}", response_model=List[UserAchievementOut])
async def get_user_achievements(
    discord_id: int,
    completed_only: bool = False,
    db: asyncpg.Connection = Depends(get_db),
):
    """Получить достижения пользователя по Discord ID."""
    # Получаем user_id по discord_id
    user = await db.fetchrow("SELECT id FROM users WHERE discord_id = $1", discord_id)
    if not user:
        return []  # Возвращаем пустой список если пользователь не найден
    
    user_id = user['id']
    
    query = """
        SELECT 
            ua.id, ua.user_id, ua.achievement_type_id, ua.progress, ua.max_progress,
            ua.earned_at, ua.is_completed, ua.created_at,
            at.name, at.description, at.icon, at.category, at.points
        FROM user_achievements ua
        JOIN achievement_types at ON ua.achievement_type_id = at.id
        WHERE ua.user_id = $1
    """
    
    if completed_only:
        query += " AND ua.is_completed = true"
    
    query += " ORDER BY ua.earned_at DESC NULLS LAST, at.points DESC"
    
    rows = await db.fetch(query, user_id)
    return [UserAchievementOut(**dict(row)) for row in rows]


@router.get("/user/{discord_id}/stats")
async def get_user_achievement_stats(
    discord_id: int,
    db: asyncpg.Connection = Depends(get_db),
):
    """Получить статистику достижений пользователя по Discord ID."""
    # Получаем user_id по discord_id
    user = await db.fetchrow("SELECT id FROM users WHERE discord_id = $1", discord_id)
    if not user:
        return {
            "total_achievements": 0,
            "completed_achievements": 0,
            "completion_percentage": 0,
            "total_points": 0,
            "by_category": [],
        }
    
    user_id = user['id']
    
    # Общая статистика
    total_achievements = await db.fetchval(
        "SELECT COUNT(*) FROM achievement_types WHERE is_active = true"
    )
    
    completed_achievements = await db.fetchval(
        "SELECT COUNT(*) FROM user_achievements WHERE user_id = $1 AND is_completed = true",
        user_id
    )
    
    total_points = await db.fetchval(
        """
        SELECT COALESCE(SUM(at.points), 0)
        FROM user_achievements ua
        JOIN achievement_types at ON ua.achievement_type_id = at.id
        WHERE ua.user_id = $1 AND ua.is_completed = true
        """,
        user_id
    )
    
    # По категориям
    by_category = await db.fetch(
        """
        SELECT 
            at.category,
            COUNT(*) FILTER (WHERE ua.is_completed = true) as completed,
            COUNT(*) as total
        FROM achievement_types at
        LEFT JOIN user_achievements ua ON at.id = ua.achievement_type_id AND ua.user_id = $1
        WHERE at.is_active = true
        GROUP BY at.category
        ORDER BY at.category
        """,
        user_id
    )
    
    return {
        "total_achievements": total_achievements or 0,
        "completed_achievements": completed_achievements or 0,
        "completion_percentage": round((completed_achievements / total_achievements * 100) if total_achievements > 0 else 0, 1),
        "total_points": total_points or 0,
        "by_category": [dict(row) for row in by_category],
    }


# Админские эндпоинты
@router.post("/types", response_model=AchievementTypeOut)
async def create_achievement_type(
    payload: AchievementTypeCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Создать новый тип достижения (только для админов)."""
    row = await db.fetchrow(
        """
        INSERT INTO achievement_types (name, description, icon, category, requirement, points, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        """,
        payload.name,
        payload.description,
        payload.icon,
        payload.category,
        payload.requirement,
        payload.points,
        payload.is_active,
    )
    
    return AchievementTypeOut(**dict(row))


@router.put("/types/{achievement_id}", response_model=AchievementTypeOut)
async def update_achievement_type(
    achievement_id: int,
    payload: AchievementTypeCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Обновить тип достижения (только для админов)."""
    row = await db.fetchrow(
        """
        UPDATE achievement_types
        SET name = $1, description = $2, icon = $3, category = $4, 
            requirement = $5, points = $6, is_active = $7
        WHERE id = $8
        RETURNING *
        """,
        payload.name,
        payload.description,
        payload.icon,
        payload.category,
        payload.requirement,
        payload.points,
        payload.is_active,
        achievement_id,
    )
    
    if not row:
        raise HTTPException(status_code=404, detail="Достижение не найдено")
    
    return AchievementTypeOut(**dict(row))


@router.delete("/types/{achievement_id}")
async def delete_achievement_type(
    achievement_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Удалить тип достижения (только для админов)."""
    result = await db.execute(
        "DELETE FROM achievement_types WHERE id = $1",
        achievement_id
    )
    
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Достижение не найдено")
    
    return {"message": "Достижение удалено"}


@router.post("/grant/{user_id}/{achievement_type_id}")
async def grant_achievement(
    user_id: int,
    achievement_type_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Выдать достижение пользователю вручную (только для админов)."""
    
    # Проверяем существование пользователя и типа достижения
    user = await db.fetchrow("SELECT id FROM users WHERE id = $1", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    achievement_type = await db.fetchrow(
        "SELECT id, points FROM achievement_types WHERE id = $1",
        achievement_type_id
    )
    if not achievement_type:
        raise HTTPException(status_code=404, detail="Тип достижения не найден")
    
    # Проверяем не выдано ли уже
    existing = await db.fetchrow(
        "SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_type_id = $2",
        user_id, achievement_type_id
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Достижение уже выдано")
    
    # Выдаем достижение
    await db.execute(
        """
        INSERT INTO user_achievements (user_id, achievement_type_id, progress, max_progress, is_completed, earned_at)
        VALUES ($1, $2, 100, 100, true, NOW())
        """,
        user_id, achievement_type_id
    )
    
    # Добавляем поинты пользователю (если есть колонка points в users)
    try:
        await db.execute(
            "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2",
            achievement_type['points'], user_id
        )
    except:
        pass  # Колонка points может не существовать
    
    return {"message": "Достижение выдано"}
