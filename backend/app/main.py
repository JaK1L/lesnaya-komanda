from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import asyncpg
from datetime import timedelta
import logging
import sys
import signal

from .config import settings
from .database import database, get_db
from .routes import users, auth, discord_oauth, content, websocket, discord, profile, migration, game_preferences, admin, achievements, events, game_stats
from .auth import get_password_hash
from .rate_limit import setup_rate_limiting

# Настройка логирования
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Инициализация приложения
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Жизненный цикл приложения"""
    # Запуск
    await database.connect()
    logger.info("✅ Подключение к базе данных установлено")
    
    # Инициализация базы данных
    await init_db()
    
    yield
    
    # Завершение
    await database.disconnect()
    logger.info("✅ Подключение к базе данных закрыто")

app = FastAPI(
    title="Лесная Команда API",
    description="""
    ## 🌲 API для управления игровым сообществом
    
    Полнофункциональный REST API для платформы игрового сообщества "Лесная Команда".
    
    ### Основные возможности:
    
    * **Пользователи** - управление профилями игроков, статистика, рейтинги
    * **Аутентификация** - JWT токены, OAuth через Discord
    * **Профили** - редактирование профиля, загрузка аватаров
    * **Контент** - новости, события, лента активности
    * **Discord интеграция** - статус онлайн, активность, игровые сессии
    * **Игровые предпочтения** - управление любимыми играми пользователей
    * **WebSocket** - real-time обновления Discord статуса
    
    ### Аутентификация:
    
    Большинство эндпоинтов требуют JWT токен в заголовке:
    ```
    Authorization: Bearer <your_token>
    ```
    
    Получить токен можно через `/api/token` (для админов) или `/api/discord/callback` (для пользователей).
    
    ### Окружение:
    
    - **Production**: https://api.lesnaya-komanda.com
    - **Development**: http://localhost:8000
    
    ### Контакты:
    
    - Discord: https://discord.gg/YgX4RQZ
    - GitHub: https://github.com/lesnaya-komanda
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={
        "name": "Лесная Команда",
        "url": "https://lesnaya-komanda.com",
    },
    license_info={
        "name": "MIT",
    },
    tags_metadata=[
        {
            "name": "users",
            "description": "Операции с пользователями: получение списка игроков, статистика, рейтинги, достижения",
        },
        {
            "name": "auth",
            "description": "Аутентификация и авторизация: получение JWT токенов, регистрация, проверка прав доступа",
        },
        {
            "name": "discord",
            "description": "Discord OAuth интеграция: авторизация через Discord, получение данных пользователя",
        },
        {
            "name": "profile",
            "description": "Управление профилем: редактирование данных, загрузка аватаров, настройки приватности",
        },
        {
            "name": "content",
            "description": "Публичный контент: новости, события, лента активности для главной страницы",
        },
        {
            "name": "game_preferences",
            "description": "Игровые предпочтения: управление списком любимых игр пользователя",
        },
        {
            "name": "admin",
            "description": "Админ-панель: управление новостями, событиями, лентой активности, настройками сайта (требуется авторизация)",
        },
        {
            "name": "migration",
            "description": "Временные эндпоинты для миграции данных (будут удалены в будущем)",
        },
    ],
)

# Настройка CORS
logger.info(f"🌐 CORS: Разрешенные origins: {settings.ALLOWED_ORIGINS}")
logger.info(f"🌐 DEBUG mode: {settings.DEBUG}")

# Собираем все разрешенные origins
cors_origins = list(settings.ALLOWED_ORIGINS)

# Добавляем локальные origins для разработки (если их еще нет)
local_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
for origin in local_origins:
    if origin not in cors_origins:
        cors_origins.append(origin)

# Добавляем production origins (если их еще нет)
production_origins = [
    "https://lesnaya-komanda.vercel.app",
    "https://lesnayakomanda.onrender.com",
    "https://www.lesnaya-komanda.vercel.app",  # с www
]
for origin in production_origins:
    if origin not in cors_origins:
        cors_origins.append(origin)

