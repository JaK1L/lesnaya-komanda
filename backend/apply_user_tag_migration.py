"""
Применение миграции для добавления user_tag
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def apply_migration():
    """Применяет миграцию для добавления user_tag"""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("🔄 Применение миграции user_tag...")
        
        # Читаем SQL файл
        with open("migrations/add_user_tag.sql", "r", encoding="utf-8") as f:
            migration_sql = f.read()
        
        # Выполняем миграцию
        await conn.execute(migration_sql)
        
        print("✅ Миграция успешно применена!")
        print("\nДобавлено поле:")
        print("  - user_tag (VARCHAR(100), UNIQUE)")
        print("\nСоздана функция:")
        print("  - generate_user_tag(username) - генерация уникального тега")
        print("\nПример тега: username#0001")
        
        # Проверяем существующих пользователей
        count = await conn.fetchval("SELECT COUNT(*) FROM users WHERE user_tag IS NOT NULL")
        print(f"\n✅ Обновлено пользователей: {count}")
        
    except Exception as e:
        print(f"❌ Ошибка при применении миграции: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("📦 МИГРАЦИЯ: Добавление уникального user_tag")
    print("=" * 60)
    asyncio.run(apply_migration())
