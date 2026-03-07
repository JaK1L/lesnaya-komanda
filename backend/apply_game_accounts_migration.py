"""
Скрипт для применения миграции игровых аккаунтов
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def apply_migration():
    """Применить миграцию игровых аккаунтов."""
    
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
        with open("migrations/create_game_accounts.sql", "r", encoding="utf-8") as f:
            sql = f.read()
        
        print("📝 Применение миграции игровых аккаунтов...")
        await conn.execute(sql)
        print("✅ Миграция успешно применена!")
        
        # Проверяем результат
        count = await conn.fetchval("SELECT COUNT(*) FROM game_accounts")
        print(f"📊 Привязанных аккаунтов в базе: {count}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        await conn.close()
        print("🔌 Соединение закрыто")

if __name__ == "__main__":
    asyncio.run(apply_migration())