logger.info(f"🌐 CORS origins для middleware: {cors_origins}")

# ВАЖНО: CORSMiddleware должен быть ПЕРВЫМ!
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Requested-With",
    ],
    expose_headers=[
        "Content-Length",
        "Content-Type",
        "X-Total-Count",
    ],
    max_age=3600,  # Кэшировать preflight запросы на 1 час
)

# Настройка Rate Limiting (ПОСЛЕ CORS!)
setup_rate_limiting(app)

# Middleware для отключения кэша и логирования CORS
@app.middleware("http")
async def add_cache_control_header(request, call_next):
    # Логируем Origin для отладки CORS
    origin = request.headers.get("origin")
    if origin:
        logger.info(f"🌐 Request from origin: {origin} to {request.url.path}")
    
    # Обрабатываем OPTIONS запросы (preflight) сразу
    if request.method == "OPTIONS":
        from starlette.responses import Response
        response = Response()
        # Проверяем, что origin в списке разрешенных
        if origin and origin in cors_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = cors_origins[0] if cors_origins else "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, X-Requested-With"
        response.headers["Access-Control-Max-Age"] = "3600"
        logger.info(f"✅ OPTIONS preflight handled for {origin}")
        return response
    
    response = await call_next(request)
    
    # ФОРСИРУЕМ CORS заголовки для всех запросов
    if origin and origin in cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, X-Requested-With"
        response.headers["Access-Control-Expose-Headers"] = "Content-Length, Content-Type, X-Total-Count"
    
    # Отключаем кэш для всех API эндпоинтов
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    
    return response

# Подключение маршрутов
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(discord_oauth.router, prefix="/api", tags=["discord"])
app.include_router(discord.router, tags=["discord"])  # Discord presence API
app.include_router(content.router, prefix="/api", tags=["content"])
app.include_router(profile.router, prefix="/api", tags=["profile"])
app.include_router(game_preferences.router, tags=["game_preferences"])  # Game preferences API
app.include_router(admin.router, prefix="/api", tags=["admin"])  # Admin panel API
app.include_router(achievements.router, prefix="/api", tags=["achievements"])  # Achievements API
app.include_router(events.router, prefix="/api", tags=["events"])  # Events API
app.include_router(game_stats.router, prefix="/api", tags=["game_stats"])  # Game Stats API
app.include_router(migration.router, tags=["migration"])  # Temporary migration endpoint

# Health check endpoints
@app.get("/health", tags=["health"])
async def health_check():
    """Проверка здоровья приложения"""
    return {
        "status": "ok",
        "service": "Лесная Команда API",
        "version": "1.0.0"
    }

@app.get("/health/db", tags=["health"])
async def health_check_db(db = Depends(get_db)):
    """Проверка подключения к базе данных"""
    try:
        await db.fetchval("SELECT 1")
        return {
            "status": "ok",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Database unavailable"
        )

# WebSocket endpoint
@app.websocket("/ws/discord")
async def websocket_endpoint(ws: WebSocket, token: str = None):
    await websocket.discord_websocket(ws, token)

# Зависимость для получения соединения с БД
async def get_db():
    async with database.get_connection() as conn:
        yield conn

