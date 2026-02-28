"""
Pydantic модели для валидации данных
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime


# Модели пользователей
class UserProfile(BaseModel):
    discord_id: int
    discord_username: str
    forest_rank: str
    rating: float
    joined_at: Optional[datetime]
    last_seen: datetime
    message_count: int
    voice_hours: float
    games: List[Dict[str, Any]]
    achievements: List[Dict[str, Any]]

    @field_validator("forest_rank")
    @classmethod
    def validate_forest_rank(cls, v: str) -> str:
        valid_ranks = ["🌱 Росток", "🌿 Трава", "🌲 Дерево", "🪵 Бревно", "🔥 Лесной Дух", "🐺 Старый Волк"]
        if v not in valid_ranks:
            raise ValueError("Invalid forest rank")
        return v


class GameProfile(BaseModel):
    game: str
    game_username: str
    rank: str
    stats: Dict[str, Any]

    @field_validator("game")
    @classmethod
    def validate_game(cls, v: str) -> str:
        valid_games = ["cs2", "dota2", "valorant", "other"]
        if v.lower() not in valid_games:
            raise ValueError(f"Game must be one of: {', '.join(valid_games)}")
        return v.lower()


class Achievement(BaseModel):
    name: str
    icon: str
    game: str
    earned_at: datetime


# Модели для админки
class AdminUser(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime


class NewsPost(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    published: bool
    created_at: datetime
    updated_at: Optional[datetime]


class Event(BaseModel):
    id: int
    title: str
    description: str
    game: str
    event_date: datetime
    created_by: int
    participants: List[int] = []


# Модели для аутентификации
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    id: int
    username: str
    role: str


class UserInDB(User):
    hashed_password: str


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: str = Field(default="editor")


class UserLogin(BaseModel):
    username: str
    password: str


# Модели для запросов
class LeaderboardRequest(BaseModel):
    game: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=1000)


class ActivityStatsRequest(BaseModel):
    days: int = Field(default=7, ge=1, le=365)


# Модели для ответов
class APIResponse(BaseModel):
    status: str
    message: str


class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None