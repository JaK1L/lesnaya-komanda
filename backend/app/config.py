"""
Конфигурация приложения
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, ValidationError
from typing import Optional, Union
import sys


class Settings(BaseSettings):
    # База данных
    DATABASE_URL: str

    # Безопасность
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v):
        if len(v) < 32:
            raise ValueError("SECRET_KEY должен быть минимум 32 символа для безопасности")
        return v
    
    # CORS: в .env можно указать один origin или несколько через запятую
    ALLOWED_ORIGINS: Union[list, str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://lesnaya-komanda.vercel.app",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return v
    
    # Twitch OAuth (для привязки аккаунта)
    TWITCH_CLIENT_ID: Optional[str] = None
    TWITCH_CLIENT_SECRET: Optional[str] = None
    IMGBB_API_KEY: Optional[str] = None

    # Discord (бот и OAuth для входа на сайт)
    DISCORD_BOT_TOKEN: Optional[str] = None
    DISCORD_GUILD_ID: Optional[int] = None
    DISCORD_CLIENT_ID: Optional[str] = None
    DISCORD_CLIENT_SECRET: Optional[str] = None
    # Куда редиректить после входа через Discord (сайт)
    FRONTEND_URL: str = "http://localhost:3000"
    # URL бэкенда (для redirect_uri OAuth — в Discord Developer Portal указывать этот callback)
    BACKEND_URL: str = "http://localhost:8000"
    
    # Режим разработки
    DEBUG: bool = False
    
    # Admin credentials (for initial setup)
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    
    @field_validator("ADMIN_PASSWORD")
    @classmethod
    def validate_admin_password(cls, v):
        if len(v) < 8:
            print("⚠️ ПРЕДУПРЕЖДЕНИЕ: ADMIN_PASSWORD слишком короткий (минимум 8 символов)")
        return v
    
    model_config = SettingsConfigDict(
        env_file=(
            ".env",
            "backend/.env",
            str(Path(__file__).resolve().parents[2] / ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


try:
    settings = Settings()
except ValidationError as e:
    print("❌ ОШИБКА КОНФИГУРАЦИИ:")
    for error in e.errors():
        field = " -> ".join(str(x) for x in error["loc"])
        print(f"  • {field}: {error['msg']}")
    print("\n💡 Проверьте файл .env и убедитесь что все обязательные переменные установлены")
    sys.exit(1)
