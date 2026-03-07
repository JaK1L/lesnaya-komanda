from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import asyncpg
from datetime import timedelta

from .config import settings
from .database import database
from .routes import users, auth, discord_oauth, content, websocket, discord, profile, migration, game_preferences, admin
from .auth import get_password_hash

# Инициализация приложения
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Жизненный цикл приложения"""
    # Запуск
    await database.connect()
    print("✅ Подключение к базе данных установлено")
    
    # Инициализация базы данных
    await init_db()
    
    yield
    
    # Завершение
    await database.disconnect()
    print("✅ Подключение к базе данных закрыто")

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Подключение маршрутов
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(discord_oauth.router, prefix="/api", tags=["discord"])
app.include_router(discord.router, tags=["discord"])  # Discord presence API
app.include_router(content.router, prefix="/api", tags=["content"])
app.include_router(profile.router, prefix="/api", tags=["profile"])
app.include_router(game_preferences.router, tags=["game_preferences"])  # Game preferences API
app.include_router(admin.router, prefix="/api", tags=["admin"])  # Admin panel API
app.include_router(migration.router, tags=["migration"])  # Temporary migration endpoint

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
            print("✅ Таблица users создана или уже существует")
            
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
            print("✅ Таблица game_profiles создана или уже существует")
            
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
            print("✅ Таблица achievements создана или уже существует")
            
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
            print("✅ Таблица admin_users создана или уже существует")
            
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
            print("✅ Таблица activity_log создана или уже существует")
            
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
            print("✅ Таблица voice_sessions создана или уже существует")

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
            print("✅ Таблица discord_presence создана или уже существует")
            
            # Добавляем новые колонки для расширенных данных присутствия (миграция)
            await conn.execute('''
                ALTER TABLE discord_presence 
                ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]',
                ADD COLUMN IF NOT EXISTS activity_started_at TIMESTAMP,
                ADD COLUMN IF NOT EXISTS game_icon_url TEXT
            ''')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_presence_activity_started ON discord_presence(activity_started_at DESC)')
            print("✅ Расширенные колонки discord_presence добавлены (roles, activity_started_at, game_icon_url)")

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
            print("✅ Таблица home_feed создана или уже существует")

            # Таблица настроек сайта (JSON по ключу)
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS site_settings (
                    key VARCHAR(50) PRIMARY KEY,
                    value JSONB NOT NULL
                )
            ''')
            print("✅ Таблица site_settings создана или уже существует")

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
            print("✅ Таблицы news и events созданы или уже существуют")
            
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
            print("✅ Тестовые игроки добавлены (если таблица была пуста)")
            
            # Добавляем тестовые достижения
            await conn.execute('''
                INSERT INTO achievements (user_id, achievement_name, achievement_icon, game)
                SELECT u.id, 'Первые шаги', '🌱', 'Общее'
                FROM users u
                WHERE NOT EXISTS (SELECT 1 FROM achievements)
            ''')
            print("✅ Тестовые достижения добавлены")
            
            # Обновляем/создаем админа с новыми данными
            print("\n🔐 Проверка администратора...")
            admin_username = "LesnoyBOSS"
            admin_password = "LesnoyBOSS909!"
            
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
                print(f"✅ Админ обновлен: {existing_admin['username']} → {admin_username}")
            else:
                # Создаем нового админа
                admin_hash = get_password_hash(admin_password)
                await conn.execute(
                    "INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, 'admin')",
                    admin_username, admin_hash
                )
                print(f"✅ Создан новый админ: {admin_username}")
            
            # Удаляем старого админа 'admin' если он остался
            await conn.execute("DELETE FROM admin_users WHERE username = 'admin' AND username != $1", admin_username)
            
            # Проверяем, что данные есть
            users_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            games_count = await conn.fetchval("SELECT COUNT(*) FROM game_profiles")
            achievements_count = await conn.fetchval("SELECT COUNT(*) FROM achievements")
            print(f"📊 В базе: {users_count} игроков, {games_count} игровых профилей, {achievements_count} достижений")
            
            # Применяем миграцию XP системы (если еще не применена)
            print("\n🔄 Проверка миграции XP системы...")
            try:
                # Проверяем есть ли колонка level
                level_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'level'
                    )
                """)
                
                if not level_exists:
                    print("📝 Применение миграции XP системы...")
                    
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
                    print("✅ Миграция XP системы успешно применена!")
                else:
                    print("✅ Миграция XP системы уже применена")
            except Exception as migration_error:
                print(f"⚠️ Ошибка при применении миграции XP: {migration_error}")
                import traceback
                traceback.print_exc()
                # Не прерываем запуск, если миграция не применилась
            
            print("\n✅ База данных полностью готова к работе!")
            
    except Exception as e:
        print(f"❌ Ошибка при инициализации БД: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
