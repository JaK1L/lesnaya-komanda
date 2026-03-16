"""
Маршруты для работы с профилем пользователя
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Any, Dict, Optional
import asyncpg
from datetime import datetime, timezone

from ..database import get_db
from ..schemas import ProfileResponse, ProfileUpdate
from ..services.profile_service import ProfileService
from ..services.user_identity import resolve_user_by_identifier
from ..auth import get_current_user, get_optional_current_user, User

router = APIRouter()
XP_PER_LEVEL = 1000


def _is_owner(current_user: Optional[User], owner_user_id: int) -> bool:
    return current_user is not None and current_user.id == owner_user_id


async def _ensure_profile_visible(
    db: asyncpg.Connection,
    profile_identifier: str,
    current_user: Optional[User],
) -> Dict[str, Any]:
    row = await resolve_user_by_identifier(db, profile_identifier)

    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")

    if row["is_hidden"] and not _is_owner(current_user, row["id"]):
        raise HTTPException(status_code=403, detail="This profile is hidden")

    return dict(row)


@router.get("/profile/public/{profile_identifier}")
async def get_public_profile(
    profile_identifier: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_optional_current_user),
):
    """
    Get public profile by Discord ID
    
    No authentication required.
    Returns profile if user exists and hasn't hidden their profile.
    """
    try:
        profile_meta = await resolve_user_by_identifier(db, profile_identifier)
        if not profile_meta:
            raise HTTPException(status_code=404, detail="Profile not found")

        user_id = profile_meta["id"]

        # Fetch user profile
        row = await db.fetchrow(
            """
            SELECT
                id,
                discord_id,
                user_tag,
                site_nickname,
                discord_username,
                avatar_url,
                bio,
                is_hidden,
                forest_rank,
                rating,
                joined_at,
                level,
                current_xp,
                total_xp,
                points,
                twitch_username
            FROM users
            WHERE id = $1
            """,
            user_id
        )

        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")

        # Check if profile is hidden (owner can always view their own)
        if row['is_hidden'] and not _is_owner(current_user, row['id']):
            raise HTTPException(status_code=403, detail="This profile is hidden")

        # banner_url — optional column, may not exist yet
        try:
            banner_url = await db.fetchval("SELECT banner_url FROM users WHERE id = $1", user_id)
        except Exception:
            banner_url = None

        # Roles — tables may not exist yet
        try:
            roles_rows = await db.fetch(
                "SELECT r.id, r.name, r.color FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1 ORDER BY r.name",
                user_id
            )
            roles = [{"id": r["id"], "name": r["name"], "color": r.get("color", "#9147ff")} for r in roles_rows]
        except Exception:
            roles = []

        # Tournament stats
        tourney_stats = {"played": 0, "wins": 0}
        try:
            played = await db.fetchval(
                "SELECT COUNT(*) FROM tournament_registrations WHERE user_id = $1", user_id
            ) or 0
            wins = await db.fetchval(
                """SELECT COUNT(*) FROM tournaments t
                   JOIN tournament_registrations tr ON tr.tournament_id = t.id
                   WHERE tr.user_id = $1 AND t.status = 'completed'
                   AND (t.winner = tr.nickname OR t.winner = tr.team_name)""",
                user_id
            ) or 0
            tourney_stats = {"played": int(played), "wins": int(wins)}
        except Exception:
            pass

        return {
            "user_id": row["id"],
            "discord_id": row['discord_id'],
            "is_owner": _is_owner(current_user, row["id"]),
            "user_tag": row.get('user_tag'),
            "site_nickname": row['site_nickname'],
            "discord_username": row['discord_username'],
            "avatar_url": row['avatar_url'],
            "banner_url": banner_url,
            "bio": row['bio'],
            "is_hidden": row['is_hidden'],
            "forest_rank": row['forest_rank'],
            "rating": row['rating'],
            "joined_at": row['joined_at'],
            "level": row.get('level', 1),
            "current_xp": row.get('current_xp', 0),
            "total_xp": row.get('total_xp', 0),
            "xp_for_next_level": XP_PER_LEVEL,
            "points": row.get('points', 0),
            "tourney_stats": tourney_stats,
            "twitch_username": row.get('twitch_username'),
            "roles": roles,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] get_public_profile({profile_identifier}): {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching profile: {str(e)}"
        )


@router.get("/profile/public/{profile_identifier}/media")
async def get_user_media(
    profile_identifier: str,
    offset: int = 0,
    limit: int = 20,
    db: asyncpg.Connection = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get media uploaded by a user (public)."""
    profile_meta = await _ensure_profile_visible(db, profile_identifier, current_user)
    offset = max(0, offset)
    limit = max(1, min(limit, 100))

    rows = await db.fetch(
        """
        SELECT m.id, m.user_id, m.title, m.description, m.media_type, m.file_url, m.created_at,
               COALESCE(u.site_nickname, u.discord_username) AS username, u.avatar_url
        FROM media_items m
        JOIN users u ON u.id = m.user_id
        WHERE m.user_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
        """,
        profile_meta["id"], limit, offset,
    )
    return [dict(r) for r in rows]


