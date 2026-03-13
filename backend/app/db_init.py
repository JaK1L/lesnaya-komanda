"""
Инициализация схемы базы данных при старте приложения.
"""
import logging

from .auth import get_password_hash
from .config import settings
from .database import database

logger = logging.getLogger(__name__)


async def init_db():
    """Создаёт таблицы и применяет inline-миграции при первом запуске."""
    try:
        async with database.get_connection() as conn:
            await _create_core_tables(conn)
            await _create_streamers_table(conn)
            await _create_merch_table(conn)
            await _create_roles_tables(conn)
            await _seed_initial_data(conn)
            await _ensure_admin(conn)
            await _migrate_achievements(conn)
            await _cleanup_legacy_achievements(conn)
            await _migrate_game_accounts(conn)
            await _migrate_xp_system(conn)
            await _migrate_missing_columns(conn)
            await _migrate_showcase(conn)

            users_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            games_count = await conn.fetchval("SELECT COUNT(*) FROM game_profiles")
            achievements_count = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
            logger.info(
                f"DB ready: {users_count} users, {games_count} game profiles, "
                f"{achievements_count} achievements"
            )
            logger.info("Database fully initialized")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)


async def _create_core_tables(conn):
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            discord_id BIGINT UNIQUE,
            discord_username VARCHAR(100),
            forest_rank VARCHAR(50) DEFAULT '🐛 Слизняк',
            rating FLOAT DEFAULT 0,
            joined_at TIMESTAMP,
            last_seen TIMESTAMP DEFAULT NOW(),
            avatar_url TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    ''')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS game_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            game VARCHAR(50),
            game_username VARCHAR(100),
            rank VARCHAR(50),
            stats JSONB,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ''')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS achievements (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            achievement_name VARCHAR(100),
            achievement_icon VARCHAR(50),
            game VARCHAR(50),
            earned_at TIMESTAMP DEFAULT NOW()
        )
    ''')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(200) NOT NULL,
            role VARCHAR(20) DEFAULT 'editor',
            created_at TIMESTAMP DEFAULT NOW()
        )
    ''')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS activity_log (
            id SERIAL PRIMARY KEY,
            discord_id BIGINT,
            username VARCHAR(100),
            type VARCHAR(20),
            channel VARCHAR(100),
            content TEXT,
            created_at TIMESTAMP
        )
    ''')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_activity_discord_id ON activity_log(discord_id)')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at)')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS voice_sessions (
            id SERIAL PRIMARY KEY,
            discord_id BIGINT,
            channel VARCHAR(100),
            joined_at TIMESTAMP,
            left_at TIMESTAMP
        )
    ''')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_voice_sessions_discord_id ON voice_sessions(discord_id)')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS discord_presence (
            discord_id BIGINT PRIMARY KEY,
            status VARCHAR(20),
            activity_name VARCHAR(200),
            activity_type VARCHAR(30),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ''')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_presence_status ON discord_presence(status)')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_presence_updated_at ON discord_presence(updated_at)')
    await conn.execute('''
        ALTER TABLE discord_presence
        ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS activity_started_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS game_icon_url TEXT
    ''')
    await conn.execute(
        'CREATE INDEX IF NOT EXISTS idx_presence_activity_started '
        'ON discord_presence(activity_started_at DESC)'
    )

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS home_feed (
            id SERIAL PRIMARY KEY,
            kind VARCHAR(20) NOT NULL,
            title VARCHAR(200) NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    ''')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS site_settings (
            key VARCHAR(50) PRIMARY KEY,
            value JSONB NOT NULL
        )
    ''')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS news (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            content TEXT,
            author_id INTEGER REFERENCES admin_users(id),
            published BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP
        )
    ''')

    await conn.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            game VARCHAR(50),
            event_date TIMESTAMP,
            created_by INTEGER REFERENCES admin_users(id),
            participants INTEGER[] DEFAULT '{}',
            status VARCHAR(30) DEFAULT 'Планируется'
        )
    ''')

    logger.info("Core tables created or already exist")


async def _create_streamers_table(conn):
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS streamers (
            id SERIAL PRIMARY KEY,
            twitch_username VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(100) NOT NULL,
            avatar_url TEXT,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ''')
    await conn.execute(
        'CREATE INDEX IF NOT EXISTS idx_streamers_active ON streamers(is_active, display_order)'
    )
    await conn.execute(
        'CREATE INDEX IF NOT EXISTS idx_streamers_username ON streamers(LOWER(twitch_username))'
    )
    logger.info("Streamers table created or already exists")


