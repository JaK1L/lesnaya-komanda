import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

async def apply_migration():
    print("Применяем миграцию expires_at...")
    
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    try:
        # Читаем SQL файл
        sql_file = Path(__file__).parent / 'migrations' / 'add_expires_at_to_events.sql'
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Применяем миграцию
        await conn.execute(sql)
        print("✓ Миграция успешно применена!")
        
        # Проверяем
        result = await conn.fetchrow("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'events' AND column_name = 'expires_at'
        """)
        
        if result:
            print(f"✓ Колонка expires_at добавлена: {result['data_type']}")
        else:
            print("✗ Ошибка: колонка не найдена")
        
    except Exception as e:
        print(f"✗ Ошибка: {e}")
    finally:
        await conn.close()

asyncio.run(apply_migration())
