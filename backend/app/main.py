from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import asyncpg
from datetime import timedelta

from .config import settings
from .database import database
from .routes import users, auth, discord_oauth, admin, content, websocket, discord
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
    description="API для управления игровым сообществом",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(content.router, prefix="/api", tags=["content"])

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
            
            # Добавляем админа по умолчанию, если нет ни одного (пароль: admin123)
            admin_count = await conn.fetchval("SELECT COUNT(*) FROM admin_users")
            if admin_count == 0:
                default_hash = get_password_hash("admin123")
                await conn.execute(
                    "INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, $3)",
                    "admin", default_hash, "admin"
                )
                print("✅ Создан админ по умолчанию (логин: admin, пароль: admin123)")
            
            # Проверяем, что данные есть
            users_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            games_count = await conn.fetchval("SELECT COUNT(*) FROM game_profiles")
            achievements_count = await conn.fetchval("SELECT COUNT(*) FROM achievements")
            print(f"📊 В базе: {users_count} игроков, {games_count} игровых профилей, {achievements_count} достижений")
            
            print("✅ База данных полностью готова к работе!")
            
    except Exception as e:
        print(f"❌ Ошибка при инициализации БД: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
