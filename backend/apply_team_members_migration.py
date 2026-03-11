"""
Миграция для добавления полей команды в таблицу users
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
        print("Добавляем поля для членов команды...")
        
        # Добавляем новые поля
        await conn.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS real_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS telegram_url VARCHAR(200),
            ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(200),
            ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(200),
            ADD COLUMN IF NOT EXISTS is_team_member BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS team_role VARCHAR(100),
            ADD COLUMN IF NOT EXISTS team_order INTEGER DEFAULT 0
        """)
        
        print("✅ Миграция успешно применена!")
        
        # Проверяем структуру
        columns = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('real_name', 'bio', 'telegram_url', 'tiktok_url', 'youtube_url', 'is_team_member', 'team_role', 'team_order')
            ORDER BY column_name
        """)
        
        print("\nДобавленные колонки:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(apply_migration())
