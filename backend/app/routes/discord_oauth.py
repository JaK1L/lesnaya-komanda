"""
Вход на сайт через Discord OAuth2.
Связывает аккаунт Discord с профилем в БД (та же таблица users, что и бот).
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import asyncpg
from datetime import datetime

from ..config import settings
from ..database import get_db
from ..auth import create_access_token
from datetime import timedelta

router = APIRouter()

DISCORD_AUTHORIZE = "https://discord.com/api/oauth2/authorize"
DISCORD_TOKEN = "https://discord.com/api/oauth2/token"
DISCORD_ME = "https://discord.com/api/users/@me"
SCOPE = "identify"


def _redirect_uri() -> str:
    """Redirect URI для callback (должен совпадать с настройками в Discord Developer Portal)."""
    return f"{settings.BACKEND_URL.rstrip('/')}/api/auth/discord/callback"


@router.get("/auth/discord")
async def discord_login():
    """Редирект на страницу авторизации Discord."""
    if not settings.DISCORD_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Discord OAuth not configured (DISCORD_CLIENT_ID)")
    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": SCOPE,
    }
    url = f"{DISCORD_AUTHORIZE}?{urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/auth/discord/callback")
async def discord_callback(
    code: str | None = None,
    error: str | None = None,
    db: asyncpg.Connection = Depends(get_db),
):
    """Callback после авторизации в Discord: обмен code на токен, создание/обновление user, выдача JWT, редирект на сайт."""
    if error or not code:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}?error=discord_denied"
        )
    if not settings.DISCORD_CLIENT_ID or not settings.DISCORD_CLIENT_SECRET:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=oauth_not_configured")

    async with httpx.AsyncClient() as client:
        # Обмен code на access_token
        resp = await client.post(
            DISCORD_TOKEN,
            data={
                "client_id": settings.DISCORD_CLIENT_ID,
                "client_secret": settings.DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": _redirect_uri(),
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=token_exchange_failed")
        data = resp.json()
        access_token = data.get("access_token")
        if not access_token:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=no_token")

        # Получить данные пользователя Discord
        me_resp = await client.get(
            DISCORD_ME,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if me_resp.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=discord_user_failed")
        discord_user = me_resp.json()
        discord_id = int(discord_user["id"])
        username = discord_user.get("username", "") or discord_user.get("global_name", "") or str(discord_id)
        avatar_hash = discord_user.get("avatar")
        avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.png" if avatar_hash else None

    # Создать или обновить запись в users (та же таблица, что и у бота)
    await db.execute(
        """
        INSERT INTO users (discord_id, discord_username, avatar_url, last_seen, joined_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (discord_id) DO UPDATE SET
            discord_username = EXCLUDED.discord_username,
            avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
            last_seen = NOW()
        """,
        discord_id,
        username,
        avatar_url,
    )

    # JWT для сайта (sub = discord_id, type = discord)
    token = create_access_token(
        data={"sub": str(discord_id), "type": "discord"},
        expires_delta=timedelta(days=7),
    )

    # Редирект на фронт с токеном в query (фронт сохранит в localStorage и уберёт из URL)
    return RedirectResponse(url=f"{settings.FRONTEND_URL}?token={token}&login=discord")
