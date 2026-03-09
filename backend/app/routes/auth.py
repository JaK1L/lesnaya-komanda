"""
Маршруты для аутентификации
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import UserCreate, UserLogin, Token, User, UserRegister
from ..auth import (
    authenticate_user, create_access_token, get_current_user, 
    get_current_admin_user, get_password_hash
)
from ..config import settings
from ..rate_limit import limiter
import asyncpg

router = APIRouter()
security = HTTPBearer()


@router.post("/token", response_model=Token)
@limiter.limit("5/minute")
async def login_for_access_token(
    request: Request,
    user_login: UserLogin,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Получение JWT токена доступа
    
    Аутентификация пользователя (email + пароль) для получения токена доступа.
    Токен используется для доступа к защищенным эндпоинтам.
    
    **Пример запроса:**
    ```json
    {
        "email": "user@example.com",
        "password": "your_password"
    }
    ```
    
    **Пример ответа:**
    ```json
    {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer"
    }
    ```
    
    **Использование токена:**
    ```
    Authorization: Bearer <access_token>
    ```
    """
    user = await authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "type": "email"}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=dict)
@limiter.limit("3/minute")
async def register_user(
    request: Request,
    user_register: UserRegister,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Публичная регистрация нового пользователя
    
    Регистрация через email и пароль. После регистрации пользователь
    может войти используя эти учетные данные.
    
    **Пример запроса:**
    ```json
    {
        "username": "player123",
        "email": "player@example.com",
        "password": "securepass123"
    }
    ```
    
    **Требования:**
    - Username: 3-50 символов, только буквы, цифры, _ и -
    - Email: валидный email адрес
    - Password: минимум 6 символов
    """
    # Проверяем, существует ли пользователь с таким email
    existing_email = await db.fetchrow(
        "SELECT id FROM users WHERE email = $1", user_register.email.lower()
    )
    
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Проверяем, существует ли пользователь с таким username
    existing_username = await db.fetchrow(
        "SELECT id FROM users WHERE discord_username = $1", user_register.username
    )
    
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Хешируем пароль
    hashed_password = get_password_hash(user_register.password)
    
    # Генерируем уникальный user_tag
    user_tag_query = "SELECT generate_user_tag($1)"
    user_tag = await db.fetchval(user_tag_query, user_register.username)
    
    query = """
        INSERT INTO users (
            discord_username, email, password_hash, user_tag,
            forest_rank, rating, email_verified, is_admin, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id, discord_username, email, user_tag, forest_rank, created_at
    """
    
    try:
        result = await db.fetchrow(
            query, 
            user_register.username,
            user_register.email.lower(),
            hashed_password,
            user_tag,
            '🌱 Росток',  # Начальный ранг
            0.0,  # Начальный рейтинг
            False,  # Email не подтвержден
            False  # Не админ
        )
        
        # Автоматически логиним пользователя
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": result['email'], "user_id": result['id'], "type": "email"}, 
            expires_delta=access_token_expires
        )
        
        return {
            "status": "success",
            "message": "User registered successfully",
            "user": {
                "id": result['id'],
                "username": result['discord_username'],
                "user_tag": result['user_tag'],
                "email": result['email'],
                "forest_rank": result['forest_rank'],
                "created_at": result['created_at']
            },
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )


@router.post("/admin/register", response_model=dict)
async def register_admin_user(
    user_create: UserCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Регистрация нового администратора (только для существующих администраторов)"""
    # Проверяем, существует ли пользователь
    existing_user = await db.fetchrow(
        "SELECT id FROM admin_users WHERE username = $1", user_create.username
    )
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # Хешируем пароль и создаем пользователя
    hashed_password = get_password_hash(user_create.password)
    
    query = """
        INSERT INTO admin_users (username, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, username, role, created_at
    """
    
    try:
        result = await db.fetchrow(
            query, 
            user_create.username, 
            hashed_password, 
            'editor'  # По умолчанию editor
        )
        
        return {
            "status": "success",
            "message": "Admin user created successfully",
            "user": {
                "id": result['id'],
                "username": result['username'],
                "role": result['role'],
                "created_at": result['created_at']
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Получение информации о текущем пользователе"""
    return current_user


@router.get("/admin-only")
async def admin_endpoint(current_user: User = Depends(get_current_admin_user)):
    """Пример эндпоинта только для администраторов"""
    return {"message": f"Hello {current_user.username}, you are an admin!"}


@router.get("/protected")
async def protected_endpoint(current_user: User = Depends(get_current_user)):
    """Пример защищенного эндпоинта"""
    return {"message": f"Hello {current_user.username}, this is a protected endpoint"}