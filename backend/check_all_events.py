import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_events():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    rows = await conn.fetch('SELECT * FROM events ORDER BY id DESC')
    print(f'Всего событий в базе: {len(rows)}')
    print('\nСобытия:')
    for r in rows:
        print(f'\nID: {r["id"]}')
        print(f'Title: {r["title"]}')
        print(f'Description: {r["description"]}')
        print(f'Game: {r["game"]}')
        print(f'Date: {r["event_date"]}')
        print(f'Status: {r["status"]}')
        print(f'Telegram URL: {r["telegram_url"]}')
        print('-' * 50)
    await conn.close()

asyncio.run(check_events())