@router.get("/profile/public/{profile_identifier}/activity")
async def get_public_activity(
    profile_identifier: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get public activity summary for a user profile."""
    profile_meta = await _ensure_profile_visible(db, profile_identifier, current_user)
    target_discord_id = profile_meta.get("discord_id")

    message_count = 0
    voice_hours = 0.0
    recent_messages = []
    recent_voice = []
    collector_state = "active"
    collector_message = None
    last_presence_sync_at = None

    if target_discord_id is None:
        return {
            "message_count": message_count,
            "voice_hours": voice_hours,
            "recent_messages": [],
            "recent_voice": [],
            "collector_state": "not_linked",
            "collector_message": "Discord аккаунт не привязан к этому профилю.",
            "last_presence_sync_at": None,
        }

    try:
        latest_presence_sync = await db.fetchval(
            "SELECT MAX(updated_at) FROM discord_presence"
        )
        user_presence_sync = await db.fetchval(
            "SELECT updated_at FROM discord_presence WHERE discord_id = $1",
            target_discord_id,
        )

        if latest_presence_sync:
            last_presence_sync_at = latest_presence_sync.isoformat()

        message_count = int(
            await db.fetchval(
                "SELECT COUNT(*) FROM activity_log WHERE discord_id = $1",
                target_discord_id,
            ) or 0
        )

        voice_seconds = float(
            await db.fetchval(
                """SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (left_at - joined_at))), 0)
                   FROM voice_sessions WHERE discord_id = $1 AND left_at IS NOT NULL""",
                target_discord_id,
            ) or 0
        )
        voice_hours = round(voice_seconds / 3600, 1)

        recent_messages = await db.fetch(
            """SELECT type, channel, created_at
               FROM activity_log
               WHERE discord_id = $1
               ORDER BY created_at DESC
               LIMIT 10""",
            target_discord_id,
        )

        recent_voice = await db.fetch(
            """SELECT channel, joined_at, left_at
               FROM voice_sessions
               WHERE discord_id = $1 AND left_at IS NOT NULL
               ORDER BY joined_at DESC
               LIMIT 5""",
            target_discord_id,
        )

        has_user_activity = bool(
            message_count > 0 or voice_hours > 0 or recent_messages or recent_voice
        )
        if not has_user_activity:
            now = datetime.now(timezone.utc)
            if latest_presence_sync is None:
                collector_state = "bot_unavailable"
                collector_message = "Discord-бот ещё не запущен или не пишет данные в базу."
            else:
                latest_sync_utc = (
                    latest_presence_sync.replace(tzinfo=timezone.utc)
                    if latest_presence_sync.tzinfo is None
                    else latest_presence_sync.astimezone(timezone.utc)
                )
                is_stale = (now - latest_sync_utc).total_seconds() > 30 * 60

                if is_stale:
                    collector_state = "bot_unavailable"
                    collector_message = "Discord-бот давно не обновлял статистику. Проверь worker и intents."
                elif user_presence_sync is None:
                    collector_state = "user_no_data"
                    collector_message = "Бот работает, но активности этого пользователя пока не зафиксировано."
                else:
                    collector_state = "user_no_data"
                    collector_message = "Для этого пользователя пока нет сообщений или голосовых сессий в статистике."
    except (asyncpg.UndefinedTableError, asyncpg.UndefinedColumnError):
        # Activity tables may be absent in some environments.
        collector_state = "bot_unavailable"
        collector_message = "Таблицы Discord-статистики ещё не созданы в базе данных."

    return {
        "message_count": message_count,
        "voice_hours": voice_hours,
        "collector_state": collector_state,
        "collector_message": collector_message,
        "last_presence_sync_at": last_presence_sync_at,
        "recent_messages": [
            {
                "type": r["type"],
                "channel": r["channel"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in recent_messages
        ],
        "recent_voice": [
            {
                "channel": r["channel"],
                "joined_at": r["joined_at"].isoformat() if r["joined_at"] else None,
                "left_at": r["left_at"].isoformat() if r["left_at"] else None,
                "duration_minutes": round(
                    (r["left_at"] - r["joined_at"]).total_seconds() / 60
                ) if r["left_at"] and r["joined_at"] else 0,
            }
            for r in recent_voice
        ],
    }


@router.get("/profile/public/{profile_identifier}/registrations")
async def get_public_registrations(
    profile_identifier: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get public tournament registrations for a user profile."""
    meta = await _ensure_profile_visible(db, profile_identifier, current_user)

    try:
        rows = await db.fetch(
            """
            SELECT t.id, t.title, t.game, t.status, t.start_date, t.prize,
                   tr.nickname, tr.team_name, tr.registered_at
            FROM tournament_registrations tr
            JOIN tournaments t ON t.id = tr.tournament_id
            WHERE tr.user_id = $1
            ORDER BY tr.registered_at DESC
            """,
            meta["id"],
        )
        return [dict(r) for r in rows]
    except (asyncpg.UndefinedTableError, asyncpg.UndefinedColumnError):
        return []


