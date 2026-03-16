from typing import Any, Dict, Optional

import asyncpg


async def ensure_verification_schema(db: asyncpg.Connection) -> None:
    await db.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE"
    )
    await db.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_badge TEXT"
    )
    await db.execute(
        """
        CREATE TABLE IF NOT EXISTS verification_requests (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            twitch_url TEXT NOT NULL,
            telegram_contact TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            admin_note TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            reviewed_at TIMESTAMPTZ,
            reviewed_by INTEGER REFERENCES users(id)
        )
        """
    )
    await db.execute(
        "ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS admin_note TEXT"
    )
    await db.execute(
        "ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ"
    )
    await db.execute(
        "ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS reviewed_by INTEGER"
    )
    await db.execute(
        "ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS reviewed_by_name TEXT"
    )

    fk_exists = await db.fetchval(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_name = 'verification_requests'
              AND constraint_type = 'FOREIGN KEY'
              AND constraint_name = 'verification_requests_reviewed_by_fkey'
        )
        """
    )
    if fk_exists:
        await db.execute(
            "ALTER TABLE verification_requests DROP CONSTRAINT IF EXISTS verification_requests_reviewed_by_fkey"
        )


async def get_user_verification_request(
    db: asyncpg.Connection,
    user_id: int,
) -> Optional[Dict[str, Any]]:
    await ensure_verification_schema(db)
    row = await db.fetchrow(
        """
        SELECT
            vr.id,
            vr.user_id,
            vr.twitch_url,
            vr.telegram_contact,
            vr.reason,
            vr.status,
            vr.admin_note,
            vr.created_at,
            vr.updated_at,
            vr.reviewed_at,
            vr.reviewed_by,
            COALESCE(vr.reviewed_by_name, reviewer.site_nickname, reviewer.discord_username) AS reviewed_by_name
        FROM verification_requests vr
        LEFT JOIN users reviewer ON reviewer.id = vr.reviewed_by
        WHERE vr.user_id = $1
        """,
        user_id,
    )
    return dict(row) if row else None
