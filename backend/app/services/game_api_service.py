"""
Сервис для интеграции с игровыми API
"""
import aiohttp
import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class GameAPIService:
    """Сервис для работы с игровыми API (Steam, Riot, OpenDota)"""
    
    def __init__(self):
        self.steam_api_key = os.getenv("STEAM_API_KEY")
        self.riot_api_key = os.getenv("RIOT_API_KEY")
        
    async def get_steam_profile(self, steam_id: str) -> Optional[Dict[str, Any]]:
        """Получить профиль Steam пользователя"""
        if not self.steam_api_key:
            return None
            
        url = f"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/"
        params = {
            "key": self.steam_api_key,
            "steamids": steam_id
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        players = data.get("response", {}).get("players", [])
                        if players:
                            player = players[0]
                            return {
                                "steam_id": player.get("steamid"),
                                "username": player.get("personaname"),
                                "avatar_url": player.get("avatarfull"),
                                "profile_url": player.get("profileurl"),
                                "status": self._get_steam_status(player.get("personastate", 0)),
                                "last_logoff": datetime.fromtimestamp(player.get("lastlogoff", 0)) if player.get("lastlogoff") else None,
                            }
        except Exception as e:
            logger.error(f"Error fetching Steam profile for {steam_id}: {e}", exc_info=True)
            return None
    
    def _get_steam_status(self, state: int) -> str:
        """Преобразовать код статуса Steam в текст"""
        statuses = {
            0: "Offline",
            1: "Online",
            2: "Busy",
            3: "Away",
            4: "Snooze",
            5: "Looking to trade",
            6: "Looking to play"
        }
        return statuses.get(state, "Unknown")
    
    async def get_cs2_stats(self, steam_id: str) -> Optional[Dict[str, Any]]:
        """Получить статистику CS2 (Counter-Strike 2)"""
        if not self.steam_api_key:
            return None
            
        # CS2 App ID = 730 (тот же что и CS:GO)
        url = f"https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/"
        params = {
            "key": self.steam_api_key,
            "steamid": steam_id,
            "appid": "730"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        stats = data.get("playerstats", {}).get("stats", [])
                        
                        # Извлекаем основные статистики
                        stats_dict = {stat["name"]: stat["value"] for stat in stats}
                        
                        return {
                            "kills": stats_dict.get("total_kills", 0),
                            "deaths": stats_dict.get("total_deaths", 0),
                            "kd_ratio": round(stats_dict.get("total_kills", 0) / max(stats_dict.get("total_deaths", 1), 1), 2),
                            "wins": stats_dict.get("total_wins", 0),
                            "matches_played": stats_dict.get("total_matches_played", 0),
                            "mvps": stats_dict.get("total_mvps", 0),
                            "headshots": stats_dict.get("total_kills_headshot", 0),
                            "accuracy": round(stats_dict.get("total_shots_hit", 0) / max(stats_dict.get("total_shots_fired", 1), 1) * 100, 2),
                        }
        except Exception as e:
            logger.error(f"Error fetching CS2 stats for {steam_id}: {e}", exc_info=True)
            return None
    
    async def get_dota2_profile(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Получить профиль Dota 2 через OpenDota API"""
        url = f"https://api.opendota.com/api/players/{account_id}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        profile = data.get("profile", {})
                        
                        return {
                            "account_id": account_id,
                            "username": profile.get("personaname"),
                            "avatar_url": profile.get("avatarfull"),
                            "rank_tier": data.get("rank_tier"),
                            "leaderboard_rank": data.get("leaderboard_rank"),
                            "mmr_estimate": data.get("mmr_estimate", {}).get("estimate"),
                        }
        except Exception as e:
            logger.error(f"Error fetching Dota 2 profile for {account_id}: {e}", exc_info=True)
            return None
    
    async def get_dota2_stats(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Получить статистику Dota 2"""
        url = f"https://api.opendota.com/api/players/{account_id}/wl"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        wins = data.get("win", 0)
                        losses = data.get("lose", 0)
                        total = wins + losses
                        
                        return {
                            "wins": wins,
                            "losses": losses,
                            "total_matches": total,
                            "win_rate": round(wins / max(total, 1) * 100, 2),
                        }
        except Exception as e:
            logger.error(f"Error fetching Dota 2 stats for {account_id}: {e}", exc_info=True)
            return None
    
    async def get_dota2_recent_matches(self, account_id: str, limit: int = 10) -> Optional[list]:
        """Получить последние матчи Dota 2"""
        url = f"https://api.opendota.com/api/players/{account_id}/recentMatches"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        matches = await response.json()
                        return matches[:limit]
        except Exception as e:
            logger.error(f"Error fetching Dota 2 recent matches for {account_id}: {e}", exc_info=True)
            return None
    
    async def get_valorant_profile(self, riot_id: str, tag: str, region: str = "eu") -> Optional[Dict[str, Any]]:
        """Получить профиль Valorant через неофициальное API"""
        # Используем неофициальное API так как официальное требует сложной авторизации
        url = f"https://api.henrikdev.xyz/valorant/v1/account/{riot_id}/{tag}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        account_data = data.get("data", {})
                        
                        return {
                            "riot_id": riot_id,
                            "tag": tag,
                            "username": f"{riot_id}#{tag}",
                            "account_level": account_data.get("account_level"),
                            "card_url": account_data.get("card", {}).get("wide"),
                            "region": account_data.get("region"),
                        }
        except Exception as e:
            logger.error(f"Error fetching Valorant profile for {riot_id}#{tag}: {e}", exc_info=True)
            return None
    
    async def get_valorant_mmr(self, riot_id: str, tag: str, region: str = "eu") -> Optional[Dict[str, Any]]:
        """Получить MMR и ранг Valorant"""
        url = f"https://api.henrikdev.xyz/valorant/v2/mmr/{region}/{riot_id}/{tag}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        mmr_data = data.get("data", {})
                        current_data = mmr_data.get("current_data", {})
                        
                        return {
                            "current_tier": current_data.get("currenttierpatched"),
                            "ranking_in_tier": current_data.get("ranking_in_tier"),
                            "mmr_change": current_data.get("mmr_change_to_last_game"),
                            "elo": current_data.get("elo"),
                            "games_needed_for_rating": current_data.get("games_needed_for_rating", 0),
                        }
        except Exception as e:
            logger.error(f"Error fetching Valorant MMR for {riot_id}#{tag}: {e}", exc_info=True)
            return None


# Singleton instance
game_api_service = GameAPIService()
