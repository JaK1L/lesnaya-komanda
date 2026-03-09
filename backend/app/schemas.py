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
    image_url: Optional[str] = None
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
    access_token: str = Field(..., description="JWT токен доступа", examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."])
    token_type: str = Field(default="bearer", description="Тип токена", examples=["bearer"])


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
    email: str = Field(..., description="Email адрес")
    password: str = Field(..., min_length=6, description="Пароль (минимум 6 символов)")
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Простая валидация email"""
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email format")
        return v.lower()


class UserRegister(BaseModel):
    """Модель для публичной регистрации"""
    username: str = Field(..., min_length=3, max_length=50, description="Никнейм")
    email: str = Field(..., description="Email адрес")
    password: str = Field(..., min_length=6, description="Пароль (минимум 6 символов)")
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Простая валидация email"""
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email format")
        return v.lower()
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Валидация никнейма"""
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain letters, numbers, underscores and hyphens")
        return v


class UserLogin(BaseModel):
    email: str = Field(..., description="Email адрес")
    password: str = Field(..., description="Пароль")


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


# Модели для профиля пользователя
class ProfileResponse(BaseModel):
    """Response model for user profile data"""
    discord_id: Optional[int] = None
    site_nickname: Optional[str] = None
    discord_username: str
    user_tag: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_hidden: bool = False
    forest_rank: str
    rating: float
    joined_at: Optional[datetime] = None
    is_admin: bool = False
    level: int = 0
    current_xp: int = 0
    total_xp: int = 0
    points: int = 0
    game_preferences: Optional[List[Dict[str, Any]]] = None


class XPTransaction(BaseModel):
    """Model for XP/Points transaction"""
    id: int
    user_id: int
    discord_id: int
    type: str  # 'xp' or 'points'
    amount: int
    reason: str
    source: Optional[str] = None
    created_at: datetime
    created_by: Optional[int] = None


class XPTransactionCreate(BaseModel):
    """Request model for creating XP/Points transaction"""
    discord_id: int
    type: str = Field(..., pattern='^(xp|points)$')
    amount: int
    reason: str = Field(..., min_length=1, max_length=200)
    source: Optional[str] = Field(None, max_length=100)


class PointsPurchase(BaseModel):
    """Model for points purchase"""
    id: int
    user_id: int
    discord_id: int
    item_name: str
    cost: int
    expires_at: Optional[datetime] = None
    created_at: datetime


class UserXPUpdate(BaseModel):
    """Request model for admin to update user XP/Level"""
    discord_id: int
    level: Optional[int] = Field(None, ge=1, le=100)
    current_xp: Optional[int] = Field(None, ge=0)
    total_xp: Optional[int] = Field(None, ge=0)
    points: Optional[int] = Field(None, ge=0)
    game_preferences: Optional[List[Dict[str, Any]]] = None


class ProfileUpdate(BaseModel):
    """Request model for updating user profile"""
    site_nickname: Optional[str] = Field(
        None, 
        max_length=50,
        description="Никнейм на сайте (отображается вместо Discord имени)",
        examples=["Лесной Волк"]
    )
    avatar_url: Optional[str] = Field(
        None, 
        max_length=500,
        description="URL аватара пользователя",
        examples=["https://cdn.discordapp.com/avatars/123456789/abc123.png"]
    )
    bio: Optional[str] = Field(
        None, 
        max_length=500,
        description="Биография пользователя (о себе)",
        examples=["Играю в CS2 и Dota 2. Люблю командную игру!"]
    )
    is_hidden: bool = Field(
        default=False,
        description="Скрыть профиль от других пользователей",
        examples=[False]
    )
    
    @field_validator('site_nickname')
    @classmethod
    def validate_nickname(cls, v: Optional[str]) -> Optional[str]:
        """Trim whitespace and return None for empty strings"""
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
        return v
    
    @field_validator('bio')
    @classmethod
    def validate_bio(cls, v: Optional[str]) -> Optional[str]:
        """Trim whitespace from bio"""
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
        return v


# Модели для игровых предпочтений
class GamePreferenceItem(BaseModel):
    """Single game preference item"""
    game: str
    custom_name: Optional[str] = None
    
    @field_validator("game")
    @classmethod
    def validate_game(cls, v: str) -> str:
        """Validate game is one of the allowed values"""
        valid_games = [
            "CS2", "DOTA 2", "VALORANT", "PUBG", 
            "Apex Legends", "League of Legends", 
            "Overwatch 2", "Fortnite", "Minecraft", 
            "GTA V", "Другое"
        ]
        if v not in valid_games:
            raise ValueError(f"Game must be one of: {', '.join(valid_games)}")
        return v
    
    @field_validator("custom_name")
    @classmethod
    def validate_custom_name(cls, v: Optional[str], info) -> Optional[str]:
        """Validate custom_name based on game selection"""
        game = info.data.get("game")
        
        # If game is "Другое", custom_name is required
        if game == "Другое":
            if not v or len(v.strip()) == 0:
                raise ValueError("custom_name is required when game is 'Другое'")
            v = v.strip()
            if len(v) > 50:
                raise ValueError("custom_name must be 50 characters or less")
            return v
        
        # For other games, custom_name must be None
        return None


class GamePreferencesRequest(BaseModel):
    """Request model for saving/updating game preferences"""
    preferences: List[GamePreferenceItem] = Field(..., max_length=15)
    
    @field_validator("preferences")
    @classmethod
    def validate_preferences_not_empty(cls, v: List[GamePreferenceItem]) -> List[GamePreferenceItem]:
        """Ensure at least one game is selected"""
        if len(v) == 0:
            raise ValueError("At least one game must be selected")
        return v


class GameStatistics(BaseModel):
    """Response model for game statistics"""
    CS2: int = 0
    DOTA_2: int = Field(default=0, alias="DOTA 2")
    VALORANT: int = 0
    OTHER: int = Field(default=0, alias="ДРУГИЕ")
    
    class Config:
        populate_by_name = True
