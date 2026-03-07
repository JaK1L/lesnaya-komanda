"""Проверка данных в базе"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

async def check():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        news = await conn.fetchval("SELECT COUNT(*) FROM news")
        events = await conn.fetchval("SELECT COUNT(*) FROM events")
        feed = await conn.fetchval("SELECT COUNT(*) FROM home_feed")
        
        print(f"📰 Новостей: {news}")
        print(f"📅 Событий: {events}")
        print(f"📝 Лента: {feed}")
        
        if news > 0:
            print("\n✅ Данные успешно добавлены!")
        else:
            print("\n❌ Данных нет")
    finally:
        await conn.close()

asyncio.run(check())
