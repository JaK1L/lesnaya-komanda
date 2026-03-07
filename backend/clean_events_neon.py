import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def clean_events():
    # Подключаемся к Neon базе
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    print("Текущие события в базе:")
    rows = await conn.fetch('SELECT id, title, event_date FROM events ORDER BY id')
    for r in rows:
        print(f"  ID: {r['id']}, Title: {r['title']}, Date: {r['event_date']}")
    
    print("\nУдаляем старые события (ID 1, 2, 3)...")
    result = await conn.execute('DELETE FROM events WHERE id IN (1, 2, 3)')
    print(f"Удалено: {result}")
    
    print("\nОставшиеся события:")
    rows = await conn.fetch('SELECT id, title, event_date FROM events ORDER BY id')
    for r in rows:
        print(f"  ID: {r['id']}, Title: {r['title']}, Date: {r['event_date']}")
    
    await conn.close()
    print("\nГотово!")

asyncio.run(clean_events())
