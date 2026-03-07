"""
Скрипт для применения миграции добавления image_url в таблицу news
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def apply_migration():
    """Применить миграцию для добавления image_url"""
    print("🔄 Подключение к базе данных...")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключение установлено")
        
        # Читаем SQL миграцию
        with open("migrations/add_image_url_to_news.sql", "r", encoding="utf-8") as f:
            migration_sql = f.read()
        
        print("\n📝 Применяем миграцию:")
        print(migration_sql)
        
        # Применяем миграцию
        await conn.execute(migration_sql)
        
        print("\n✅ Миграция успешно применена!")
        
        # Проверяем структуру таблицы
        print("\n🔍 Проверка структуры таблицы news:")
        columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'news'
            ORDER BY ordinal_position
        """)
        
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        
        await conn.close()
        print("\n✅ Готово!")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(apply_migration())
