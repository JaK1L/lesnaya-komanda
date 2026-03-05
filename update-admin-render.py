"""
Обновление админа на Render (продакшен база)
"""
import asyncio
import asyncpg
from passlib.context import CryptContext

# DATABASE_URL от Render - замени на свой из Environment variables
DATABASE_URL = "твой_database_url_с_render"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

NEW_USERNAME = "LesnoyBOSS"
NEW_PASSWORD = "LesnoyBOSS909!"

async def update():
    print("🔧 Подключение к продакшен базе...")
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
    
    print(f"✅ Админ обновлен на продакшене!")
    print(f"Логин: {NEW_USERNAME}")
    print(f"Пароль: {NEW_PASSWORD}")
    
    await conn.close()

asyncio.run(update())
