"""
Service for managing user game preferences
"""
import json
import logging
from typing import List, Optional, Dict
from asyncpg import Connection, PostgresError
from app.schemas import GamePreferenceItem

logger = logging.getLogger(__name__)


class GamePreferencesService:
    """Service for managing user game preferences"""
    
    @staticmethod
    async def save_preferences(
        conn: Connection,
        user_id: int,
        preferences: List[GamePreferenceItem]
    ) -> None:
        """
        Save user game preferences to database
        
        Args:
            conn: Database connection
            user_id: User ID
            preferences: List of game preferences
            
        Raises:
            PostgresError: If database operation fails
            ValueError: If JSON serialization fails
        """
        try:
            # Convert preferences to JSON-serializable format
            preferences_data = [
                {"game": pref.game, "custom_name": pref.custom_name}
                for pref in preferences
            ]
            preferences_json = json.dumps(preferences_data)
            
            # Update user's game_preferences field
            await conn.execute(
                """
                UPDATE users 
                SET game_preferences = $1::jsonb
                WHERE id = $2
                """,
                preferences_json,
                user_id
            )
            
            logger.info(f"Saved game preferences for user {user_id}: {len(preferences)} games")
            
        except (TypeError, ValueError) as e:
            logger.error(f"JSON serialization error for user {user_id}: {e}")
            raise ValueError(f"Failed to serialize preferences: {e}")
        except PostgresError as e:
            logger.error(f"Database error saving preferences for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def get_preferences(
        conn: Connection,
        user_id: int
    ) -> Optional[List[GamePreferenceItem]]:
        """
        Get user game preferences from database
        
        Args:
            conn: Database connection
            user_id: User ID
            
        Returns:
            List of game preferences or None if not set
            
        Raises:
            PostgresError: If database operation fails
        """
        try:
            row = await conn.fetchrow(
                """
                SELECT game_preferences
                FROM users
                WHERE id = $1
                """,
                user_id
            )
            
            if not row or row['game_preferences'] is None:
                return None
            
            # Parse JSONB to GamePreferenceItem objects
            preferences_data = row['game_preferences']
            if isinstance(preferences_data, str):
                preferences_data = json.loads(preferences_data)
            
            if not preferences_data:  # Empty array
                return []
            
            preferences = [
                GamePreferenceItem(**pref)
                for pref in preferences_data
            ]
            
            return preferences
            
        except PostgresError as e:
            logger.error(f"Database error getting preferences for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def update_preferences(
        conn: Connection,
        user_id: int,
        preferences: List[GamePreferenceItem]
    ) -> None:
        """
        Update user game preferences (same as save_preferences)
        
        Args:
            conn: Database connection
            user_id: User ID
            preferences: List of game preferences
            
        Raises:
            PostgresError: If database operation fails
            ValueError: If JSON serialization fails
        """
        await GamePreferencesService.save_preferences(conn, user_id, preferences)
    
    @staticmethod
    async def skip_preferences(
        conn: Connection,
        user_id: int
    ) -> None:
        """
        Mark that user skipped the preferences survey by setting empty array
        
        Args:
            conn: Database connection
            user_id: User ID
            
        Raises:
            PostgresError: If database operation fails
        """
        try:
            await conn.execute(
                """
                UPDATE users 
                SET game_preferences = '[]'::jsonb
                WHERE id = $1
                """,
                user_id
            )
            
            logger.info(f"User {user_id} skipped game preferences survey")
            
        except PostgresError as e:
            logger.error(f"Database error skipping preferences for user {user_id}: {e}")
            raise
    
    @staticmethod
    async def get_game_statistics(conn: Connection) -> Dict[str, int]:
        """
        Get aggregated game statistics from all users
        
        Returns:
            Dictionary with game counts: {CS2: int, "DOTA 2": int, VALORANT: int, "ДРУГИЕ": int}
            
        Raises:
            PostgresError: If database operation fails
        """
        try:
            # Get all users with game preferences
            rows = await conn.fetch(
                """
                SELECT game_preferences
                FROM users
                WHERE game_preferences IS NOT NULL 
                  AND game_preferences != '[]'::jsonb
                """
            )
            
            # Initialize counters
            stats = {
                "CS2": 0,
                "DOTA 2": 0,
                "VALORANT": 0,
                "ДРУГИЕ": 0
            }
            
            # Count games
            for row in rows:
                preferences_data = row['game_preferences']
                if isinstance(preferences_data, str):
                    preferences_data = json.loads(preferences_data)
                
                for pref in preferences_data:
                    game = pref.get('game')
                    
                    # Categorize games
                    if game in ["CS2", "DOTA 2", "VALORANT"]:
                        stats[game] += 1
                    else:
                        # All other games go to "ДРУГИЕ"
                        stats["ДРУГИЕ"] += 1
            
            logger.info(f"Game statistics: {stats}")
            return stats
            
        except PostgresError as e:
            logger.error(f"Database error getting game statistics: {e}")
            raise
    
    @staticmethod
    async def get_users_by_game(conn: Connection, game_name: str) -> List[Dict]:
        """
        Get list of users who play a specific game
        
        Args:
            conn: Database connection
            game_name: Name of the game to filter by
            
        Returns:
            List of users with basic info
            
        Raises:
            PostgresError: If database operation fails
        """
        try:
            # Query users who have this game in their preferences
            rows = await conn.fetch(
                """
                SELECT 
                    u.discord_id,
                    u.discord_username,
                    u.avatar_url,
                    u.forest_rank,
                    u.rating,
                    u.game_preferences,
                    CASE 
                        WHEN u.last_seen > NOW() - INTERVAL '5 minutes' THEN true
                        ELSE false
                    END as is_online
                FROM users u
                WHERE u.game_preferences IS NOT NULL
                  AND u.game_preferences != '[]'::jsonb
                  AND u.is_hidden = false
                ORDER BY is_online DESC, u.rating DESC
                """
            )
            
            # Filter users who have the specific game
            users = []
            for row in rows:
                preferences_data = row['game_preferences']
                if isinstance(preferences_data, str):
                    preferences_data = json.loads(preferences_data)
                
                # Check if user has this game
                has_game = False
                for pref in preferences_data:
                    game = pref.get('game')
                    
                    # Match exact game or categorize
                    if game_name in ["CS2", "DOTA 2", "VALORANT"]:
                        if game == game_name:
                            has_game = True
                            break
                    elif game_name == "ДРУГИЕ":
                        # All games except main 3
                        if game not in ["CS2", "DOTA 2", "VALORANT"]:
                            has_game = True
                            break
                
                if has_game:
                    users.append({
                        "discord_id": row['discord_id'],
                        "discord_username": row['discord_username'],
                        "avatar_url": row['avatar_url'],
                        "forest_rank": row['forest_rank'],
                        "rating": float(row['rating']),
                        "is_online": row['is_online']
                    })
            
            logger.info(f"Found {len(users)} users for game {game_name}")
            return users
            
        except PostgresError as e:
            logger.error(f"Database error getting users by game {game_name}: {e}")
            raise
