"""
Скрипт для применения миграции регистраций на события
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def apply_migration():
    """Применить миграцию регистраций на события."""
    
    # Подключение к базе данных
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL не найден в .env")
        return
    
    print("🔌 Подключение к базе данных...")
    conn = await asyncpg.connect(database_url)
    
    try:
        print("✅ Подключено к базе данных")
        
        # Читаем SQL файл
        with open("migrations/add_event_registrations.sql", "r", encoding="utf-8") as f:
            sql = f.read()
        
        print("📝 Применение миграции регистраций на события...")
        await conn.execute(sql)
        print("✅ Миграция успешно применена!")
        
        # Проверяем результат
        count = await conn.fetchval("SELECT COUNT(*) FROM event_registrations")
        print(f"📊 Регистраций в базе: {count}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        await conn.close()
        print("🔌 Соединение закрыто")

if __name__ == "__main__":
    asyncio.run(apply_migration())