async def _seed_initial_data(conn):
    await conn.execute('''
        INSERT INTO users (discord_id, discord_username, forest_rank, rating, joined_at)
        SELECT * FROM (VALUES
            (123456789::BIGINT, 'JaK1L', '🏕️ Житель леса', 95::FLOAT, NOW()),
            (987654321::BIGINT, 'DIMA_DIMA', '🐗 Зверь', 45::FLOAT, NOW()),
            (111222333::BIGINT, 'Лесной_Дух', '🌲 Смотрящий за лесом', 72::FLOAT, NOW()),
            (444555666::BIGINT, 'Снайпер', '🧟 Болотный житель', 28::FLOAT, NOW()),
            (777888999::BIGINT, 'Стрелок', '🪓 Дикарь', 35::FLOAT, NOW())
        ) AS v(discord_id, discord_username, forest_rank, rating, joined_at)
        WHERE NOT EXISTS (SELECT 1 FROM users)
    ''')

    await conn.execute('''
        INSERT INTO achievements (user_id, achievement_name, achievement_icon, game)
        SELECT u.id, 'Первые шаги', '🌱', 'Общее'
        FROM users u
        WHERE NOT EXISTS (SELECT 1 FROM achievements)
    ''')


async def _ensure_admin(conn):
    admin_username = settings.ADMIN_USERNAME
    admin_password = settings.ADMIN_PASSWORD

    existing_admin = await conn.fetchrow(
        "SELECT id, username FROM admin_users WHERE username = $1 OR username = 'admin'",
        admin_username
    )

    admin_hash = get_password_hash(admin_password)
    await conn.execute(
        """
        INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, 'admin')
        ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = 'admin'
        """,
        admin_username, admin_hash
    )
    logger.info(f"Admin upserted: {admin_username}")

    await conn.execute(
        "DELETE FROM admin_users WHERE username = 'admin' AND username != $1",
        admin_username
    )


