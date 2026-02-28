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
                u.avatar_url,
                p.activity_name as game,
                p.status,
                p.roles,
                p.activity_started_at,
                p.game_icon_url
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
                "avatar_url": row["avatar_url"],
                "game": row["game"],
                "status": row["status"],
                "roles": row["roles"] or [],
                "activity_started_at": row["activity_started_at"].isoformat() if row["activity_started_at"] else None,
                "game_icon_url": row["game_icon_url"]
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
        if not previous_state or "activity" not in previous_state:
            return []
        
        # Получаем текущее состояние
        current_state = await self.get_initial_state()
        current_activity = {item["user_id"]: item for item in current_state.get("activity", [])}
        previous_activity = {item["user_id"]: item for item in previous_state.get("activity", [])}
        
        updates = []
        
        # Проверяем изменения существующих пользователей
        for user_id, current_data in current_activity.items():
            if user_id in previous_activity:
                previous_data = previous_activity[user_id]
                # Определяем измененные поля
                changed_fields = {"user_id": user_id}
                
                for field in ["username", "avatar_url", "game", "status", "roles", "activity_started_at", "game_icon_url"]:
                    if current_data.get(field) != previous_data.get(field):
                        changed_fields[field] = current_data.get(field)
                
                # Если есть изменения (кроме user_id), создаем update сообщение
                if len(changed_fields) > 1:
                    updates.append({
                        "type": "activity_update",
                        "timestamp": datetime.now().isoformat(),
                        "data": changed_fields
                    })
            else:
                # Новый пользователь - отправляем все данные
                updates.append({
                    "type": "activity_update",
                    "timestamp": datetime.now().isoformat(),
                    "data": current_data
                })
        
        # Проверяем пользователей, которые ушли в оффлайн
        for user_id, previous_data in previous_activity.items():
            if user_id not in current_activity:
                updates.append({
                    "type": "activity_update",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "user_id": user_id,
                        "status": "offline"
                    }
                })
        
        return updates
    
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
