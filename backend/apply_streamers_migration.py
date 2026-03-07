import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

async def apply_migration():
    print("Применяем миграцию streamers...")
    
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    try:
        # Читаем SQL файл
        sql_file = Path(__file__).parent / 'migrations' / 'create_streamers_table.sql'
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Применяем миграцию
        await conn.execute(sql)
        print("✓ Миграция успешно применена!")
        
        # Добавляем тестовых стримеров
        print("\nДобавляем тестовых стримеров...")
        await conn.execute("""
            INSERT INTO streamers (name, game, avatar_url, platform, stream_url, schedule, display_order)
            VALUES 
                ('JaK1L', 'CS2, Dota 2, И другие..', 'https://api.dicebear.com/7.x/avataaars/svg?seed=JaK1L', 'twitch', 'https://twitch.tv/jak1lqa', NULL, 1),
                ('orgeo', 'CS2, Dota 2, И другие..', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DIMA', 'twitch', 'https://twitch.tv/orgeo', 'Пн, Ср, Пт в 19:00', 2),
                ('Kapa_He6ec', 'CS2, Dota 2, И другие..', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spirit', 'twitch', 'https://twitch.tv/kapa', 'Вт, Чт в 20:00', 3)
            ON CONFLICT DO NOTHING
        """)
        print("✓ Тестовые стримеры добавлены")
        
        # Проверяем
        count = await conn.fetchval("SELECT COUNT(*) FROM streamers")
        print(f"✓ Всего стримеров в базе: {count}")
        
    except Exception as e:
        print(f"✗ Ошибка: {e}")
    finally:
        await conn.close()

asyncio.run(apply_migration())
