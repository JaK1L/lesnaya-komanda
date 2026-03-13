"""
Автоматическое присвоение достижений по slug
"""
import logging
import asyncpg

logger = logging.getLogger(__name__)


async def grant_by_slug(db: asyncpg.Connection, user_id: int, slug: str) -> bool:
    """Выдать достижение по slug если ещё не выдано. Возвращает True если выдано."""
    try:
        ach = await db.fetchrow(
            "SELECT id, points FROM achievement_types WHERE requirement->>'slug' = $1 AND is_active = true",
            slug,
        )
        if not ach:
            return False
        inserted = await db.fetchval(
            """
            INSERT INTO user_achievements (user_id, achievement_type_id, progress, max_progress, is_completed, earned_at)
            VALUES ($1, $2, 100, 100, true, NOW())
            ON CONFLICT (user_id, achievement_type_id) DO NOTHING
            RETURNING id
            """,
            user_id, ach["id"],
        )
        if inserted and ach["points"]:
            await db.execute(
                "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2",
                ach["points"], user_id,
            )
        return inserted is not None
    except Exception as e:
        logger.warning(f"grant_by_slug({slug}) failed: {e}")
        return False


async def check_likes(db: asyncpg.Connection, user_id: int):
    count = await db.fetchval(
        "SELECT COUNT(*) FROM news_reactions WHERE user_id = $1 AND reaction = 'like'", user_id
    )
    for t in [1, 10, 30, 50, 100, 250, 500, 1000]:
        if count >= t:
            await grant_by_slug(db, user_id, f"likes_{t}")


async def check_comments(db: asyncpg.Connection, user_id: int):
    count = await db.fetchval(
        "SELECT COUNT(*) FROM news_comments WHERE user_id = $1", user_id
    )
    for t in [1, 10, 30, 50, 100, 250, 500, 1000]:
        if count >= t:
            await grant_by_slug(db, user_id, f"comments_{t}")


async def check_charged(db: asyncpg.Connection, user_id: int):
    """Заряженный: дискорд + твич + хотя бы 1 игровой аккаунт"""
    user = await db.fetchrow(
        "SELECT discord_id, twitch_username FROM users WHERE id = $1", user_id
    )
    if not user:
        return
    has_game = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM game_accounts WHERE user_id = $1)", user_id
    )
    if user["discord_id"] and user["twitch_username"] and has_game:
        await grant_by_slug(db, user_id, "charged")


async def check_rank_achievement(db: asyncpg.Connection, user_id: int, rank: str):
    RANK_SLUGS = {
        "🐛 Слизняк": "rank_sliznyak",
        "🧟 Болотный житель": "rank_bolotny",
        "🪓 Дикарь": "rank_dikar",
        "🐗 Зверь": "rank_zver",
        "🏕️ Житель леса": "rank_zhitel",
        "🌲 Смотрящий за лесом": "rank_smotrashchiy",
    }
    slug = RANK_SLUGS.get(rank)
    if slug:
        await grant_by_slug(db, user_id, slug)
