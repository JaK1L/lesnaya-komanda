"""
Установка тестовых Twitch usernames для проверки
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def set_test_twitch():
    """Установка тестовых Twitch usernames"""
    database_url = os.getenv('DATABASE_URL')
    
    print("=" * 60)
    print("🎮 УСТАНОВКА ТЕСТОВЫХ TWITCH USERNAMES")
    print("=" * 60)
    
    try:
        conn = await asyncpg.connect(database_url)
        print("✅ Подключение к базе данных успешно")
        
        # Используем популярных стримеров для теста
        test_usernames = ['shroud', 'xqc', 'summit1g']
        
        # Получаем стримеров
        streamers = await conn.fetch("""
            SELECT id, discord_username
            FROM users
            WHERE is_streamer = true
            ORDER BY id ASC
        """)
        
        if not streamers:
            print("⚠️  Нет стримеров в базе")
            await conn.close()
            return
        
        print(f"\n📝 Установка тестовых Twitch usernames для {len(streamers)} стримеров...")
        
        for i, streamer in enumerate(streamers):
            twitch_username = test_usernames[i % len(test_usernames)]
            
            await conn.execute("""
                UPDATE users 
                SET twitch_username = $1 
                WHERE id = $2
            """, twitch_username, streamer['id'])
            
            print(f"✅ {streamer['discord_username']} -> {twitch_username}")
        
        await conn.close()
        
        print("\n" + "=" * 60)
        print("✅ ГОТОВО")
        print("=" * 60)
        print("\n💡 Теперь можно проверить работу Twitch API на сайте!")
        print("   Эти стримеры часто онлайн, так что увидишь LIVE индикатор")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(set_test_twitch())
