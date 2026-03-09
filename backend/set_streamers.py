"""
Установка флага is_streamer для пользователей
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def set_streamers():
    """Установка флага is_streamer для первых 5 пользователей"""
    database_url = os.getenv('DATABASE_URL')
    
    print("=" * 60)
    print("🎮 УСТАНОВКА СТРИМЕРОВ")
    print("=" * 60)
    
    try:
        conn = await asyncpg.connect(database_url)
        print("✅ Подключение к базе данных успешно")
        
        # Получаем первых 5 пользователей
        users = await conn.fetch("""
            SELECT id, discord_id, discord_username, avatar_url
            FROM users
            ORDER BY id ASC
            LIMIT 5
        """)
        
        if not users:
            print("⚠️  Нет пользователей в базе")
            await conn.close()
            return
        
        print(f"\n📝 Установка флага is_streamer для {len(users)} пользователей...")
        
        for user in users:
            await conn.execute("""
                UPDATE users 
                SET is_streamer = true 
                WHERE id = $1
            """, user['id'])
            
            print(f"✅ {user['discord_username']} (ID: {user['discord_id']}) - теперь стример")
        
        # Проверяем результат
        streamer_count = await conn.fetchval("""
            SELECT COUNT(*) FROM users WHERE is_streamer = true
        """)
        
        print(f"\n📊 Всего стримеров в базе: {streamer_count}")
        
        await conn.close()
        
        print("\n" + "=" * 60)
        print("✅ ГОТОВО")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(set_streamers())
