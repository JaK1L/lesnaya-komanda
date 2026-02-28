# Экспорт моделей
from .websocket_messages import (
    ActivityData,
    LeaderboardEntry,
    StatisticsData,
    InitialStateMessage,
    ActivityUpdateMessage,
    StatisticsUpdateMessage,
    HeartbeatMessage,
    DiscordMessage
)

# Импорт схем из app.schemas
from ..schemas import (
    User,
    UserProfile,
    UserInDB,
    UserCreate,
    UserLogin,
    GameProfile,
    Achievement,
    AdminUser,
    NewsPost,
    Event,
    Token,
    TokenData,
    LeaderboardRequest,
    ActivityStatsRequest,
    APIResponse,
    ErrorResponse
)

__all__ = [
    # WebSocket модели
    'ActivityData',
    'LeaderboardEntry',
    'StatisticsData',
    'InitialStateMessage',
    'ActivityUpdateMessage',
    'StatisticsUpdateMessage',
    'HeartbeatMessage',
    'DiscordMessage',
    # Модели пользователей и аутентификации
    'User',
    'UserProfile',
    'UserInDB',
    'UserCreate',
    'UserLogin',
    'GameProfile',
    'Achievement',
    'AdminUser',
    'NewsPost',
    'Event',
    'Token',
    'TokenData',
    'LeaderboardRequest',
    'ActivityStatsRequest',
    'APIResponse',
    'ErrorResponse'
]

__all__ = [
    # WebSocket модели
    'ActivityData',
    'LeaderboardEntry',
    'StatisticsData',
    'InitialStateMessage',
    'ActivityUpdateMessage',
    'StatisticsUpdateMessage',
    'HeartbeatMessage',
    'DiscordMessage',
    # Модели пользователей и аутентификации
    'User',
    'UserProfile',
    'UserInDB',
    'UserCreate',
    'UserLogin',
    'GameProfile',
    'Achievement',
    'AdminUser',
    'NewsPost',
    'Event',
    'Token',
    'TokenData',
    'LeaderboardRequest',
    'ActivityStatsRequest',
    'APIResponse',
    'ErrorResponse'
]
