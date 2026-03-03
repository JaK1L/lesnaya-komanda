"""
Простой скрипт для обновления админа
"""
import asyncio
import asyncpg
from passlib.context import CryptContext

DATABASE_URL = "postgresql://neondb_owner:npg_PRJbuN0f4Yyc@ep-purple-boat-agxuy7jr-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

NEW_USERNAME = "LesnoyBOSS"
NEW_PASSWORD = "LesnoyBOSS909!"

async def update():
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Хешируем пароль
    password_hash = pwd_context.hash(NEW_PASSWORD)
    
    # Обновляем или создаем админа
    await conn.execute("""
        INSERT INTO admin_users (username, password_hash, role)
        VALUES ($1, $2, 'admin')
        ON CONFLICT (username) DO UPDATE
        SET password_hash = EXCLUDED.password_hash
    """, NEW_USERNAME, password_hash)
    
    # Удаляем старого админа если есть
    await conn.execute("DELETE FROM admin_users WHERE username = 'admin'")
    
    print(f"✅ Админ обновлен!")
    print(f"Логин: {NEW_USERNAME}")
    print(f"Пароль: {NEW_PASSWORD}")
    
    await conn.close()

asyncio.run(update())
