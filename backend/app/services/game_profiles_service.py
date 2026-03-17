from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse

from fastapi import HTTPException

from .game_api_service import game_api_service

STEAM_ID64_RE = re.compile(r"^\d{17}$")
VALORANT_RIOT_ID_RE = re.compile(r"^[^#\s]{2,24}#[^#\s]{2,10}$")

PROFILE_KEY_TO_GAME = {
    "dota2": "dota2",
    "cs2": "steam",
    "valorant": "valorant",
}
GAME_TO_PROFILE_KEY = {
    "dota2": "dota2",
    "steam": "cs2",
    "valorant": "valorant",
}


@dataclass(slots=True)
class NormalizedGameProfile:
    profile_key: str
    storage_game: str
    account_id: str
    account_tag: Optional[str] = None
    region: Optional[str] = None
    display_value: str = ""
    raw_value: str = ""


def profile_key_from_storage_game(game: str) -> str:
    return GAME_TO_PROFILE_KEY.get(game, game)


def validate_profile_key(profile_key: str) -> str:
    normalized = profile_key.strip().lower()
    if normalized not in PROFILE_KEY_TO_GAME:
        raise HTTPException(status_code=400, detail="Unsupported game profile")
    return normalized


async def normalize_game_profile_input(profile_key: str, raw_value: Optional[str]) -> Optional[NormalizedGameProfile]:
    profile_key = validate_profile_key(profile_key)
    cleaned = (raw_value or "").strip()
    if not cleaned:
        return None

    if profile_key in {"dota2", "cs2"}:
        steam_id = await _normalize_steam_identifier(cleaned)
        return NormalizedGameProfile(
            profile_key=profile_key,
            storage_game=PROFILE_KEY_TO_GAME[profile_key],
            account_id=steam_id,
            display_value=steam_id,
            raw_value=cleaned,
        )

    riot_id, tag = _normalize_valorant_identifier(cleaned)
    return NormalizedGameProfile(
        profile_key=profile_key,
        storage_game="valorant",
        account_id=riot_id,
        account_tag=tag,
        region="eu",
        display_value=f"{riot_id}#{tag}",
        raw_value=cleaned,
    )


def serialize_game_profile_row(row) -> Optional[dict]:
    if not row:
        return None

    data = dict(row)
    game = data["game"]
    profile_key = profile_key_from_storage_game(game)
    if game == "valorant":
        display_value = f'{data["account_id"]}#{data["account_tag"]}' if data.get("account_tag") else data["account_id"]
    else:
        display_value = data["account_id"]

    return {
        "game": profile_key,
        "value": data["account_id"],
        "displayValue": display_value,
        "linkedAt": data.get("linked_at").isoformat() if data.get("linked_at") else None,
    }


async def _normalize_steam_identifier(value: str) -> str:
    if STEAM_ID64_RE.fullmatch(value):
        return value

    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() not in {"steamcommunity.com", "www.steamcommunity.com"}:
        raise HTTPException(
            status_code=400,
            detail="Use a Steam ID64 or a steamcommunity.com profile URL",
        )

    path_parts = [part for part in parsed.path.split("/") if part]
    if len(path_parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid Steam profile URL")

    scope = path_parts[0].lower()
    identifier = path_parts[1]
    if scope == "profiles" and STEAM_ID64_RE.fullmatch(identifier):
        return identifier

    if scope == "id":
        resolved = await game_api_service.resolve_steam_vanity_url(identifier)
        if resolved:
            return resolved
        raise HTTPException(status_code=400, detail="Steam vanity URL could not be resolved")

    raise HTTPException(status_code=400, detail="Unsupported Steam profile URL")


def _normalize_valorant_identifier(value: str) -> tuple[str, str]:
    normalized = value.strip()
    if not VALORANT_RIOT_ID_RE.fullmatch(normalized):
        raise HTTPException(status_code=400, detail="Valorant Riot ID must look like nickname#tag")
    riot_id, tag = normalized.split("#", 1)
    return riot_id.strip(), tag.strip()
