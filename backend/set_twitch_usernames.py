"""
Установка Twitch usernames для стримеров
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

# Маппинг Discord username -> Twitch username
TWITCH_USERNAMES = {
    'testuser': 'testuser_twitch',  # Замени на реальные
    'JaK1L': 'jak1l_twitch',  # Замени на реальные
}

async def set_twitch_usernames():
    """Установка Twitch usernames для стримеров"""
    database_url = os.getenv('DATABASE_URL')
    
    print("=" * 60)
    print("🎮 УСТАНОВКА TWITCH USERNAMES")
    print("=" * 60)
    
    try:
        conn = await asyncpg.connect(database_url)
        print("✅ Подключение к базе данных успешно")
        
        # Получаем всех стримеров
        streamers = await conn.fetch("""
            SELECT id, discord_username, twitch_username
            FROM users
            WHERE is_streamer = true
        """)
        
        if not streamers:
            print("⚠️  Нет стримеров в базе")
            await conn.close()
            return
        
        print(f"\n📝 Найдено стримеров: {len(streamers)}")
        print("\n💡 Укажи Twitch username для каждого стримера:")
        print("   (нажми Enter чтобы пропустить)\n")
        
        updated = 0
        for streamer in streamers:
            current_twitch = streamer['twitch_username'] or '(не указан)'
            print(f"\n👤 {streamer['discord_username']}")
            print(f"   Текущий Twitch: {current_twitch}")
            
            # Пробуем найти в маппинге
            suggested = TWITCH_USERNAMES.get(streamer['discord_username'])
            if suggested:
                print(f"   Предложение: {suggested}")
            
            twitch_username = input("   Новый Twitch username: ").strip()
            
            if twitch_username:
                await conn.execute("""
                    UPDATE users 
                    SET twitch_username = $1 
                    WHERE id = $2
                """, twitch_username, streamer['id'])
                print(f"   ✅ Обновлено: {twitch_username}")
                updated += 1
            else:
                print("   ⏭️  Пропущено")
        
        await conn.close()
        
        print("\n" + "=" * 60)
        print(f"✅ ГОТОВО - обновлено {updated} стримеров")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(set_twitch_usernames())
