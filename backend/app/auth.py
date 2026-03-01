"""
Модуль аутентификации
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings
from .database import get_db
import asyncpg

# passlib может логировать предупреждения (например, про bcrypt version) с traceback.
# Это не ошибка для работы приложения, поэтому приглушаем до ERROR.
logging.getLogger("passlib").setLevel(logging.ERROR)

# Настройка хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Настройка безопасности
security = HTTPBearer()

# Схемы Pydantic для аутентификации
from pydantic import BaseModel


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


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Хеширование пароля"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Создание JWT токена"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_user_by_username(db: asyncpg.Connection, username: str) -> Optional[UserInDB]:
    """Получение пользователя по username"""
    query = """
        SELECT id, username, password_hash, role 
        FROM admin_users 
        WHERE username = $1
    """
    row = await db.fetchrow(query, username)
    
    if row:
        return UserInDB(
            id=row['id'],
            username=row['username'],
            role=row['role'],
            hashed_password=row['password_hash']
        )
    return None


async def authenticate_user(db: asyncpg.Connection, username: str, password: str) -> Optional[User]:
    """Аутентификация пользователя"""
    user = await get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return User(id=user.id, username=user.username, role=user.role)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
) -> User:
    """Получение текущего пользователя по JWT токену (админ по логину или Discord-пользователь по type=discord)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        sub = payload.get("sub")
        token_type = payload.get("type")
        if sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Вход через Discord OAuth
    if token_type == "discord":
        try:
            discord_id = int(sub)
        except (ValueError, TypeError):
            raise credentials_exception
        row = await db.fetchrow(
            "SELECT id, discord_username FROM users WHERE discord_id = $1",
            discord_id,
        )
        if not row:
            raise credentials_exception
        return User(id=row["id"], username=row["discord_username"], role="user")

    # Обычный админ (логин/пароль)
    user = await get_user_by_username(db, username=sub)
    if user is None:
        raise credentials_exception
    return User(id=user.id, username=user.username, role=user.role)


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Получение активного пользователя"""
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
) -> User:
    """
    Получение администратора
    
    Проверяет права администратора:
    - Для Discord пользователей (role="user"): проверяет is_admin в таблице users
    - Для admin_users (role="admin"): использует существующую логику
    """
    # Для Discord пользователей проверяем is_admin в users
    if current_user.role == "user":
        is_admin = await db.fetchval(
            "SELECT is_admin FROM users WHERE id = $1",
            current_user.id
        )
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )
    # Для admin_users оставляем старую логику
    elif current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions"
        )
    
    return current_user