"""
Service layer for third-party game APIs.
"""

from __future__ import annotations

import logging
import os
import time
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
        self.faceit_api_key = os.getenv("FACEIT_API_KEY")
        self.csskill_api_key = os.getenv("CSSKILL_API_KEY")
        self._dota_heroes_cache: Dict[int, str] = {}
        self._api_cache: Dict[str, tuple[float, Any]] = {}

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

    async def get_csskill_cs2_data(self, steam_id: str, limit: int = 5) -> Optional[Dict[str, Any]]:
        profile = await self.get_csskill_player_profile(steam_id)
        recent_matches = await self.get_csskill_recent_matches(steam_id, limit)

        if not profile and not recent_matches:
            return None

        normalized_matches: list[Dict[str, Any]] = []
        for match in recent_matches or []:
            match_id = match.get("match_id")
            details = None
            events = None
            if match_id:
                details = await self.get_csskill_match_details(str(match_id))
                events = await self.get_csskill_match_events(str(match_id))
            normalized_matches.append(self._normalize_csskill_match(match, details, events))

        return {
            "profile": profile,
            "match_history": normalized_matches,
        }

    async def _get_cs2_stats_steam(self, steam_id: str) -> Optional[Dict[str, Any]]:
        stats_dict = await self._get_game_user_stats(steam_id, CS2_APP_ID)
        if not stats_dict:
            return None

        kills = self._stat_value(stats_dict, "total_kills")
        deaths = self._stat_value(stats_dict, "total_deaths")
        wins = self._stat_value(stats_dict, "total_matches_won")
        matches_played = self._stat_value(
            stats_dict,
            "total_matches_played",
            "total_matches_won",
        )
        if not wins:
            wins = min(self._stat_value(stats_dict, "total_wins"), matches_played) if matches_played else 0
        if wins > matches_played:
            matches_played = wins
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
            opendota_stats = await self._get_opendota_wl(account_id)
            if opendota_stats:
                return opendota_stats

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
            return await self._get_opendota_recent_matches(account_id, limit)

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
            return await self._get_opendota_recent_matches(account_id, limit)

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

        return detailed_matches or await self._get_opendota_recent_matches(account_id, limit)

    async def get_faceit_cs2_data(self, steam_id: str, limit: int = 5) -> Optional[Dict[str, Any]]:
        player = await self._get_faceit_player_by_steam_id(steam_id)
        if not player:
            return None

        player_id = player.get("player_id")
        if not player_id:
            return None

        lifetime = await self._faceit_get(f"/players/{player_id}/stats/cs2")
        recent = await self._faceit_get(
            f"/players/{player_id}/games/cs2/stats",
            {"limit": max(1, min(limit, 20))},
        )

        lifetime_data = lifetime or {}
        lifetime_stats = lifetime_data.get("lifetime", {}) if isinstance(lifetime_data, dict) else {}
        items = recent.get("items", []) if isinstance(recent, dict) else []

        matches = self._coerce_faceit_number(
            lifetime_stats,
            "Matches",
            "matches",
        )
        wins = self._coerce_faceit_number(
            lifetime_stats,
            "Wins",
            "wins",
        )
        losses = max(matches - wins, 0) if matches else None
        win_rate = self._coerce_faceit_float(
            lifetime_stats,
            "Win Rate %",
            "Win Rate",
        )
        if win_rate is None and matches:
            win_rate = round(wins / max(matches, 1) * 100, 2)

        kd_ratio = self._coerce_faceit_float(
            lifetime_stats,
            "Average K/D Ratio",
            "Average K/D",
            "K/D Ratio",
        )
        hs_percent = self._coerce_faceit_float(
            lifetime_stats,
            "Average Headshots %",
            "Headshots %",
        )

        return {
            "profile": {
                "player_id": player.get("player_id"),
                "nickname": player.get("nickname"),
                "avatar_url": player.get("avatar"),
                "faceit_url": player.get("faceit_url"),
                "skill_level": (player.get("games", {}) or {}).get("cs2", {}).get("skill_level"),
                "elo": (player.get("games", {}) or {}).get("cs2", {}).get("faceit_elo"),
            },
            "stats": {
                "matches": matches,
                "wins": wins,
                "losses": losses,
                "win_rate": win_rate,
                "kd_ratio": kd_ratio,
                "headshot_pct": hs_percent,
            },
            "match_history": [self._normalize_faceit_match(item) for item in items if item],
        }

    async def get_csskill_player_profile(self, steam_id: str) -> Optional[Dict[str, Any]]:
        payload = await self._csskill_get_first(
            [
                f"/players/{steam_id}",
                f"/player/{steam_id}",
            ]
        )
        if not payload:
            return None

        player = self._extract_payload_object(payload)
        if not player:
            return None

        return {
            "steam_id": str(player.get("steam_id") or steam_id),
            "nickname": player.get("nickname") or player.get("name") or player.get("username"),
            "avatar_url": player.get("avatar") or player.get("avatar_url"),
            "profile_url": player.get("profile_url") or player.get("url"),
        }

    async def get_csskill_recent_matches(self, steam_id: str, limit: int = 5) -> list[Dict[str, Any]]:
        payload = await self._csskill_get_first(
            [
                f"/players/{steam_id}/matches",
                f"/players/{steam_id}/recent-matches",
                f"/players/{steam_id}/history",
                f"/player/{steam_id}/matches",
            ],
            {"limit": max(1, min(limit, 10))},
        )
        if not payload:
            return []
        return self._extract_payload_list(payload)[:limit]

    async def get_csskill_match_details(self, match_id: str) -> Optional[Dict[str, Any]]:
        payload = await self._csskill_get_first(
            [
                f"/matches/{match_id}",
                f"/match/{match_id}",
            ]
        )
        return self._extract_payload_object(payload) if payload else None

    async def get_csskill_match_events(self, match_id: str) -> Optional[Dict[str, Any]]:
        payload = await self._csskill_get_first(
            [
                f"/matches/{match_id}/events",
                f"/match/{match_id}/events",
                f"/matches/{match_id}/statistics",
                f"/match/{match_id}/statistics",
            ]
        )
        return self._extract_payload_object(payload) if payload else None

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

    async def _faceit_get(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        if not self.faceit_api_key:
            return None

        url = f"https://open.faceit.com/data/v4{path}"
        headers = {"Authorization": f"Bearer {self.faceit_api_key}"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params or {}) as response:
                    if response.status == 200:
                        return await response.json()

                    body = await response.text()
                    logger.warning("FACEIT API request failed (%s) for %s: %s", response.status, url, body)
                    return None
        except Exception as exc:
            logger.error("Error calling FACEIT API %s: %s", path, exc, exc_info=True)
            return None

    async def _csskill_get(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        ttl_seconds: int = 600,
    ) -> Optional[Dict[str, Any]]:
        if not self.csskill_api_key:
            return None

        cache_key = f"csskill:{path}:{repr(sorted((params or {}).items()))}"
        cached = self._api_cache.get(cache_key)
        now = time.time()
        if cached and cached[0] > now:
            return cached[1]

        url = f"https://api.csskill.com{path}"
        headers = {"Authorization": f"Bearer {self.csskill_api_key}"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params or {}) as response:
                    if response.status == 200:
                        payload = await response.json()
                        self._api_cache[cache_key] = (now + ttl_seconds, payload)
                        return payload
                    if response.status != 404:
                        body = await response.text()
                        logger.warning("CSSkill API request failed (%s) for %s: %s", response.status, url, body)
                    return None
        except Exception as exc:
            logger.error("Error calling CSSkill API %s: %s", path, exc, exc_info=True)
            return None

    async def _csskill_get_first(
        self,
        paths: list[str],
        params: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        for path in paths:
            payload = await self._csskill_get(path, params=params)
            if payload:
                return payload
        return None

    async def _get_faceit_player_by_steam_id(self, steam_id: str) -> Optional[Dict[str, Any]]:
        return await self._faceit_get(
            "/players",
            {"game": "cs2", "game_player_id": steam_id},
        )

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

    async def _get_opendota_wl(self, account_id: str) -> Optional[Dict[str, Any]]:
        url = f"https://api.opendota.com/api/players/{account_id}/wl"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        logger.warning(
                            "OpenDota wl request failed (%s) for %s",
                            response.status,
                            account_id,
                        )
                        return None

                    data = await response.json()
                    wins = int(data.get("win", 0) or 0)
                    losses = int(data.get("lose", 0) or 0)
                    total_matches = wins + losses
                    if not total_matches:
                        return None

                    return {
                        "wins": wins,
                        "losses": losses,
                        "total_matches": total_matches,
                        "win_rate": round(wins / max(total_matches, 1) * 100, 2),
                    }
        except Exception as exc:
            logger.error(
                "Error fetching OpenDota win/loss for %s: %s",
                account_id,
                exc,
                exc_info=True,
            )
            return None

    async def _get_opendota_recent_matches(self, account_id: str, limit: int = 10) -> list[Dict[str, Any]]:
        url = f"https://api.opendota.com/api/players/{account_id}/recentMatches"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        logger.warning(
                            "OpenDota recentMatches request failed (%s) for %s",
                            response.status,
                            account_id,
                        )
                        return []

                    matches = await response.json()
                    normalized = []
                    for match in matches[:limit]:
                        player_slot = int(match.get("player_slot", 0) or 0)
                        radiant_player = player_slot < 128
                        radiant_win = bool(match.get("radiant_win"))
                        normalized.append(
                            {
                                "match_id": match.get("match_id"),
                                "hero_id": match.get("hero_id"),
                                "kills": int(match.get("kills", 0) or 0),
                                "deaths": int(match.get("deaths", 0) or 0),
                                "assists": int(match.get("assists", 0) or 0),
                                "duration": int(match.get("duration", 0) or 0),
                                "start_time": match.get("start_time"),
                                "won": radiant_win if radiant_player else not radiant_win,
                            }
                        )
                    return normalized
        except Exception as exc:
            logger.error(
                "Error fetching OpenDota recent matches for %s: %s",
                account_id,
                exc,
                exc_info=True,
            )
            return []

    async def get_dota_hero_name(self, hero_id: Optional[int]) -> Optional[str]:
        if not hero_id:
            return None

        if not self._dota_heroes_cache:
            await self._load_dota_heroes()

        return self._dota_heroes_cache.get(int(hero_id))

    async def _load_dota_heroes(self) -> None:
        url = "https://api.opendota.com/api/heroes"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        logger.warning("OpenDota heroes request failed (%s)", response.status)
                        return

                    data = await response.json()
                    self._dota_heroes_cache = {
                        int(hero.get("id")): str(hero.get("localized_name"))
                        for hero in data
                        if hero.get("id") is not None and hero.get("localized_name")
                    }
        except Exception as exc:
            logger.error("Error fetching Dota hero names: %s", exc, exc_info=True)

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

    def _coerce_faceit_number(self, payload: Dict[str, Any], *keys: str) -> int:
        value = self._coerce_faceit_float(payload, *keys)
        return int(value) if value is not None else 0

    def _coerce_faceit_float(self, payload: Dict[str, Any], *keys: str) -> Optional[float]:
        for key in keys:
            raw = payload.get(key)
            if raw in (None, ""):
                continue
            if isinstance(raw, (int, float)):
                return float(raw)
            normalized = str(raw).replace("%", "").replace(",", ".").strip()
            try:
                return float(normalized)
            except ValueError:
                continue
        return None

    def _normalize_faceit_match(self, item: Dict[str, Any]) -> Dict[str, Any]:
        stats = item.get("stats", {}) if isinstance(item, dict) else {}
        return {
            "match_id": item.get("match_id") or item.get("matchId"),
            "map": stats.get("Map") or stats.get("map"),
            "kills": self._coerce_faceit_number(stats, "Kills", "kills"),
            "deaths": self._coerce_faceit_number(stats, "Deaths", "deaths"),
            "assists": self._coerce_faceit_number(stats, "Assists", "assists"),
            "kd_ratio": self._coerce_faceit_float(stats, "K/D Ratio", "K/D", "kd_ratio"),
            "headshot_pct": self._coerce_faceit_float(stats, "Headshots %", "HS %", "Headshots"),
            "result": stats.get("Result") or stats.get("result"),
            "score": stats.get("Score") or stats.get("score"),
            "finished_at": item.get("finished_at") or item.get("created_at"),
        }

    def _extract_payload_object(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not isinstance(payload, dict):
            return None
        if any(key in payload for key in ("steam_id", "player_id", "match_id", "id", "nickname", "name")):
            return payload
        for key in ("data", "player", "match", "result"):
            value = payload.get(key)
            if isinstance(value, dict):
                return value
        return None

    def _extract_payload_list(self, payload: Dict[str, Any]) -> list[Dict[str, Any]]:
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        if not isinstance(payload, dict):
            return []
        for key in ("items", "matches", "data", "results"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
        return []

    def _normalize_csskill_match(
        self,
        match: Dict[str, Any],
        details: Optional[Dict[str, Any]] = None,
        events: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        merged: Dict[str, Any] = {}
        for source in (match, details or {}, events or {}):
            if isinstance(source, dict):
                merged.update(source)

        kills = self._coerce_csskill_number(merged, "kills", "Kills")
        deaths = self._coerce_csskill_number(merged, "deaths", "Deaths")
        assists = self._coerce_csskill_number(merged, "assists", "Assists")
        kd_ratio = self._coerce_csskill_float(merged, "kd_ratio", "kd", "K/D")
        if kd_ratio is None and kills:
            kd_ratio = round(kills / max(deaths, 1), 2)

        return {
            "match_id": merged.get("match_id") or merged.get("id"),
            "map": merged.get("map") or merged.get("map_name"),
            "kills": kills,
            "deaths": deaths,
            "assists": assists,
            "kd_ratio": kd_ratio,
            "result": merged.get("result") or merged.get("outcome"),
            "score": merged.get("score") or merged.get("final_score"),
            "played_at": merged.get("played_at") or merged.get("date") or merged.get("finished_at") or merged.get("created_at"),
            "details_url": merged.get("details_url") or merged.get("url"),
        }

    def _coerce_csskill_number(self, payload: Dict[str, Any], *keys: str) -> int:
        value = self._coerce_csskill_float(payload, *keys)
        return int(value) if value is not None else 0

    def _coerce_csskill_float(self, payload: Dict[str, Any], *keys: str) -> Optional[float]:
        for key in keys:
            raw = payload.get(key)
            if raw in (None, ""):
                continue
            if isinstance(raw, (int, float)):
                return float(raw)
            normalized = str(raw).replace("%", "").replace(",", ".").strip()
            try:
                return float(normalized)
            except ValueError:
                continue
        return None


game_api_service = GameAPIService()