async def _create_merch_table(conn):
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS merch (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            price FLOAT NOT NULL,
            image_url VARCHAR(500),
            category VARCHAR(100),
            sizes VARCHAR(100),
            in_stock BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    ''')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_merch_in_stock ON merch(in_stock, display_order)')
    logger.info("Merch table created or already exists")


async def _create_roles_tables(conn):
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            color VARCHAR(7) NOT NULL DEFAULT '#99aab5',
            created_at TIMESTAMP DEFAULT NOW()
        )
    ''')
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (user_id, role_id)
        )
    ''')
    logger.info("Roles tables created or already exist")


async def _migrate_missing_columns(conn):
    """Добавляет недостающие колонки в существующие таблицы."""
    logger.info("Applying missing columns migration...")
    try:
        # Колонки таблицы users
        await conn.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS site_nickname VARCHAR(100),
            ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS real_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS team_role VARCHAR(100),
            ADD COLUMN IF NOT EXISTS twitch_username VARCHAR(100),
            ADD COLUMN IF NOT EXISTS telegram_url VARCHAR(200),
            ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(200),
            ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(200),
            ADD COLUMN IF NOT EXISTS is_team_member BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS team_order INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS user_tag VARCHAR(10),
            ADD COLUMN IF NOT EXISTS game_preferences JSONB DEFAULT '[]'
        """)

        # Колонки таблицы news
        await conn.execute("""
            ALTER TABLE news
            ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
            ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'
        """)

        # Колонки таблицы events
        await conn.execute("""
            ALTER TABLE events
            ADD COLUMN IF NOT EXISTS telegram_url VARCHAR(500),
            ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP
        """)

        logger.info("Missing columns migration applied")
    except Exception as e:
        logger.error(f"Missing columns migration failed: {e}", exc_info=True)


async def _migrate_achievements(conn):
    # Всегда гарантируем наличие ОБЕИХ таблиц
    types_exists = await conn.fetchval("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'achievement_types'
        )
    """)
    ua_exists = await conn.fetchval("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements'
        )
    """)
    logger.info("Applying achievements migration...")
    try:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS achievement_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(50) DEFAULT '🏆',
                category VARCHAR(50) DEFAULT 'general',
                requirement JSONB,
                points INTEGER DEFAULT 10,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_achievement_types_category ON achievement_types(category);
            CREATE INDEX IF NOT EXISTS idx_achievement_types_active ON achievement_types(is_active);

            CREATE TABLE IF NOT EXISTS user_achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                achievement_type_id INTEGER REFERENCES achievement_types(id) ON DELETE CASCADE,
                progress INTEGER DEFAULT 0,
                max_progress INTEGER DEFAULT 100,
                earned_at TIMESTAMP,
                is_completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, achievement_type_id)
            );
            CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type_id);
            CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);
            CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);
        ''')

        # Seed new auto-grant achievements by slug
        new_achievements = [
            # Registration
            ('Новорег', 'Добро пожаловать в Лесную Команду!', '🌱', 'general', '{"slug":"register"}', 5),
            ('Дискордный', 'Привязал Discord аккаунт', '💜', 'general', '{"slug":"discord_linked"}', 5),
            ('Заряженный', 'Привязал все возможные аккаунты', '⚡', 'special', '{"slug":"charged"}', 50),
            # Ranks
            ('Слизняк', 'Получил ранг Слизняк', '🐛', 'ranks', '{"slug":"rank_sliznyak"}', 0),
            ('Болотный житель', 'Получил ранг Болотный житель', '🧟', 'ranks', '{"slug":"rank_bolotny"}', 10),
            ('Дикарь', 'Получил ранг Дикарь', '🪓', 'ranks', '{"slug":"rank_dikar"}', 25),
            ('Зверь', 'Получил ранг Зверь', '🐗', 'ranks', '{"slug":"rank_zver"}', 50),
            ('Житель леса', 'Получил ранг Житель леса', '🏕️', 'ranks', '{"slug":"rank_zhitel"}', 100),
            ('Смотрящий за лесом', 'Получил ранг Смотрящий за лесом', '🌲', 'ranks', '{"slug":"rank_smotrashchiy"}', 200),
            # Likes
            ('Первый лайк', 'Поставил первый лайк', '👍', 'activity', '{"slug":"likes_1"}', 5),
            ('Активный читатель', 'Поставил 10 лайков', '📖', 'activity', '{"slug":"likes_10"}', 10),
            ('Завсегдатай', 'Поставил 30 лайков', '☕', 'activity', '{"slug":"likes_30"}', 15),
            ('Преданный фанат', 'Поставил 50 лайков', '❤️', 'activity', '{"slug":"likes_50"}', 20),
            ('Кнопкожим', 'Поставил 100 лайков', '🖱️', 'activity', '{"slug":"likes_100"}', 30),
            ('Лайкомёт', 'Поставил 250 лайков', '🎯', 'activity', '{"slug":"likes_250"}', 50),
            ('Мастер лайков', 'Поставил 500 лайков', '⭐', 'activity', '{"slug":"likes_500"}', 75),
            ('Легенда одобрения', 'Поставил 1000 лайков', '👑', 'activity', '{"slug":"likes_1000"}', 150),
            # Comments
            ('Первый голос', 'Оставил первый комментарий', '💬', 'activity', '{"slug":"comments_1"}', 5),
            ('Собеседник_к', 'Оставил 10 комментариев', '🗣️', 'activity', '{"slug":"comments_10"}', 10),
            ('Активный комментатор', 'Оставил 30 комментариев', '📝', 'activity', '{"slug":"comments_30"}', 15),
            ('Эксперт мнений', 'Оставил 50 комментариев', '💡', 'activity', '{"slug":"comments_50"}', 20),
            ('Трибун', 'Оставил 100 комментариев', '📢', 'activity', '{"slug":"comments_100"}', 30),
            ('Оратор', 'Оставил 250 комментариев', '🎤', 'activity', '{"slug":"comments_250"}', 50),
            ('Мастер слова', 'Оставил 500 комментариев', '✍️', 'activity', '{"slug":"comments_500"}', 75),
            ('Голос сообщества', 'Оставил 1000 комментариев', '👑', 'activity', '{"slug":"comments_1000"}', 150),
        ]
        for (name, desc, icon, cat, req, pts) in new_achievements:
            await conn.execute(
                """INSERT INTO achievement_types (name, description, icon, category, requirement, points)
                   SELECT $1,$2,$3,$4,$5::jsonb,$6
                   WHERE NOT EXISTS (SELECT 1 FROM achievement_types WHERE requirement->>'slug' = $7)""",
                name, desc, icon, cat, req, pts, __import__('json').loads(req)['slug'],
            )

        logger.info("Achievements migration applied")
    except Exception as e:
        logger.error(f"Achievements migration failed: {e}", exc_info=True)


