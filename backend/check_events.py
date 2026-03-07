import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_events():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    rows = await conn.fetch('SELECT id, title, event_date FROM events ORDER BY id DESC')
    print('События в базе:')
    for r in rows:
        print(f'ID: {r["id"]}, Title: {r["title"]}, Date: {r["event_date"]}')
    await conn.close()

asyncio.run(check_events())
