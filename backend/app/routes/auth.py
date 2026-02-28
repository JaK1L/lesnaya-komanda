"""
Маршруты для аутентификации
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import UserCreate, UserLogin, Token, User
from ..auth import (
    authenticate_user, create_access_token, get_current_user, 
    get_current_admin_user, get_password_hash
)
from ..config import settings
import asyncpg

router = APIRouter()
security = HTTPBearer()


@router.post("/token", response_model=Token)
async def login_for_access_token(
    user_login: UserLogin,
    db: asyncpg.Connection = Depends(get_db)
):
    """Получение токена доступа"""
    user = await authenticate_user(db, user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=dict)
async def register_user(
    user_create: UserCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Регистрация нового пользователя (только для администраторов)"""
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
            user_create.role
        )
        
        return {
            "status": "success",
            "message": "User created successfully",
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