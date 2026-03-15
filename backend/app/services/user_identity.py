"""
Helpers for resolving profile/user identifiers used in public routes.
"""
from typing import Optional
import asyncpg
from urllib.parse import unquote


def _normalize_identifier(identifier: str) -> str:
    value = identifier.strip()
    if not value:
        return ""

    # Decode URL-encoded identifiers (including accidental double encoding).
    for _ in range(2):
        decoded = unquote(value)
        if decoded == value:
            break
        value = decoded

    return value.strip()


def _parse_numeric_identifier(identifier: str) -> Optional[int]:
    value = identifier.strip()
    if not value:
        return None

    lowered = value.lower()
    if lowered.startswith("id:"):
        value = value[3:]
    elif lowered.startswith("u:"):
        value = value[2:]

    if value.isdigit():
        return int(value)
    return None


async def resolve_user_by_identifier(
    db: asyncpg.Connection,
    identifier: str,
) -> Optional[asyncpg.Record]:
    """
    Resolve user by one of supported identifiers:
    - user_tag (exact, case-insensitive)
    - discord_id (numeric)
    - internal user id (numeric)
    """
    value = _normalize_identifier(identifier)
    if not value:
        return None

    # Allow /profile/@tag style URLs.
    tag = value[1:] if value.startswith("@") else value

    row = await db.fetchrow(
        """
        SELECT id, discord_id, user_tag, is_hidden
        FROM users
        WHERE LOWER(user_tag) = LOWER($1)
        """,
        tag,
    )
    if row:
        return row

    numeric_value = _parse_numeric_identifier(value)
    if numeric_value is None:
        return None

    numeric_text = str(numeric_value)

    row = await db.fetchrow(
        """
        SELECT id, discord_id, user_tag, is_hidden
        FROM users
        WHERE discord_id IS NOT NULL
          AND discord_id::text = $1
        """,
        numeric_text,
    )
    if row:
        return row

    return await db.fetchrow(
        """
        SELECT id, discord_id, user_tag, is_hidden
        FROM users
        WHERE id::text = $1
        """,
        numeric_text,
    )
