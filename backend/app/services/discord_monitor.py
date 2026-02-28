"""
Discord Monitor service для отслеживания изменений и генерации WebSocket updates
"""
import asyncpg
from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DiscordMonitor:
    """Мониторинг Discord активности и генерация обновлений"""
    
    def __init__(self, db: asyncpg.Connection):
        self.db = db
        self.last_statistics_update = datetime.now()
    
    async def get_initial_state(self) -> dict:
        """
        Получить полное текущее состояние для новых подключений
        
        Returns:
            Словарь с activity и statistics
        """
        # Получаем текущую активность (кто во что играет)
        activity_rows = await self.db.fetch("""
            SELECT
                p.discord_id,
                COALESCE(u.discord_username, 'Unknown') AS username,
                p.activity_name as game,
                p.status
            FROM discord_presence p
            LEFT JOIN users u ON u.discord_id = p.discord_id
            WHERE p.status IS NOT NULL AND p.status <> 'offline'
              AND p.activity_name IS NOT NULL AND p.activity_name <> ''
            ORDER BY p.updated_at DESC
            LIMIT 20
        """)
        
        activity = [
            {
                "user_id": str(row["discord_id"]),
                "username": row["username"],
                "game": row["game"],
                "status": row["status"]
            }
            for row in activity_rows
        ]
        
        # Получаем статистику
        statistics = await self._get_statistics()
        
        return {
            "activity": activity,
            "statistics": statistics
        }
    
    async def _get_statistics(self) -> dict:
        """Получить текущую статистику топов"""
        # Топ по сообщениям
        message_rows = await self.db.fetch("""
            SELECT
                al.discord_id,
                COALESCE(u.discord_username, MAX(al.username)) AS username,
                COUNT(*)::int AS count
            FROM activity_log al
            LEFT JOIN users u ON u.discord_id = al.discord_id
            GROUP BY al.discord_id, u.discord_username
            ORDER BY count DESC
            LIMIT 5
        """)
        
        message_leaderboard = [
            {
                "user_id": str(row["discord_id"]),
                "username": row["username"],
                "count": row["count"]
            }
            for row in message_rows
        ]
        
        # Топ по голосу
        voice_rows = await self.db.fetch("""
            SELECT
                vs.discord_id,
                COALESCE(u.discord_username, 'Unknown') AS username,
                COALESCE(SUM(EXTRACT(EPOCH FROM (vs.left_at - vs.joined_at))), 0)::bigint AS seconds
            FROM voice_sessions vs
            LEFT JOIN users u ON u.discord_id = vs.discord_id
            WHERE vs.left_at IS NOT NULL
            GROUP BY vs.discord_id, u.discord_username
            ORDER BY seconds DESC
            LIMIT 5
        """)
        
        voice_leaderboard = [
            {
                "user_id": str(row["discord_id"]),
                "username": row["username"],
                "minutes": int(row["seconds"] / 60)
            }
            for row in voice_rows
        ]
        
        return {
            "message_leaderboard": message_leaderboard,
            "voice_leaderboard": voice_leaderboard
        }
    
    async def detect_activity_changes(self, previous_state: Optional[dict] = None) -> List[dict]:
        """
        Детектировать изменения в активности пользователей
        
        Args:
            previous_state: Предыдущее состояние для сравнения
        
        Returns:
            Список activity_update сообщений
        """
        # TODO: Реализовать детекцию изменений
        # Пока возвращаем пустой список
        return []
    
    async def should_update_statistics(self) -> bool:
        """
        Проверить, нужно ли обновлять статистику
        Rate limit: максимум 1 раз в 30 секунд
        
        Returns:
            True если прошло >= 30 секунд с последнего обновления
        """
        now = datetime.now()
        elapsed = (now - self.last_statistics_update).total_seconds()
        return elapsed >= 30
    
    async def generate_statistics_update(self) -> dict:
        """
        Сгенерировать обновление статистики
        
        Returns:
            statistics_update сообщение
        """
        self.last_statistics_update = datetime.now()
        statistics = await self._get_statistics()
        
        return {
            "type": "statistics_update",
            "timestamp": datetime.now().isoformat(),
            "data": statistics
        }
