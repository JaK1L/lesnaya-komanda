"""
Сервис для работы с пользователями
"""
from typing import List, Optional
from datetime import datetime
import asyncpg
from ..models import UserProfile, GameProfile, Achievement


class UserService:
    def __init__(self, db: asyncpg.Connection):
        self.db = db
    
    async def get_players(self, limit: int = 50, offset: int = 0) -> List[dict]:
        """Получить список всех игроков"""
        query = """
            SELECT u.*, 
                COUNT(DISTINCT a.id) as achievements_count,
                COUNT(DISTINCT gp.id) as games_count
            FROM users u
            LEFT JOIN user_achievements a ON u.id = a.user_id
            LEFT JOIN game_profiles gp ON u.id = gp.user_id
            WHERE u.is_hidden = false OR u.is_hidden IS NULL
            GROUP BY u.id
            ORDER BY u.rating DESC
            LIMIT $1 OFFSET $2
        """
        rows = await self.db.fetch(query, limit, offset)
        return [dict(row) for row in rows]
    
    async def get_player_by_discord_id(self, discord_id: int) -> Optional[UserProfile]:
        """Получить профиль игрока по Discord ID"""
        # Основная информация
        user = await self.db.fetchrow(
            "SELECT * FROM users WHERE discord_id = $1", discord_id
        )
        
        if not user:
            return None
        
        # Статистика сообщений
        msg_count = await self.db.fetchval(
            "SELECT COUNT(*) FROM activity_log WHERE discord_id = $1", discord_id
        )
        
        # Голосовые часы
        voice_seconds = await self.db.fetchval('''
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (left_at - joined_at))), 0)
            FROM voice_sessions 
            WHERE discord_id = $1 AND left_at IS NOT NULL
        ''', discord_id)
        
        # Игровые профили
        games = await self.db.fetch(
            "SELECT * FROM game_profiles WHERE user_id = $1", user['id']
        )
        
        # Достижения
        achievements = await self.db.fetch('''
            SELECT * FROM achievements WHERE user_id = $1
            ORDER BY earned_at DESC
        ''', user['id'])
        
        return UserProfile(
            discord_id=user['discord_id'],
            discord_username=user['discord_username'],
            forest_rank=user['forest_rank'],
            rating=user['rating'],
            joined_at=user['joined_at'],
            last_seen=user['last_seen'],
            message_count=msg_count,
            voice_hours=voice_seconds / 3600,
            games=[dict(g) for g in games],
            achievements=[dict(a) for a in achievements]
        )
    
    async def get_leaderboard(self, game: Optional[str] = None, limit: int = 50) -> List[dict]:
        """Получить таблицу лидеров"""
        if game:
            query = '''
                SELECT u.discord_id, u.discord_username, u.forest_rank, u.rating,
                       gp.rank as game_rank, gp.stats
                FROM users u
                JOIN game_profiles gp ON u.id = gp.user_id
                WHERE gp.game = $1 AND (u.is_hidden = false OR u.is_hidden IS NULL)
                ORDER BY u.rating DESC
                LIMIT $2
            '''
            rows = await self.db.fetch(query, game, limit)
        else:
            query = '''
                SELECT discord_id, discord_username, forest_rank, rating
                FROM users
                WHERE is_hidden = false OR is_hidden IS NULL
                ORDER BY rating DESC
                LIMIT $1
            '''
            rows = await self.db.fetch(query, limit)
        
        return [dict(row) for row in rows]
    
    async def get_achievements(self, user_id: Optional[int] = None) -> List[dict]:
        """Получить достижения"""
        if user_id:
            query = '''
                SELECT a.*, u.discord_username
                FROM achievements a
                JOIN users u ON a.user_id = u.id
                WHERE u.discord_id = $1
                ORDER BY a.earned_at DESC
            '''
            rows = await self.db.fetch(query, user_id)
        else:
            query = '''
                SELECT a.*, u.discord_username
                FROM achievements a
                JOIN users u ON a.user_id = u.id
                ORDER BY a.earned_at DESC
                LIMIT 50
            '''
            rows = await self.db.fetch(query)
        
        return [dict(row) for row in rows]
    
    async def update_ratings(self) -> int:
        """Обновить рейтинги всех игроков"""
        # Получаем всех пользователей
        users = await self.db.fetch("SELECT id, discord_id FROM users")
        
        for user in users:
            # Считаем активность
            msg_count = await self.db.fetchval('''
                SELECT COUNT(*) FROM activity_log 
                WHERE discord_id = $1 AND created_at > NOW() - INTERVAL '30 days'
            ''', user['discord_id'])
            
            voice_seconds = await self.db.fetchval('''
                SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (left_at - joined_at))), 0)
                FROM voice_sessions 
                WHERE discord_id = $1 AND left_at IS NOT NULL 
                    AND joined_at > NOW() - INTERVAL '30 days'
            ''', user['discord_id'])
            
            # Считаем достижения
            achievements_count = await self.db.fetchval(
                "SELECT COUNT(*) FROM achievements WHERE user_id = $1", user['id']
            )
            
            # Формула рейтинга
            rating = (
                min(msg_count / 100, 40) * 0.4 +  # сообщения (макс 40)
                min(voice_seconds / 3600, 50) * 0.3 +  # голос (макс 50 часов -> 15 баллов)
                achievements_count * 2  # достижения
            )
            
            # Обновляем рейтинг
            await self.db.execute(
                "UPDATE users SET rating = $1 WHERE id = $2", rating, user['id']
            )
            
            # Обновляем ранг
            rank = self.get_forest_rank(rating)
            await self.db.execute(
                "UPDATE users SET forest_rank = $1 WHERE id = $2", rank, user['id']
            )
        
        return len(users)
    
    def get_forest_rank(self, rating: float) -> str:
        """Определить ранг по рейтингу"""
        if rating < 10:
            return "🌱 Росток"
        elif rating < 20:
            return "🌿 Трава"
        elif rating < 30:
            return "🌲 Дерево"
        elif rating < 40:
            return "🪵 Бревно"
        elif rating < 50:
            return "🔥 Лесной Дух"
        else:
            return "🐺 Старый Волк"
    
    async def get_activity_stats(self, days: int = 7) -> List[dict]:
        """Статистика активности по дням"""
        query = '''
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as messages,
                COUNT(DISTINCT discord_id) as active_users
            FROM activity_log
            WHERE created_at > NOW() - $1::interval
            GROUP BY DATE(created_at)
            ORDER BY date
        '''
        interval_str = f"{days} days"
        rows = await self.db.fetch(query, interval_str)
        return [dict(row) for row in rows]
    
    async def get_game_stats(self) -> List[dict]:
        """Статистика по играм"""
        query = '''
            SELECT 
                game,
                COUNT(*) as players,
                AVG((stats->>'mmr')::float) as avg_mmr
            FROM game_profiles
            GROUP BY game
        '''
        rows = await self.db.fetch(query)
        return [dict(row) for row in rows]

    async def get_discord_online_count(self) -> int:
        """Количество онлайн по данным presence (кроме offline)."""
        return int(await self.db.fetchval(
            "SELECT COUNT(*) FROM discord_presence WHERE status IS NOT NULL AND status <> 'offline'"
        ) or 0)

    async def get_discord_top_messages(self, limit: int = 3) -> List[dict]:
        """Топ по сообщениям (всего)."""
        rows = await self.db.fetch(
            """
            SELECT
                al.discord_id,
                COALESCE(u.discord_username, MAX(al.username)) AS discord_username,
                COUNT(*)::int AS messages
            FROM activity_log al
            LEFT JOIN users u ON u.discord_id = al.discord_id
            GROUP BY al.discord_id, u.discord_username
            ORDER BY messages DESC
            LIMIT $1
            """,
            limit,
        )
        return [dict(r) for r in rows]

    async def get_discord_top_voice(self, limit: int = 3) -> List[dict]:
        """Топ по времени в голосе (сумма завершённых сессий)."""
        rows = await self.db.fetch(
            """
            SELECT
                vs.discord_id,
                COALESCE(u.discord_username, 'Unknown') AS discord_username,
                COALESCE(SUM(EXTRACT(EPOCH FROM (vs.left_at - vs.joined_at))), 0)::bigint AS seconds
            FROM voice_sessions vs
            LEFT JOIN users u ON u.discord_id = vs.discord_id
            WHERE vs.left_at IS NOT NULL
            GROUP BY vs.discord_id, u.discord_username
            ORDER BY seconds DESC
            LIMIT $1
            """,
            limit,
        )
        # seconds -> hours (float, 1 decimal)
        result: List[dict] = []
        for r in rows:
            d = dict(r)
            d["hours"] = round((d.get("seconds", 0) or 0) / 3600, 1)
            result.append(d)
        return result

    async def get_discord_now_playing(self, limit: int = 10) -> List[dict]:
        """Кто во что играет сейчас (presence.activity_name)."""
        rows = await self.db.fetch(
            """
            SELECT
                p.discord_id,
                COALESCE(u.discord_username, 'Unknown') AS discord_username,
                u.avatar_url,
                p.status,
                p.activity_type,
                p.activity_name,
                p.updated_at
            FROM discord_presence p
            LEFT JOIN users u ON u.discord_id = p.discord_id
            WHERE p.status IS NOT NULL AND p.status <> 'offline'
              AND p.activity_name IS NOT NULL AND p.activity_name <> ''
            ORDER BY p.updated_at DESC
            LIMIT $1
            """,
            limit,
        )
        return [dict(r) for r in rows]