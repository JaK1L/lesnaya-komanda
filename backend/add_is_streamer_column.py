"""
Добавление колонки is_streamer в таблицу users
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def add_is_streamer_column():
    """Добавление колонки is_streamer"""
    database_url = os.getenv('DATABASE_URL')
    
    print("=" * 60)
    print("🔧 ДОБАВЛЕНИЕ КОЛОНКИ is_streamer")
    print("=" * 60)
    
    try:
        conn = await asyncpg.connect(database_url)
        print("✅ Подключение к базе данных успешно")
        
        # Проверяем существует ли колонка
        column_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'is_streamer'
            )
        """)
        
        if column_exists:
            print("✅ Колонка is_streamer уже существует")
        else:
            print("📝 Добавление колонки is_streamer...")
            await conn.execute("""
                ALTER TABLE users 
                ADD COLUMN is_streamer BOOLEAN DEFAULT false
            """)
            print("✅ Колонка is_streamer добавлена")
        
        # Проверим сколько стримеров
        streamer_count = await conn.fetchval("""
            SELECT COUNT(*) FROM users WHERE is_streamer = true
        """)
        print(f"📊 Стримеров в базе: {streamer_count}")
        
        if streamer_count == 0:
            print("\n💡 Чтобы добавить стримера, выполните:")
            print("   UPDATE users SET is_streamer = true WHERE discord_id = <discord_id>;")
        
        await conn.close()
        
        print("\n" + "=" * 60)
        print("✅ ГОТОВО")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(add_is_streamer_column())
