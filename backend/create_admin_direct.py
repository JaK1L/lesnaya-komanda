"""
Создание админа напрямую через SQL (для production)
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

# Production DATABASE_URL (из переменных окружения)
DATABASE_URL = os.getenv('DATABASE_URL')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    print("🔐 Создание администратора...")
    
    if not DATABASE_URL:
        print("❌ Ошибка: DATABASE_URL не найден в .env")
        return
    
    try:
        # Подключаемся к БД
        conn = await asyncpg.connect(DATABASE_URL, timeout=30)
        print("✅ Подключение к БД установлено")
        
        # Проверяем существует ли таблица
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admin_users'
            )
        """)
        
        if not table_exists:
            print("❌ Таблица admin_users не существует!")
            print("Создаем таблицу...")
            await conn.execute("""
                CREATE TABLE admin_users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(200) NOT NULL,
                    role VARCHAR(20) DEFAULT 'editor',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            print("✅ Таблица создана")
        
        # Обновляем существующего админа (из переменных окружения)
        username = os.getenv('ADMIN_USERNAME', 'admin')
        password = os.getenv('ADMIN_PASSWORD', 'admin123')
        password_hash = pwd_context.hash(password)
        
        # Проверяем есть ли админ
        existing = await conn.fetchrow("SELECT id FROM admin_users WHERE username = $1", username)
        
        if existing:
            # Обновляем пароль
            await conn.execute("""
                UPDATE admin_users 
                SET password_hash = $2, role = 'admin'
                WHERE username = $1
            """, username, password_hash)
            print(f"✅ Админ обновлен (ID: {existing['id']})")
        else:
            # Создаем нового
            await conn.execute("""
                INSERT INTO admin_users (username, password_hash, role)
                VALUES ($1, $2, 'admin')
            """, username, password_hash)
            print("✅ Новый админ создан")
        
        print(f"✅ Админ создан:")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print(f"   Hash: {password_hash[:50]}...")
        
        # Проверяем
        admin = await conn.fetchrow("SELECT * FROM admin_users WHERE username = $1", username)
        if admin:
            print(f"✅ Проверка: админ найден в БД (ID: {admin['id']})")
        else:
            print("❌ Ошибка: админ не найден после создания!")
        
        await conn.close()
        print("✅ Готово!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_admin())
