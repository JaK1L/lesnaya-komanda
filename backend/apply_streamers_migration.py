"""
Миграция для добавления колонки is_streamer
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def apply_migration():
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Добавляем колонку is_streamer...")
        
        # Добавляем колонку если её нет
        await conn.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_streamer BOOLEAN DEFAULT false
        """)
        
        print("✅ Миграция успешно применена!")
        
        # Проверяем структуру
        columns = await conn.fetch("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'is_streamer'
        """)
        
        if columns:
            print("\nКолонка is_streamer:")
            for col in columns:
                print(f"  - {col['column_name']}: {col['data_type']} (default: {col['column_default']})")
        else:
            print("⚠️ Колонка is_streamer не найдена после миграции")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(apply_migration())