async def init_db():
    """Инициализация базы данных"""
    try:
        async with database.get_connection() as conn:
            # Создаём таблицу users
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    discord_id BIGINT UNIQUE,
                    discord_username VARCHAR(100),
                    forest_rank VARCHAR(50) DEFAULT '🌱 Росток',
                    rating FLOAT DEFAULT 0,
                    joined_at TIMESTAMP,
                    last_seen TIMESTAMP DEFAULT NOW(),
                    avatar_url TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            ''')
            logger.info("✅ Таблица users создана или уже существует")
            
            # Создаём таблицу game_profiles
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
            logger.info("✅ Таблица game_profiles создана или уже существует")
            
            # Создаём таблицу achievements
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
            logger.info("✅ Таблица achievements создана или уже существует")
            
            # Создаём таблицу admin_users
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS admin_users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(200) NOT NULL,
                    role VARCHAR(20) DEFAULT 'editor',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            ''')
            logger.info("✅ Таблица admin_users создана или уже существует")
            
            # Таблица activity_log (для UserService)
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
            logger.info("✅ Таблица activity_log создана или уже существует")
            
            # Таблица voice_sessions (для UserService)
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
            logger.info("✅ Таблица voice_sessions создана или уже существует")

            # Таблица discord_presence (онлайн/статус/во что играет)
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS discord_presence (
                    discord_id BIGINT PRIMARY KEY,
                    status VARCHAR(20), -- online/idle/dnd/offline
                    activity_name VARCHAR(200),
                    activity_type VARCHAR(30), -- playing/streaming/listening/watching/custom/competing
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            ''')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_presence_status ON discord_presence(status)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_presence_updated_at ON discord_presence(updated_at)')
            logger.info("✅ Таблица discord_presence создана или уже существует")
            
            # Добавляем новые колонки для расширенных данных присутствия (миграция)
            await conn.execute('''
                ALTER TABLE discord_presence 
                ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]',
                ADD COLUMN IF NOT EXISTS activity_started_at TIMESTAMP,
                ADD COLUMN IF NOT EXISTS game_icon_url TEXT
            ''')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_presence_activity_started ON discord_presence(activity_started_at DESC)')
            logger.info("✅ Расширенные колонки discord_presence добавлены (roles, activity_started_at, game_icon_url)")

            # Таблица контент-ленты (посты и достижения для главной)
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS home_feed (
                    id SERIAL PRIMARY KEY,
                    kind VARCHAR(20) NOT NULL, -- 'post' | 'achievement'
                    title VARCHAR(200) NOT NULL,
                    content TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            ''')
            logger.info("✅ Таблица home_feed создана или уже существует")

            # Таблица настроек сайта (JSON по ключу)
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS site_settings (
                    key VARCHAR(50) PRIMARY KEY,
                    value JSONB NOT NULL
                )
            ''')
            logger.info("✅ Таблица site_settings создана или уже существует")

            # Таблицы новостей и событий (на случай, если init.sql не запускали)
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
            logger.info("✅ Таблицы news и events созданы или уже существуют")
            
            # Добавляем тестовых игроков (если таблица была пуста)
            await conn.execute('''
                INSERT INTO users (discord_id, discord_username, forest_rank, rating, joined_at)
                SELECT * FROM (VALUES
                    (123456789, 'JaK1L', '🐺 Старый Волк', 95, NOW()),
                    (987654321, 'DIMA_DIMA', '🌲 Дерево', 45, NOW()),
                    (111222333, 'Лесной_Дух', '🔥 Лесной Дух', 72, NOW()),
                    (444555666, 'Снайпер', '🌿 Трава', 28, NOW()),
                    (777888999, 'Стрелок', '🪵 Бревно', 35, NOW())
                ) AS v(discord_id, discord_username, forest_rank, rating, joined_at)
                WHERE NOT EXISTS (SELECT 1 FROM users)
            ''')
            logger.info("✅ Тестовые игроки добавлены (если таблица была пуста)")
            
            # Добавляем тестовые достижения
            await conn.execute('''
                INSERT INTO achievements (user_id, achievement_name, achievement_icon, game)
                SELECT u.id, 'Первые шаги', '🌱', 'Общее'
                FROM users u
                WHERE NOT EXISTS (SELECT 1 FROM achievements)
            ''')
            logger.info("✅ Тестовые достижения добавлены")
            
            # Обновляем/создаем админа с новыми данными
            logger.info("\n🔐 Проверка администратора...")
            admin_username = settings.ADMIN_USERNAME if hasattr(settings, 'ADMIN_USERNAME') else "admin"
            admin_password = settings.ADMIN_PASSWORD if hasattr(settings, 'ADMIN_PASSWORD') else "admin123"
            
            # Проверяем существует ли админ
            existing_admin = await conn.fetchrow(
                "SELECT id, username FROM admin_users WHERE username = $1 OR username = 'admin'",
                admin_username
            )
            
            if existing_admin:
                # Обновляем существующего админа
                admin_hash = get_password_hash(admin_password)
                await conn.execute(
                    """
                    UPDATE admin_users 
                    SET username = $1, password_hash = $2, role = 'admin'
                    WHERE id = $3
                    """,
                    admin_username, admin_hash, existing_admin['id']
                )
                logger.info(f"✅ Админ обновлен: {existing_admin['username']} → {admin_username}")
            else:
                # Создаем нового админа
                admin_hash = get_password_hash(admin_password)
                await conn.execute(
                    "INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, 'admin')",
                    admin_username, admin_hash
                )
                logger.info(f"✅ Создан новый админ: {admin_username}")
            
            # Удаляем старого админа 'admin' если он остался
            await conn.execute("DELETE FROM admin_users WHERE username = 'admin' AND username != $1", admin_username)
            
            # Проверяем, что данные есть
            users_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            games_count = await conn.fetchval("SELECT COUNT(*) FROM game_profiles")
            achievements_count = await conn.fetchval("SELECT COUNT(*) FROM achievements")
            logger.info(f"📊 В базе: {users_count} игроков, {games_count} игровых профилей, {achievements_count} достижений")
            
            # Применяем миграцию системы достижений (если еще не применена)
            logger.info("\n🔄 Проверка миграции системы достижений...")
            try:
                # Проверяем есть ли таблица achievement_types
                achievement_types_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'achievement_types'
                    )
                """)
                
                if not achievement_types_exists:
                    logger.info("📝 Применение миграции системы достижений...")
                    
                    # Создаем таблицы достижений
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
                    
                    # Вставляем базовые достижения
                    await conn.execute('''
                        INSERT INTO achievement_types (name, description, icon, category, requirement, points) VALUES
                        ('Первые шаги', 'Присоединился к сообществу', '🌱', 'activity', '{"type": "join"}', 5),
                        ('Болтун', 'Отправил 100 сообщений', '💬', 'activity', '{"type": "messages", "count": 100}', 10),
                        ('Говорун', 'Отправил 500 сообщений', '🗣️', 'activity', '{"type": "messages", "count": 500}', 25),
                        ('Легенда чата', 'Отправил 1000 сообщений', '👑', 'activity', '{"type": "messages", "count": 1000}', 50),
                        ('Слушатель', 'Провел 10 часов в войсе', '🎧', 'voice', '{"type": "voice_hours", "count": 10}', 10),
                        ('Собеседник', 'Провел 50 часов в войсе', '🎤', 'voice', '{"type": "voice_hours", "count": 50}', 25),
                        ('Радиоведущий', 'Провел 100 часов в войсе', '📻', 'voice', '{"type": "voice_hours", "count": 100}', 50),
                        ('Участник', 'Посетил первое событие', '🎯', 'events', '{"type": "events_attended", "count": 1}', 10),
                        ('Активист', 'Посетил 5 событий', '⭐', 'events', '{"type": "events_attended", "count": 5}', 25),
                        ('Фанат', 'Посетил 10 событий', '🌟', 'events', '{"type": "events_attended", "count": 10}', 50),
                        ('Новичок CS2', 'Первая победа в CS2', '🔫', 'games', '{"type": "game_wins", "game": "cs2", "count": 1}', 10),
                        ('Боец CS2', '10 побед в CS2', '⚔️', 'games', '{"type": "game_wins", "game": "cs2", "count": 10}', 25),
                        ('Мастер CS2', '50 побед в CS2', '👑', 'games', '{"type": "game_wins", "game": "cs2", "count": 50}', 50),
                        ('Новичок Dota 2', 'Первая победа в Dota 2', '🛡️', 'games', '{"type": "game_wins", "game": "dota2", "count": 1}', 10),
                        ('Боец Dota 2', '10 побед в Dota 2', '⚡', 'games', '{"type": "game_wins", "game": "dota2", "count": 10}', 25),
                        ('Мастер Dota 2', '50 побед в Dota 2', '🏆', 'games', '{"type": "game_wins", "game": "dota2", "count": 50}', 50),
                        ('Старожил', 'В сообществе более года', '🎂', 'special', '{"type": "member_days", "count": 365}', 100),
                        ('Легенда', 'Получил все достижения', '💎', 'special', '{"type": "all_achievements"}', 500)
                        ON CONFLICT DO NOTHING
                    ''')
                    
                    logger.info("✅ Миграция системы достижений успешно применена!")
                else:
                    logger.info("✅ Миграция системы достижений уже применена")
            except Exception as achievements_error:
                logger.error(f"⚠️ Ошибка при применении миграции достижений: {achievements_error}", exc_info=True)

            
            # Применяем миграцию game_accounts (если еще не применена)
            logger.info("\n🔄 Проверка миграции game_accounts...")
            try:
                # Проверяем есть ли таблица game_accounts
                game_accounts_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'game_accounts'
                    )
                """)
                
                if not game_accounts_exists:
                    logger.info("📝 Применение миграции game_accounts...")
                    
                    # Создаем таблицу game_accounts
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
                    
                    logger.info("✅ Миграция game_accounts успешно применена!")
                else:
                    logger.info("✅ Миграция game_accounts уже применена")
            except Exception as game_accounts_error:
                logger.error(f"⚠️ Ошибка при применении миграции game_accounts: {game_accounts_error}", exc_info=True)

            
            # Применяем миграцию XP системы (если еще не применена)
            logger.info("\n🔄 Проверка миграции XP системы...")
            try:
                # Проверяем есть ли колонка level
                level_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'level'
                    )
                """)
                
                if not level_exists:
                    logger.info("📝 Применение миграции XP системы...")
                    
                    # SQL миграции встроен в код (не зависит от файлов)
                    migration_sql = """
                    -- Добавление полей для системы опыта, уровней и поинтов
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

                    -- Индексы для сортировки
                    CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC, current_xp DESC);
                    CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

                    -- Таблица истории начисления опыта и поинтов
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

                    -- Индексы для истории
                    CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
                    CREATE INDEX IF NOT EXISTS idx_xp_transactions_discord ON xp_transactions(discord_id);
                    CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

                    -- Таблица покупок за поинты
                    CREATE TABLE IF NOT EXISTS points_purchases (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        discord_id BIGINT,
                        item_name VARCHAR(200) NOT NULL,
                        cost INTEGER NOT NULL,
                        expires_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT NOW()
                    );

                    -- Индекс для покупок
                    CREATE INDEX IF NOT EXISTS idx_points_purchases_user ON points_purchases(user_id);
                    """
                    
                    await conn.execute(migration_sql)
                    logger.info("✅ Миграция XP системы успешно применена!")
                else:
                    logger.info("✅ Миграция XP системы уже применена")
            except Exception as migration_error:
                logger.error(f"⚠️ Ошибка при применении миграции XP: {migration_error}", exc_info=True)

                # Не прерываем запуск, если миграция не применилась
            
            logger.info("\n✅ База данных полностью готова к работе!")
            
    except Exception as e:
        logger.error(f"❌ Ошибка при инициализации БД: {e}", exc_info=True)


# Graceful shutdown handler
def setup_signal_handlers():
    """Настройка обработчиков сигналов для graceful shutdown"""
    def signal_handler(sig, frame):
        logger.info(f"Получен сигнал {sig}, начинаем graceful shutdown...")
        # FastAPI автоматически вызовет lifespan shutdown
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    logger.info("✅ Signal handlers настроены")

if __name__ == "__main__":
    import uvicorn
    setup_signal_handlers()
    uvicorn.run(app, host="0.0.0.0", port=8000)
