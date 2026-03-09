"""
Создание тестового пользователя для проверки системы
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_user():
    """Создает тестового пользователя"""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Данные тестового пользователя
        username = "testuser"
        email = "test@example.com"
        password = "password123"
        
        # Хешируем пароль
        password_hash = pwd_context.hash(password)
        
        # Создаем пользователя
        query = """
            INSERT INTO users (
                discord_username, email, password_hash, 
                forest_rank, rating, email_verified, is_admin, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id, discord_username, email, forest_rank
        """
        
        result = await conn.fetchrow(
            query,
            username,
            email,
            password_hash,
            '🌱 Росток',
            0.0,
            False,
            False
        )
        
        print("=" * 60)
        print("✅ ТЕСТОВЫЙ ПОЛЬЗОВАТЕЛЬ СОЗДАН")
        print("=" * 60)
        print(f"ID: {result['id']}")
        print(f"Username: {result['discord_username']}")
        print(f"Email: {result['email']}")
        print(f"Password: {password}")
        print(f"Rank: {result['forest_rank']}")
        print("=" * 60)
        print("\n🔐 Используйте эти данные для входа:")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_test_user())
