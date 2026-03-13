"""
Привязка Twitch аккаунта через OAuth2.
Требует: пользователь уже авторизован (JWT), хочет привязать Twitch.
"""
import httpx
from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
from jose import JWTError, jwt
import logging

from ..config import settings
from ..database import database

logger = logging.getLogger(__name__)

router = APIRouter()

TWITCH_AUTHORIZE = "https://id.twitch.tv/oauth2/authorize"
TWITCH_TOKEN = "https://id.twitch.tv/oauth2/token"
TWITCH_USERS = "https://api.twitch.tv/helix/users"


def _redirect_uri() -> str:
    return f"{settings.BACKEND_URL.rstrip('/')}/api/auth/twitch/callback"


def _decode_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


@router.get("/auth/twitch")
async def twitch_link_start(token: str = Query(..., description="JWT пользователя")):
    """Инициирует привязку Twitch — редирект на страницу авторизации Twitch."""
    if not settings.TWITCH_CLIENT_ID:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=twitch_not_configured")

    params = {
        "client_id": settings.TWITCH_CLIENT_ID,
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": "user:read:email",
        "state": token,  # Передаём JWT как state для идентификации пользователя в callback
    }
    url = f"{TWITCH_AUTHORIZE}?{urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/auth/twitch/callback")
async def twitch_link_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    """Callback Twitch OAuth: привязывает Twitch username к профилю пользователя."""
    if error or not code or not state:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=twitch_denied")

    if not settings.TWITCH_CLIENT_ID or not settings.TWITCH_CLIENT_SECRET:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=twitch_not_configured")

    # Декодируем JWT из state → получаем discord_id пользователя
    payload = _decode_jwt(state)
    if not payload:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=invalid_session")

    discord_id_str = payload.get("sub")
    token_type = payload.get("type")
    if not discord_id_str or token_type != "discord":
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=invalid_session")

    try:
        discord_id = int(discord_id_str)
    except ValueError:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=invalid_session")

    async with httpx.AsyncClient() as client:
        # Обмен code → access_token
        resp = await client.post(
            TWITCH_TOKEN,
            data={
                "client_id": settings.TWITCH_CLIENT_ID,
                "client_secret": settings.TWITCH_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": _redirect_uri(),
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            logger.error(f"Twitch token exchange failed: {resp.status_code} {resp.text}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=twitch_token_failed")

        token_data = resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=twitch_no_token")

        # Получаем информацию о Twitch пользователе
        users_resp = await client.get(
            TWITCH_USERS,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Client-Id": settings.TWITCH_CLIENT_ID,
            },
        )
        if users_resp.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=twitch_user_failed")

        users_data = users_resp.json().get("data", [])
        if not users_data:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?error=twitch_user_empty")

        twitch_login = users_data[0]["login"]

    # Сохраняем twitch_username в базу
    async with database.get_connection() as db:
        await db.execute(
            "UPDATE users SET twitch_username = $1 WHERE discord_id = $2",
            twitch_login,
            discord_id,
        )

    return RedirectResponse(url=f"{settings.FRONTEND_URL}/profile?twitch_linked=1")
