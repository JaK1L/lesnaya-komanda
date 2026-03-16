from __future__ import annotations

import json
from typing import Optional

import asyncpg


async def ensure_notifications_schema(db: asyncpg.Connection) -> None:
    await db.execute(
        """
        CREATE TABLE IF NOT EXISTS user_notifications (
            id BIGSERIAL PRIMARY KEY,
            recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
            kind TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT,
            link TEXT,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            read_at TIMESTAMP
        )
        """
    )


async def create_notification(
    db: asyncpg.Connection,
    *,
    recipient_user_id: int,
    kind: str,
    title: str,
    body: Optional[str] = None,
    link: Optional[str] = None,
    actor_user_id: Optional[int] = None,
    metadata: Optional[dict] = None,
) -> None:
    if recipient_user_id <= 0:
        return

    await ensure_notifications_schema(db)
    await db.execute(
        """
        INSERT INTO user_notifications
            (recipient_user_id, actor_user_id, kind, title, body, link, metadata)
        VALUES
            ($1, $2, $3, $4, $5, $6, COALESCE($7::jsonb, '{}'::jsonb))
        """,
        recipient_user_id,
        actor_user_id,
        kind,
        title,
        body,
        link,
        json.dumps(metadata or {}),
    )
