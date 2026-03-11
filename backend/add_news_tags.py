"""
Добавляет поле tags в таблицу news для хранения тегов новостей.
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def add_tags_column():
    """Добавляет колонку tags в таблицу news"""
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL не найден в .env")
        return
    
    print(f"🔗 Подключение к базе данных...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Проверяем существует ли колонка
        exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'news' 
                AND column_name = 'tags'
            )
        """)
        
        if exists:
            print("✅ Колонка tags уже существует")
        else:
            # Добавляем колонку tags (массив строк)
            await conn.execute("""
                ALTER TABLE news 
                ADD COLUMN tags TEXT[] DEFAULT '{}'
            """)
            print("✅ Колонка tags добавлена в таблицу news")
        
        # Показываем текущую структуру таблицы
        columns = await conn.fetch("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'news'
            ORDER BY ordinal_position
        """)
        
        print("\n📋 Структура таблицы news:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']} (default: {col['column_default']})")
        
    finally:
        await conn.close()
        print("\n✅ Миграция завершена")

if __name__ == "__main__":
    asyncio.run(add_tags_column())
