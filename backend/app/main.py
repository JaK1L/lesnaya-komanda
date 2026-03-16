from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging
import sys
import signal

from .config import settings
from .database import database, get_db
from .db_init import init_db
from .routes import users, auth, discord_oauth, twitch_oauth, content, websocket, discord, profile, migration, game_preferences, admin, achievements, events, game_stats, tournaments, media, bracket, friends, notifications
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

# Настройка CORS — FRONTEND_URL всегда добавляется в список
cors_origins = list(settings.ALLOWED_ORIGINS)
if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL)
logger.info(f"🌐 CORS origins: {cors_origins}")
logger.info(f"🌐 DEBUG mode: {settings.DEBUG}")

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

# Middleware для отключения кэша для API эндпоинтов
@app.middleware("http")
async def add_cache_control_header(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Подключение маршрутов
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(discord_oauth.router, prefix="/api", tags=["discord"])
app.include_router(twitch_oauth.router, prefix="/api", tags=["twitch"])
app.include_router(discord.router, tags=["discord"])  # Discord presence API
app.include_router(content.router, prefix="/api", tags=["content"])
app.include_router(profile.router, prefix="/api", tags=["profile"])
app.include_router(game_preferences.router, tags=["game_preferences"])  # Game preferences API
app.include_router(admin.router, prefix="/api", tags=["admin"])  # Admin panel API
app.include_router(achievements.router, prefix="/api", tags=["achievements"])  # Achievements API
app.include_router(events.router, prefix="/api", tags=["events"])  # Events API
app.include_router(game_stats.router, prefix="/api", tags=["game_stats"])  # Game Stats API
app.include_router(tournaments.router, prefix="/api", tags=["tournaments"])  # Tournaments API
app.include_router(media.router, prefix="/api", tags=["media"])  # Media gallery
app.include_router(bracket.router, prefix="/api", tags=["bracket"])  # Bracket system
app.include_router(friends.router, prefix="/api", tags=["friends"])  # Friends system
app.include_router(notifications.router, prefix="/api", tags=["notifications"])  # User notifications
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
