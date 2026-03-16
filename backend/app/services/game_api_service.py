"""
Service layer for third-party game APIs.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

import aiohttp

logger = logging.getLogger(__name__)

STEAM_ID64_BASE = 76561197960265728
CS2_APP_ID = "730"
DOTA2_APP_ID = "570"


class GameAPIService:
    """Fetch public profile and stats data from Steam and Riot-backed APIs."""

    def __init__(self) -> None:
        self.steam_api_key = os.getenv("STEAM_API_KEY")
        self.riot_api_key = os.getenv("RIOT_API_KEY")

    async def get_steam_profile(self, steam_id: str) -> Optional[Dict[str, Any]]:
        """Return a Steam public profile."""
        if not self.steam_api_key:
            logger.warning("Steam API key not configured")
            return None

        data = await self._steam_api_get(
            "ISteamUser/GetPlayerSummaries/v2/",
            {"steamids": steam_id},
        )
        if not data:
            return None

        players = data.get("response", {}).get("players", [])
        if not players:
            return None

        player = players[0]
        return {
            "steam_id": player.get("steamid"),
            "username": player.get("personaname"),
            "avatar_url": player.get("avatarfull"),
            "profile_url": player.get("profileurl"),
            "status": self._get_steam_status(player.get("personastate", 0)),
            "last_logoff": (
                datetime.fromtimestamp(player["lastlogoff"]).isoformat()
                if player.get("lastlogoff")
                else None
            ),
        }

    def _get_steam_status(self, state: int) -> str:
        statuses = {
            0: "Offline",
            1: "Online",
            2: "Busy",
            3: "Away",
            4: "Snooze",
            5: "Looking to trade",
            6: "Looking to play",
        }
        return statuses.get(state, "Unknown")

    async def get_cs2_stats(self, steam_id: str) -> Optional[Dict[str, Any]]:
        """Return CS2 stats directly from Steam API."""
        logger.info("Fetching CS2 stats from Steam API for %s", steam_id)
        return await self._get_cs2_stats_steam(steam_id)

    async def _get_cs2_stats_steam(self, steam_id: str) -> Optional[Dict[str, Any]]:
        stats_dict = await self._get_game_user_stats(steam_id, CS2_APP_ID)
        if not stats_dict:
            return None

        kills = self._stat_value(stats_dict, "total_kills")
        deaths = self._stat_value(stats_dict, "total_deaths")
        wins = self._stat_value(stats_dict, "total_wins")
        matches_played = self._stat_value(
            stats_dict,
            "total_matches_played",
            "total_matches_won",
        )
        headshots = self._stat_value(stats_dict, "total_kills_headshot")

        return {
            "kills": kills,
            "deaths": deaths,
            "kd_ratio": round(kills / max(deaths, 1), 2),
            "wins": wins,
            "matches_played": matches_played,
            "mvps": self._stat_value(stats_dict, "total_mvps"),
            "headshots": headshots,
            "headshot_pct": round(headshots / max(kills, 1) * 100, 2),
            "win_rate": round(wins / max(matches_played, 1) * 100, 2),
            "damage_per_round": 0,
        }

    async def get_dota2_profile(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Resolve Dota profile using Steam identity plus OpenDota rank/MMR."""
        steam_id = self._dota_account_to_steam_id(account_id)
        if not steam_id:
            return None

        steam_profile = await self.get_steam_profile(steam_id)
        opendota_profile = await self._get_opendota_player_profile(account_id)

        return {
            "account_id": account_id,
            "username": (
                steam_profile.get("username")
                if steam_profile
                else (opendota_profile or {}).get("username")
            ),
            "avatar_url": (
                steam_profile.get("avatar_url")
                if steam_profile
                else (opendota_profile or {}).get("avatar_url")
            ),
            "rank_tier": (opendota_profile or {}).get("rank_tier"),
            "leaderboard_rank": (opendota_profile or {}).get("leaderboard_rank"),
            "mmr_estimate": (opendota_profile or {}).get("mmr_estimate"),
        }

    async def get_dota2_stats(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Return Dota 2 stats using Steam-backed sources only."""
        steam_id = self._dota_account_to_steam_id(account_id)
        if not steam_id:
            return None

        stats_dict = await self._get_game_user_stats(steam_id, DOTA2_APP_ID)

        wins = self._stat_value(
            stats_dict,
            "total_wins",
            "wins",
            "matches_won",
        )
        losses = self._stat_value(
            stats_dict,
            "total_losses",
            "losses",
            "matches_lost",
        )
        total_matches = self._stat_value(
            stats_dict,
            "total_matches_played",
            "matches_played",
            "games_played",
        )

        if not total_matches and (wins or losses):
            total_matches = wins + losses
        if total_matches and not losses and wins <= total_matches:
            losses = total_matches - wins

        if not total_matches and not wins and not losses:
            recent_matches = await self.get_dota2_recent_matches(account_id, 20) or []
            wins = sum(1 for match in recent_matches if match.get("won"))
            losses = sum(1 for match in recent_matches if not match.get("won"))
            total_matches = len(recent_matches)

        if not total_matches and not wins and not losses:
            return None

        return {
            "wins": wins,
            "losses": losses,
            "total_matches": total_matches,
            "win_rate": round(wins / max(total_matches, 1) * 100, 2),
        }

    async def get_dota2_recent_matches(self, account_id: str, limit: int = 10) -> Optional[list]:
        """Return recent Dota 2 matches via Steam match history APIs."""
        if not self.steam_api_key:
            logger.warning("Steam API key not configured")
            return None

        try:
            numeric_account_id = int(account_id)
        except (TypeError, ValueError):
            logger.warning("Invalid Dota account id: %s", account_id)
            return None

        history = await self._steam_api_get(
            "IDOTA2Match_570/GetMatchHistory/v1/",
            {
                "account_id": numeric_account_id,
                "matches_requested": max(min(limit, 10), 1),
            },
        )
        matches = history.get("result", {}).get("matches", []) if history else []
        if not matches:
            return []

        detailed_matches: list[Dict[str, Any]] = []
        async with aiohttp.ClientSession() as session:
            for match in matches[:limit]:
                detail = await self._steam_api_get(
                    "IDOTA2Match_570/GetMatchDetails/v1/",
                    {"match_id": match.get("match_id")},
                    session=session,
                )
                match_data = detail.get("result", {}) if detail else {}
                if not match_data:
                    continue

                player_data = next(
                    (
                        player
                        for player in match_data.get("players", [])
                        if int(player.get("account_id", 0)) == numeric_account_id
                    ),
                    None,
                )
                if not player_data:
                    continue

                player_slot = int(player_data.get("player_slot", 0))
                radiant_player = player_slot < 128
                radiant_win = bool(match_data.get("radiant_win"))

                detailed_matches.append(
                    {
                        "match_id": match_data.get("match_id"),
                        "hero_id": player_data.get("hero_id"),
                        "kills": int(player_data.get("kills", 0)),
                        "deaths": int(player_data.get("deaths", 0)),
                        "assists": int(player_data.get("assists", 0)),
                        "duration": int(match_data.get("duration", 0)),
                        "start_time": match_data.get("start_time"),
                        "won": radiant_win if radiant_player else not radiant_win,
                    }
                )

        return detailed_matches

    async def get_valorant_profile(
        self,
        riot_id: str,
        tag: str,
        region: str = "eu",
    ) -> Optional[Dict[str, Any]]:
        """Return Valorant profile via Henrik API."""
        logger.info("Fetching Valorant profile for %s#%s (%s)", riot_id, tag, region)

        henrik_api_key = os.getenv("HENRIK_API_KEY", "")
        if not henrik_api_key:
            logger.warning("Henrik API key not set. Valorant stats unavailable.")
            return None

        url = f"https://api.henrikdev.xyz/valorant/v1/account/{riot_id}/{tag}"
        headers = {"Authorization": henrik_api_key}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status != 200:
                        logger.error(
                            "Henrik API error %s: %s",
                            response.status,
                            await response.text(),
                        )
                        return None

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
        except Exception as exc:
            logger.error(
                "Error fetching Valorant profile from Henrik API for %s#%s: %s",
                riot_id,
                tag,
                exc,
                exc_info=True,
            )
            return None

    async def _get_valorant_profile_henrik_fallback(
        self,
        riot_id: str,
        tag: str,
        region: str = "eu",
    ) -> Optional[Dict[str, Any]]:
        return await self.get_valorant_profile(riot_id, tag, region)

    async def get_valorant_mmr(
        self,
        riot_id: str,
        tag: str,
        region: str = "eu",
    ) -> Optional[Dict[str, Any]]:
        """Return Valorant rank/MMR via Henrik API."""
        logger.info("Fetching Valorant MMR for %s#%s (%s)", riot_id, tag, region)

        henrik_api_key = os.getenv("HENRIK_API_KEY", "")
        if not henrik_api_key:
            logger.warning("Henrik API key not set. Valorant MMR unavailable.")
            return None

        url = f"https://api.henrikdev.xyz/valorant/v2/mmr/{region}/{riot_id}/{tag}"
        headers = {"Authorization": henrik_api_key}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status != 200:
                        logger.error(
                            "Henrik API MMR error %s: %s",
                            response.status,
                            await response.text(),
                        )
                        return None

                    data = await response.json()
                    mmr_data = data.get("data", {})
                    current_data = mmr_data.get("current_data", {})
                    return {
                        "current_tier": current_data.get("currenttierpatched"),
                        "ranking_in_tier": current_data.get("ranking_in_tier"),
                        "mmr_change": current_data.get("mmr_change_to_last_game"),
                        "elo": current_data.get("elo"),
                        "games_needed_for_rating": current_data.get(
                            "games_needed_for_rating",
                            0,
                        ),
                    }
        except Exception as exc:
            logger.error(
                "Error fetching Valorant MMR from Henrik API for %s#%s: %s",
                riot_id,
                tag,
                exc,
                exc_info=True,
            )
            return None

    async def _get_valorant_mmr_henrik_fallback(
        self,
        riot_id: str,
        tag: str,
        region: str = "eu",
    ) -> Optional[Dict[str, Any]]:
        return await self.get_valorant_mmr(riot_id, tag, region)

    async def _steam_api_get(
        self,
        path: str,
        params: Dict[str, Any],
        session: aiohttp.ClientSession | None = None,
    ) -> Optional[Dict[str, Any]]:
        if not self.steam_api_key:
            logger.warning("Steam API key not configured")
            return None

        request_params = {"key": self.steam_api_key, **params}
        url = f"https://api.steampowered.com/{path}"

        try:
            if session is None:
                async with aiohttp.ClientSession() as own_session:
                    async with own_session.get(url, params=request_params) as response:
                        return await self._parse_steam_response(response, url)

            async with session.get(url, params=request_params) as response:
                return await self._parse_steam_response(response, url)
        except Exception as exc:
            logger.error("Error calling Steam API %s: %s", path, exc, exc_info=True)
            return None

    async def _parse_steam_response(
        self,
        response: aiohttp.ClientResponse,
        url: str,
    ) -> Optional[Dict[str, Any]]:
        if response.status == 200:
            return await response.json()

        body = await response.text()
        logger.warning("Steam API request failed (%s) for %s: %s", response.status, url, body)
        return None

    async def _get_opendota_player_profile(self, account_id: str) -> Optional[Dict[str, Any]]:
        url = f"https://api.opendota.com/api/players/{account_id}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        logger.warning(
                            "OpenDota profile request failed (%s) for %s",
                            response.status,
                            account_id,
                        )
                        return None

                    data = await response.json()
                    profile = data.get("profile", {})
                    return {
                        "username": profile.get("personaname"),
                        "avatar_url": profile.get("avatarfull"),
                        "rank_tier": data.get("rank_tier"),
                        "leaderboard_rank": data.get("leaderboard_rank"),
                        "mmr_estimate": data.get("mmr_estimate", {}).get("estimate"),
                    }
        except Exception as exc:
            logger.error(
                "Error fetching OpenDota profile for %s: %s",
                account_id,
                exc,
                exc_info=True,
            )
            return None

    async def _get_game_user_stats(
        self,
        steam_id: str,
        app_id: str,
    ) -> Optional[Dict[str, int]]:
        data = await self._steam_api_get(
            "ISteamUserStats/GetUserStatsForGame/v2/",
            {"steamid": steam_id, "appid": app_id},
        )
        stats = data.get("playerstats", {}).get("stats", []) if data else []
        if not stats:
            return None
        return {
            str(stat.get("name")): int(stat.get("value", 0))
            for stat in stats
            if stat.get("name") is not None
        }

    def _stat_value(self, stats: Optional[Dict[str, int]], *keys: str) -> int:
        if not stats:
            return 0
        for key in keys:
            if key in stats:
                return int(stats[key] or 0)
        return 0

    def _dota_account_to_steam_id(self, account_id: str) -> Optional[str]:
        try:
            value = int(account_id)
        except (TypeError, ValueError):
            logger.warning("Invalid Dota account id for Steam conversion: %s", account_id)
            return None

        if value > STEAM_ID64_BASE:
            return str(value)
        return str(STEAM_ID64_BASE + value)


game_api_service = GameAPIService()