@router.get("/profile/debug")
async def debug_profile(
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """Debug endpoint to check user authentication"""
    try:
        # Check if user exists in database
        row = await db.fetchrow(
            "SELECT id, discord_id, discord_username FROM users WHERE id = $1",
            current_user.id
        )
        
        return {
            "current_user_id": current_user.id,
            "current_user_username": current_user.username,
            "current_user_role": current_user.role,
            "db_user": dict(row) if row else None
        }
    except Exception as e:
        return {
            "error": str(e),
            "current_user_id": current_user.id,
            "current_user_username": current_user.username
        }


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get current user's profile data
    
    Requires authentication via JWT token.
    Returns profile information including site_nickname, bio, avatar, etc.
    """
    service = ProfileService(db)
    
    try:
        print(f"[DEBUG] Getting profile for user_id: {current_user.id}")
        profile = await service.get_user_profile(current_user.id)
        
        if not profile:
            print(f"[DEBUG] Profile not found for user_id: {current_user.id}")
            raise HTTPException(status_code=404, detail="Profile not found")
        
        print(f"[DEBUG] Profile found: {profile.discord_username}")
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error fetching profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching profile: {str(e)}"
        )


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Update current user's profile data
    
    Requires authentication via JWT token.
    Updates profile fields in a single atomic transaction.
    All fields are validated before persistence.
    """
    service = ProfileService(db)
    
    try:
        updated_profile = await service.update_user_profile(current_user.id, data)
        return updated_profile
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating profile: {str(e)}"
        )


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Upload avatar file for current user
    
    Requires authentication via JWT token.
    Accepts JPEG, PNG, GIF, WebP formats up to 5MB.
    Returns the new avatar URL.
    """
    service = ProfileService(db)
    
    try:
        # Delete old avatar if exists
        await service.delete_old_avatar(current_user.id)
        
        # Save new avatar file
        avatar_url = await service.save_avatar_file(current_user.id, file)
        
        # Update database with new avatar URL
        await db.execute(
            "UPDATE users SET avatar_url = $1 WHERE id = $2",
            avatar_url,
            current_user.id
        )
        
        return {
            "status": "success",
            "avatar_url": avatar_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading avatar: {str(e)}"
        )


@router.post("/profile/twitch")
async def link_twitch(
    twitch_username: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Привязать Twitch-аккаунт к профилю."""
    username = twitch_username.strip().lstrip('@')
    if not username:
        raise HTTPException(status_code=400, detail="Некорректный username")
    await db.execute(
        "UPDATE users SET twitch_username = $1 WHERE id = $2",
        username, current_user.id,
    )
    return {"message": "Twitch привязан", "twitch_username": username}


