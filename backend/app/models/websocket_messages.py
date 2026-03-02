"""
Pydantic модели для WebSocket сообщений Discord real-time updates
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Union
from datetime import datetime


# Модели данных
class RoleData(BaseModel):
    """Данные о роли пользователя"""
    name: str
    color: Optional[str] = None


class ActivityData(BaseModel):
    """Данные об активности пользователя"""
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    game: Optional[str] = None
    status: Literal["online", "offline", "idle", "dnd"]
    roles: List[RoleData] = []
    activity_started_at: Optional[str] = None
    game_icon_url: Optional[str] = None
    custom_status: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[str] = None
    joined_at: Optional[str] = None


class LeaderboardEntry(BaseModel):
    """Запись в таблице лидеров"""
    user_id: str
    username: str
    count: Optional[int] = None  # для сообщений
    minutes: Optional[int] = None  # для голоса


class StatisticsData(BaseModel):
    """Статистика топов по сообщениям и голосу"""
    message_leaderboard: List[LeaderboardEntry]
    voice_leaderboard: List[LeaderboardEntry]


# Модели сообщений
class InitialStateMessage(BaseModel):
    """Начальное состояние при подключении"""
    type: Literal["initial_state"] = "initial_state"
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    data: dict  # Содержит activity и statistics


class ActivityUpdateMessage(BaseModel):
    """Обновление активности пользователя"""
    type: Literal["activity_update"] = "activity_update"
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    data: dict  # Содержит user_id, event, game, status


class StatisticsUpdateMessage(BaseModel):
    """Обновление статистики"""
    type: Literal["statistics_update"] = "statistics_update"
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    data: StatisticsData


class HeartbeatMessage(BaseModel):
    """Heartbeat ping/pong сообщение"""
    type: Literal["ping", "pong"]
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


# Union type для всех типов сообщений
DiscordMessage = Union[
    InitialStateMessage,
    ActivityUpdateMessage,
    StatisticsUpdateMessage,
    HeartbeatMessage
]
