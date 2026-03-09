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
                                "last_logoff": datetime.fromtimestamp(player.get("lastlogoff", 0)).isoformat() if player.get("lastlogoff") else None,
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
        """Получить статистику CS2 через Tracker.gg API"""
        # Используем Tracker.gg API для получения статистики CS2
        url = f"https://public-api.tracker.gg/v2/csgo/standard/profile/steam/{steam_id}"
        headers = {
            "TRN-Api-Key": os.getenv("TRACKER_API_KEY", "")  # Можно работать без ключа, но с лимитами
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers if headers["TRN-Api-Key"] else {}) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Извлекаем статистику из ответа
                        segments = data.get("data", {}).get("segments", [])
                        if not segments:
                            return None
                        
                        # Берем общую статистику (первый сегмент обычно overview)
                        overview = segments[0].get("stats", {})
                        
                        return {
                            "kills": overview.get("kills", {}).get("value", 0),
                            "deaths": overview.get("deaths", {}).get("value", 0),
                            "kd_ratio": overview.get("kd", {}).get("value", 0),
                            "wins": overview.get("wins", {}).get("value", 0),
                            "matches_played": overview.get("matchesPlayed", {}).get("value", 0),
                            "mvps": overview.get("mvp", {}).get("value", 0),
                            "headshots": overview.get("headshots", {}).get("value", 0),
                            "headshot_pct": overview.get("headshotPct", {}).get("value", 0),
                            "win_rate": overview.get("wlPercentage", {}).get("value", 0),
                            "damage_per_round": overview.get("damagePerRound", {}).get("value", 0),
                        }
                    elif response.status == 404:
                        # Профиль не найден, пробуем Steam API как fallback
                        return await self._get_cs2_stats_steam_fallback(steam_id)
        except Exception as e:
            logger.error(f"Error fetching CS2 stats from Tracker.gg for {steam_id}: {e}", exc_info=True)
            # Пробуем Steam API как fallback
            return await self._get_cs2_stats_steam_fallback(steam_id)
    
    async def _get_cs2_stats_steam_fallback(self, steam_id: str) -> Optional[Dict[str, Any]]:
        """Fallback: получить статистику CS2 через Steam API"""
        if not self.steam_api_key:
            return None
            
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
                        
                        kills = stats_dict.get("total_kills", 0)
                        deaths = stats_dict.get("total_deaths", 1)
                        
                        return {
                            "kills": kills,
                            "deaths": deaths,
                            "kd_ratio": round(kills / max(deaths, 1), 2),
                            "wins": stats_dict.get("total_wins", 0),
                            "matches_played": stats_dict.get("total_matches_played", 0),
                            "mvps": stats_dict.get("total_mvps", 0),
                            "headshots": stats_dict.get("total_kills_headshot", 0),
                            "headshot_pct": round(stats_dict.get("total_kills_headshot", 0) / max(kills, 1) * 100, 2),
                            "win_rate": round(stats_dict.get("total_wins", 0) / max(stats_dict.get("total_matches_played", 1), 1) * 100, 2),
                            "damage_per_round": 0,  # Недоступно в Steam API
                        }
        except Exception as e:
            logger.error(f"Error fetching CS2 stats from Steam API for {steam_id}: {e}", exc_info=True)
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