async def _cleanup_legacy_achievements(conn):
    """Удаляет старые достижения без slug, исправляет кириллический slug."""
    try:
        # Fix old Cyrillic slug if present
        await conn.execute("""
            UPDATE achievement_types
            SET requirement = jsonb_set(requirement, '{slug}', '"rank_smotrashchiy"')
            WHERE requirement->>'slug' = 'rank_smotrящiy'
        """)

        deleted = await conn.fetchval("""
            WITH deleted AS (
                DELETE FROM achievement_types
                WHERE requirement IS NULL
                   OR requirement->>'slug' IS NULL
                   OR requirement->>'slug' = ''
                RETURNING id
            )
            SELECT COUNT(*) FROM deleted
        """)
        if deleted:
            logger.info(f"Cleaned up {deleted} legacy achievement types")
    except Exception as e:
        logger.error(f"Legacy achievements cleanup failed: {e}", exc_info=True)


async def _migrate_game_accounts(conn):
    exists = await conn.fetchval("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'game_accounts'
        )
    """)
    if exists:
        return

    logger.info("Applying game_accounts migration...")
    try:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS game_accounts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                game VARCHAR(50) NOT NULL,
                account_id VARCHAR(200) NOT NULL,
                account_tag VARCHAR(50),
                region VARCHAR(20),
                linked_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, game)
            );
            CREATE INDEX IF NOT EXISTS idx_game_accounts_user ON game_accounts(user_id);
            CREATE INDEX IF NOT EXISTS idx_game_accounts_game ON game_accounts(game);
        ''')
        logger.info("game_accounts migration applied")
    except Exception as e:
        logger.error(f"game_accounts migration failed: {e}", exc_info=True)


async def _migrate_xp_system(conn):
    exists = await conn.fetchval("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'level'
        )
    """)
    if exists:
        return

    logger.info("Applying XP system migration...")
    try:
        await conn.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

            CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC, current_xp DESC);
            CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

            CREATE TABLE IF NOT EXISTS xp_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                discord_id BIGINT,
                type VARCHAR(20) NOT NULL,
                amount INTEGER NOT NULL,
                reason VARCHAR(200) NOT NULL,
                source VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW(),
                created_by INTEGER REFERENCES admin_users(id)
            );
            CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_xp_transactions_discord ON xp_transactions(discord_id);
            CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

            CREATE TABLE IF NOT EXISTS points_purchases (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                discord_id BIGINT,
                item_name VARCHAR(200) NOT NULL,
                cost INTEGER NOT NULL,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_points_purchases_user ON points_purchases(user_id);
        """)
        logger.info("XP system migration applied")
    except Exception as e:
        logger.error(f"XP system migration failed: {e}", exc_info=True)


async def _migrate_showcase(conn):
    """Добавляет колонку showcase_achievement_ids для витрины достижений."""
    try:
        await conn.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS showcase_achievement_ids INTEGER[] DEFAULT '{}'
        """)
        logger.info("Showcase migration applied")
    except Exception as e:
        logger.error(f"Showcase migration failed: {e}", exc_info=True)
