"""
Поиск пользователя
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def find_user():
    """Поиск пользователя"""
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    
    try:
        print("=== Поиск пользователей ===\n")
        
        # Получаем всех пользователей
        users = await conn.fetch(
            "SELECT id, discord_id, discord_username FROM users ORDER BY id DESC LIMIT 20"
        )
        
        print(f"Последние {len(users)} пользователей:\n")
        
        for user in users:
            print(f"ID: {user['id']:4d} | Discord ID: {user['discord_id']:20d} | Username: {user['discord_username']}")
    
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(find_user())
