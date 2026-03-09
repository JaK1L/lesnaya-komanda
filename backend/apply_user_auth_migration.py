"""
Применение миграции для добавления email/password в users
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def apply_migration():
    """Применяет миграцию для добавления полей email и password"""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("🔄 Применение миграции...")
        
        # Читаем SQL файл
        with open("migrations/add_email_password_to_users.sql", "r", encoding="utf-8") as f:
            migration_sql = f.read()
        
        # Выполняем миграцию
        await conn.execute(migration_sql)
        
        print("✅ Миграция успешно применена!")
        print("\nДобавлены поля:")
        print("  - email (VARCHAR(255), UNIQUE)")
        print("  - password_hash (VARCHAR(200))")
        print("  - email_verified (BOOLEAN, DEFAULT FALSE)")
        print("  - is_admin (BOOLEAN, DEFAULT FALSE)")
        print("\nТеперь пользователи могут регистрироваться через:")
        print("  1. Discord OAuth (discord_id)")
        print("  2. Email + Password (email + password_hash)")
        
    except Exception as e:
        print(f"❌ Ошибка при применении миграции: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("📦 МИГРАЦИЯ: Добавление Email/Password регистрации")
    print("=" * 60)
    asyncio.run(apply_migration())
