"""
Скрипт для создания/обновления админа
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def create_admin():
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    if not DATABASE_URL:
        print("❌ Ошибка: DATABASE_URL не найден в .env")
        return
    
    print(f"🔌 Подключение к базе данных...")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключено к базе данных")
        
        # Создаем таблицу admin_users если её нет
        print("📝 Создание таблицы admin_users...")
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(200) NOT NULL,
                role VARCHAR(20) DEFAULT 'editor',
                created_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        print("✅ Таблица admin_users создана")
        
        # Данные админа (из переменных окружения)
        username = os.getenv('ADMIN_USERNAME', 'admin')
        password = os.getenv('ADMIN_PASSWORD', 'admin123')
        role = "admin"
        
        # Хешируем пароль
        password_hash = get_password_hash(password)
        
        # Проверяем существует ли админ
        existing = await conn.fetchrow(
            "SELECT id, username FROM admin_users WHERE username = $1",
            username
        )
        
        if existing:
            # Обновляем существующего
            await conn.execute(
                "UPDATE admin_users SET password_hash = $1, role = $2 WHERE username = $3",
                password_hash, role, username
            )
            print(f"✅ Админ {username} обновлен")
        else:
            # Создаем нового
            await conn.execute(
                "INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, $3)",
                username, password_hash, role
            )
            print(f"✅ Админ {username} создан")
        
        # Проверяем
        admin = await conn.fetchrow(
            "SELECT id, username, role FROM admin_users WHERE username = $1",
            username
        )
        
        if admin:
            print(f"✅ Проверка: админ найден - ID: {admin['id']}, Username: {admin['username']}, Role: {admin['role']}")
        else:
            print("⚠️ Предупреждение: админ не найден после создания")
        
        await conn.close()
        print(f"\n✅ Готово!")
        print(f"Логин: {username}")
        print(f"Пароль: {password}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_admin())
