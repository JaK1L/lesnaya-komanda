"""
Сервис для работы с системой опыта и поинтов
"""
import asyncpg
from typing import Optional, List, Dict
from datetime import datetime


class XPService:
    """Сервис для управления опытом и поинтами"""
    
    # Формула расчета XP для следующего уровня: level * 100
    @staticmethod
    def xp_for_level(level: int) -> int:
        """Рассчитать необходимый XP для достижения уровня"""
        return level * 100
    
    @staticmethod
    async def add_xp(
        conn: asyncpg.Connection,
        discord_id: int,
        amount: int,
        reason: str,
        source: str = 'manual',
        created_by: Optional[int] = None
    ) -> Dict:
        """
        Добавить опыт пользователю с автоматическим повышением уровня
        Возвращает информацию о новом уровне и XP
        """
        # Получаем текущие данные пользователя
        user = await conn.fetchrow(
            """
            SELECT id, level, current_xp, total_xp, discord_username
            FROM users 
            WHERE discord_id = $1
            """,
            discord_id
        )
        
        if not user:
            raise ValueError(f"User with discord_id {discord_id} not found")
        
        user_id = user['id']
        current_level = user['level']
        current_xp = user['current_xp']
        total_xp = user['total_xp']
        
        # Добавляем опыт
        new_current_xp = current_xp + amount
        new_total_xp = total_xp + amount
        new_level = current_level
        level_ups = 0
        
        # Проверяем повышение уровня
        while new_current_xp >= XPService.xp_for_level(new_level):
            new_current_xp -= XPService.xp_for_level(new_level)
            new_level += 1
            level_ups += 1
        
        # Обновляем данные пользователя
        await conn.execute(
            """
            UPDATE users 
            SET level = $1, current_xp = $2, total_xp = $3
            WHERE discord_id = $4
            """,
            new_level, new_current_xp, new_total_xp, discord_id
        )
        
        # Записываем транзакцию
        await conn.execute(
            """
            INSERT INTO xp_transactions 
            (user_id, discord_id, type, amount, reason, source, created_by)
            VALUES ($1, $2, 'xp', $3, $4, $5, $6)
            """,
            user_id, discord_id, amount, reason, source, created_by
        )
        
        return {
            'discord_id': discord_id,
            'username': user['discord_username'],
            'old_level': current_level,
            'new_level': new_level,
            'level_ups': level_ups,
            'current_xp': new_current_xp,
            'total_xp': new_total_xp,
            'xp_added': amount
        }
    
    @staticmethod
    async def add_points(
        conn: asyncpg.Connection,
        discord_id: int,
        amount: int,
        reason: str,
        source: str = 'manual',
        created_by: Optional[int] = None
    ) -> Dict:
        """Добавить поинты пользователю"""
        user = await conn.fetchrow(
            """
            SELECT id, points, discord_username
            FROM users 
            WHERE discord_id = $1
            """,
            discord_id
        )
        
        if not user:
            raise ValueError(f"User with discord_id {discord_id} not found")
        
        user_id = user['id']
        current_points = user['points'] or 0
        new_points = current_points + amount
        
        # Обновляем поинты
        await conn.execute(
            """
            UPDATE users 
            SET points = $1
            WHERE discord_id = $2
            """,
            new_points, discord_id
        )
        
        # Записываем транзакцию
        await conn.execute(
            """
            INSERT INTO xp_transactions 
            (user_id, discord_id, type, amount, reason, source, created_by)
            VALUES ($1, $2, 'points', $3, $4, $5, $6)
            """,
            user_id, discord_id, amount, reason, source, created_by
        )
        
        return {
            'discord_id': discord_id,
            'username': user['discord_username'],
            'old_points': current_points,
            'new_points': new_points,
            'points_added': amount
        }
    
    @staticmethod
    async def update_user_stats(
        conn: asyncpg.Connection,
        discord_id: int,
        level: Optional[int] = None,
        current_xp: Optional[int] = None,
        total_xp: Optional[int] = None,
        points: Optional[int] = None,
        admin_id: Optional[int] = None
    ) -> Dict:
        """Обновить статистику пользователя (для админов)"""
        user = await conn.fetchrow(
            "SELECT id, level, current_xp, total_xp, points, discord_username FROM users WHERE discord_id = $1",
            discord_id
        )
        
        if not user:
            raise ValueError(f"User with discord_id {discord_id} not found")
        
        updates = []
        params = []
        param_count = 1
        
        if level is not None:
            updates.append(f"level = ${param_count}")
            params.append(level)
            param_count += 1
        
        if current_xp is not None:
            updates.append(f"current_xp = ${param_count}")
            params.append(current_xp)
            param_count += 1
        
        if total_xp is not None:
            updates.append(f"total_xp = ${param_count}")
            params.append(total_xp)
            param_count += 1
        
        if points is not None:
            updates.append(f"points = ${param_count}")
            params.append(points)
            param_count += 1
        
        if not updates:
            return {
                'discord_id': discord_id,
                'username': user['discord_username'],
                'message': 'No changes made'
            }
        
        params.append(discord_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE discord_id = ${param_count}"
        
        await conn.execute(query, *params)
        
        # Записываем в историю что админ изменил
        changes = []
        if level is not None and level != user['level']:
            changes.append(f"level: {user['level']} → {level}")
        if current_xp is not None and current_xp != user['current_xp']:
            changes.append(f"current_xp: {user['current_xp']} → {current_xp}")
        if total_xp is not None and total_xp != user['total_xp']:
            changes.append(f"total_xp: {user['total_xp']} → {total_xp}")
        if points is not None and points != user['points']:
            changes.append(f"points: {user['points']} → {points}")
        
        if changes:
            await conn.execute(
                """
                INSERT INTO xp_transactions 
                (user_id, discord_id, type, amount, reason, source, created_by)
                VALUES ($1, $2, 'xp', 0, $3, 'admin_update', $4)
                """,
                user['id'], discord_id, f"Admin update: {', '.join(changes)}", admin_id
            )
        
        return {
            'discord_id': discord_id,
            'username': user['discord_username'],
            'changes': changes
        }
    
    @staticmethod
    async def get_user_transactions(
        conn: asyncpg.Connection,
        discord_id: int,
        limit: int = 50
    ) -> List[Dict]:
        """Получить историю транзакций пользователя"""
        rows = await conn.fetch(
            """
            SELECT id, type, amount, reason, source, created_at, created_by
            FROM xp_transactions
            WHERE discord_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            discord_id, limit
        )
        
        return [dict(row) for row in rows]
    
    @staticmethod
    async def get_leaderboard(
        conn: asyncpg.Connection,
        by: str = 'level',  # 'level', 'total_xp', 'points'
        limit: int = 100
    ) -> List[Dict]:
        """Получить таблицу лидеров"""
        order_by = {
            'level': 'level DESC, current_xp DESC',
            'total_xp': 'total_xp DESC',
            'points': 'points DESC'
        }.get(by, 'level DESC, current_xp DESC')
        
        rows = await conn.fetch(
            f"""
            SELECT 
                discord_id,
                discord_username,
                avatar_url,
                level,
                current_xp,
                total_xp,
                points,
                forest_rank
            FROM users
            WHERE discord_id IS NOT NULL
            ORDER BY {order_by}
            LIMIT $1
            """,
            limit
        )
        
        return [dict(row) for row in rows]
