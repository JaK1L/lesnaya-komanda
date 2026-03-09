"""
Тестирование аутентификации администратора
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

async def test_auth():
    """Тестирование полного цикла аутентификации"""
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    
    try:
        print("=== Тест аутентификации администратора ===\n")
        print(f"Username: {ADMIN_USERNAME}")
        print(f"Password: {ADMIN_PASSWORD}")
        print(f"SECRET_KEY: {SECRET_KEY[:20]}...")
        print(f"ALGORITHM: {ALGORITHM}\n")
        
        # Шаг 1: Получаем пользователя из БД
        print("Шаг 1: Получение пользователя из БД...")
        user = await conn.fetchrow(
            "SELECT id, username, password_hash, role FROM admin_users WHERE username = $1",
            ADMIN_USERNAME
        )
        
        if not user:
            print(f"❌ Пользователь {ADMIN_USERNAME} не найден!")
            return
        
        print(f"✅ Пользователь найден: {user['username']} (role: {user['role']})\n")
        
        # Шаг 2: Проверяем пароль
        print("Шаг 2: Проверка пароля...")
        if not pwd_context.verify(ADMIN_PASSWORD, user['password_hash']):
            print("❌ Пароль неверный!")
            return
        
        print("✅ Пароль верный!\n")
        
        # Шаг 3: Создаем токен
        print("Шаг 3: Создание JWT токена...")
        access_token_expires = timedelta(minutes=30)
        expire = datetime.utcnow() + access_token_expires
        
        to_encode = {
            "sub": user['username'],
            "exp": expire
        }
        
        access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        print(f"✅ Токен создан!")
        print(f"Токен: {access_token[:50]}...\n")
        
        # Шаг 4: Проверяем токен
        print("Шаг 4: Проверка токена...")
        try:
            payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
            print(f"✅ Токен валидный!")
            print(f"Payload: {payload}\n")
            
            # Шаг 5: Получаем пользователя по токену
            print("Шаг 5: Получение пользователя по токену...")
            username_from_token = payload.get("sub")
            user_from_token = await conn.fetchrow(
                "SELECT id, username, role FROM admin_users WHERE username = $1",
                username_from_token
            )
            
            if user_from_token:
                print(f"✅ Пользователь из токена найден: {user_from_token['username']}")
                print(f"   ID: {user_from_token['id']}")
                print(f"   Role: {user_from_token['role']}")
                print("\n🎉 Аутентификация работает корректно!")
            else:
                print(f"❌ Пользователь {username_from_token} не найден в БД")
                
        except Exception as e:
            print(f"❌ Ошибка проверки токена: {e}")
    
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test_auth())