@router.delete("/profile/twitch")
async def unlink_twitch(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Отвязать Twitch-аккаунт."""
    await db.execute("UPDATE users SET twitch_username = NULL WHERE id = $1", current_user.id)
    return {"message": "Twitch отвязан"}


@router.get("/profile/activity")
async def get_my_activity(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить активность текущего пользователя и авто-выдать достижения."""
    discord_id = await db.fetchval("SELECT discord_id FROM users WHERE id = $1", current_user.id)
    if not discord_id:
        return {"message_count": 0, "voice_hours": 0, "recent_messages": [], "recent_voice": [], "achievements": []}

    # Счётчики активности
    message_count = await db.fetchval(
        "SELECT COUNT(*) FROM activity_log WHERE discord_id = $1", discord_id
    ) or 0

    voice_seconds = await db.fetchval(
        """SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (left_at - joined_at))), 0)
           FROM voice_sessions WHERE discord_id = $1 AND left_at IS NOT NULL""",
        discord_id,
    ) or 0
    voice_hours = float(voice_seconds) / 3600

    # Последние 10 активностей
    recent_messages = await db.fetch(
        """SELECT type, channel, created_at FROM activity_log
           WHERE discord_id = $1 ORDER BY created_at DESC LIMIT 10""",
        discord_id,
    )

    recent_voice = await db.fetch(
        """SELECT channel, joined_at, left_at FROM voice_sessions
           WHERE discord_id = $1 AND left_at IS NOT NULL ORDER BY joined_at DESC LIMIT 5""",
        discord_id,
    )

    # Авто-выдача достижений по порогам
    try:
        await _auto_grant_achievements(db, current_user.id, discord_id, message_count, voice_hours)
    except Exception:
        pass  # Не блокируем ответ если авто-выдача сломалась

    # Последние достижения пользователя
    achievements = await db.fetch(
        """SELECT ua.earned_at, at.name, at.icon, at.points
           FROM user_achievements ua
           JOIN achievement_types at ON ua.achievement_type_id = at.id
           WHERE ua.user_id = $1 AND ua.is_completed = true
           ORDER BY ua.earned_at DESC NULLS LAST LIMIT 10""",
        current_user.id,
    )

    return {
        "message_count": int(message_count),
        "voice_hours": round(voice_hours, 1),
        "recent_messages": [
            {"type": r["type"], "channel": r["channel"], "created_at": r["created_at"].isoformat() if r["created_at"] else None}
            for r in recent_messages
        ],
        "recent_voice": [
            {
                "channel": r["channel"],
                "joined_at": r["joined_at"].isoformat() if r["joined_at"] else None,
                "left_at": r["left_at"].isoformat() if r["left_at"] else None,
                "duration_minutes": round(
                    (r["left_at"] - r["joined_at"]).total_seconds() / 60
                ) if r["left_at"] and r["joined_at"] else 0,
            }
            for r in recent_voice
        ],
        "achievements": [
            {"name": a["name"], "icon": a["icon"], "points": a["points"], "earned_at": a["earned_at"].isoformat() if a["earned_at"] else None}
            for a in achievements
        ],
    }


def _rank_for_level(level: int) -> str:
    """Вернуть ранг по уровню."""
    if level >= 501:
        return '🌲 Смотрящий за лесом'
    if level >= 71:
        return '🏕️ Житель леса'
    if level >= 51:
        return '🐗 Зверь'
    if level >= 31:
        return '🪓 Дикарь'
    if level >= 11:
        return '🧟 Болотный житель'
    return '🐛 Слизняк'


async def _auto_grant_achievements(db, user_id: int, discord_id: int, message_count: int, voice_hours: float):
    """Авто-выдать достижения по порогам активности."""
    # Достижения которые уже есть
    existing = {
        r["achievement_type_id"]
        for r in await db.fetch(
            "SELECT achievement_type_id FROM user_achievements WHERE user_id = $1", user_id
        )
    }

    # Таблица порогов: (category, requirement_type, threshold, achievement_name)
    msg_thresholds = [
        ("activity", "messages", 1, "Первые шаги"),
        ("activity", "messages", 100, "Болтун"),
        ("activity", "messages", 500, "Говорун"),
        ("activity", "messages", 1000, "Легенда чата"),
    ]
    voice_thresholds = [
        ("voice", "voice_hours", 10, "Слушатель"),
        ("voice", "voice_hours", 50, "Собеседник"),
        ("voice", "voice_hours", 100, "Радиоведущий"),
    ]

    for _cat, _req, threshold, name in msg_thresholds:
        if message_count >= threshold:
            row = await db.fetchrow("SELECT id, points FROM achievement_types WHERE name = $1 AND is_active = true", name)
            if row and row["id"] not in existing:
                await db.execute(
                    """INSERT INTO user_achievements (user_id, achievement_type_id, progress, max_progress, is_completed, earned_at)
                       VALUES ($1, $2, 100, 100, true, NOW()) ON CONFLICT DO NOTHING""",
                    user_id, row["id"],
                )
                await db.execute(
                    "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2",
                    row["points"], user_id,
                )

    for _cat, _req, threshold, name in voice_thresholds:
        if voice_hours >= threshold:
            row = await db.fetchrow("SELECT id, points FROM achievement_types WHERE name = $1 AND is_active = true", name)
            if row and row["id"] not in existing:
                await db.execute(
                    """INSERT INTO user_achievements (user_id, achievement_type_id, progress, max_progress, is_completed, earned_at)
                       VALUES ($1, $2, 100, 100, true, NOW()) ON CONFLICT DO NOTHING""",
                    user_id, row["id"],
                )
                await db.execute(
                    "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2",
                    row["points"], user_id,
                )

    # "Первые шаги" — просто наличие discord_id
    row = await db.fetchrow("SELECT id, points FROM achievement_types WHERE name = 'Первые шаги' AND is_active = true")
    if row and row["id"] not in existing:
        await db.execute(
            """INSERT INTO user_achievements (user_id, achievement_type_id, progress, max_progress, is_completed, earned_at)
               VALUES ($1, $2, 100, 100, true, NOW()) ON CONFLICT DO NOTHING""",
            user_id, row["id"],
        )
        await db.execute(
            "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2",
            row["points"], user_id,
        )

    # "Старожил" — год в сообществе
    joined = await db.fetchval("SELECT joined_at FROM users WHERE id = $1", user_id)
    if joined:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        joined_aware = joined.replace(tzinfo=timezone.utc) if joined.tzinfo is None else joined
        if (now - joined_aware).days >= 365:
            row = await db.fetchrow("SELECT id, points FROM achievement_types WHERE name = 'Старожил' AND is_active = true")
            if row and row["id"] not in existing:
                await db.execute(
                    """INSERT INTO user_achievements (user_id, achievement_type_id, progress, max_progress, is_completed, earned_at)
                       VALUES ($1, $2, 100, 100, true, NOW()) ON CONFLICT DO NOTHING""",
                    user_id, row["id"],
                )
                await db.execute(
                    "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2",
                    row["points"], user_id,
                )

    # "Легенда" — все достижения получены
    total_types = await db.fetchval("SELECT COUNT(*) FROM achievement_types WHERE is_active = true AND name != 'Легенда'")
    completed_count = await db.fetchval(
        "SELECT COUNT(*) FROM user_achievements WHERE user_id = $1 AND is_completed = true", user_id
    )
    if total_types and completed_count and completed_count >= total_types:
        row = await db.fetchrow("SELECT id, points FROM achievement_types WHERE name = 'Легенда' AND is_active = true")
        if row and row["id"] not in existing:
            await db.execute(
                """INSERT INTO user_achievements (user_id, achievement_type_id, progress, max_progress, is_completed, earned_at)
                   VALUES ($1, $2, 100, 100, true, NOW()) ON CONFLICT DO NOTHING""",
                user_id, row["id"],
            )
            await db.execute(
                "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2",
                row["points"], user_id,
            )

    # Обновить ранг по уровню
    level = await db.fetchval("SELECT COALESCE(level, 0) FROM users WHERE id = $1", user_id) or 0
    new_rank = _rank_for_level(level)
    await db.execute("UPDATE users SET forest_rank = $1 WHERE id = $2", new_rank, user_id)


@router.get("/profile/my-registrations")
async def my_registrations(
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    """Список турниров, на которые зарегистрирован текущий пользователь."""
    rows = await db.fetch(
        """
        SELECT t.id, t.title, t.game, t.status, t.start_date, t.prize,
               tr.nickname, tr.team_name, tr.registered_at
        FROM tournament_registrations tr
        JOIN tournaments t ON t.id = tr.tournament_id
        WHERE tr.user_id = $1
        ORDER BY tr.registered_at DESC
        """,
        current_user.id,
    )
    return [dict(r) for r in rows]


@router.post("/profile/banner")
async def upload_banner(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    service = ProfileService(db)
    await service.delete_old_banner(current_user.id)
    banner_url = await service.save_banner_file(current_user.id, file)
    # Gracefully handle environments where the banner_url migration
    # has not been applied yet.
    await db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500)")
    await db.execute("UPDATE users SET banner_url = $1 WHERE id = $2", banner_url, current_user.id)
    return {"banner_url": banner_url}


@router.get("/uploads/banners/{filename}")
async def get_banner(filename: str):
    upload_dir = Path(__file__).parent.parent.parent / "uploads" / "banners"
    file_path = upload_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Banner not found")
    if not str(file_path.resolve()).startswith(str(upload_dir.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    return FileResponse(file_path)


@router.get("/uploads/avatars/{filename}")
async def get_avatar(filename: str):
    """
    Serve avatar files
    
    Public endpoint for serving uploaded avatar images.
    No authentication required.
    """
    upload_dir = Path(__file__).parent.parent.parent / "uploads" / "avatars"
    file_path = upload_dir / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Avatar not found")
    
    # Security check: ensure file is within upload directory
    if not str(file_path.resolve()).startswith(str(upload_dir.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return FileResponse(file_path)
