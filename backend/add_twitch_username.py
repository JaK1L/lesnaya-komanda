"""
Добавление колонки twitch_username в таблицу users
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def add_twitch_username():
    """Добавление колонки twitch_username"""
    database_url = os.getenv('DATABASE_URL')
    
    print("=" * 60)
    print("🎮 ДОБАВЛЕНИЕ КОЛОНКИ twitch_username")
    print("=" * 60)
    
    try:
        conn = await asyncpg.connect(database_url)
        print("✅ Подключение к базе данных успешно")
        
        # Проверяем существует ли колонка
        column_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'twitch_username'
            )
        """)
        
        if column_exists:
            print("✅ Колонка twitch_username уже существует")
        else:
            print("📝 Добавление колонки twitch_username...")
            await conn.execute("""
                ALTER TABLE users 
                ADD COLUMN twitch_username VARCHAR(100)
            """)
            print("✅ Колонка twitch_username добавлена")
        
        await conn.close()
        
        print("\n" + "=" * 60)
        print("✅ ГОТОВО")
        print("=" * 60)
        print("\n💡 Теперь пользователи могут указать свой Twitch ник в профиле")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(add_twitch_username())
