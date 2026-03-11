"""
Пересоздание таблицы streamers для Twitch API
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def recreate_streamers_table():
    """Пересоздает таблицу streamers с новой структурой"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL не найден в .env")
        return
    
    print("🔄 Подключение к базе данных...")
    
    try:
        conn = await asyncpg.connect(database_url)
        
        print("\n⚠️  ВНИМАНИЕ: Это удалит существующую таблицу streamers!")
        print("Продолжить? (yes/no): ", end='')
        
        # В автоматическом режиме просто продолжаем
        confirm = input().strip().lower()
        if confirm != 'yes':
            print("❌ Отменено")
            await conn.close()
            return
        
        print("\n📝 Удаление старой таблицы...")
        await conn.execute("DROP TABLE IF EXISTS streamers CASCADE")
        
        print("📝 Создание новой таблицы...")
        await conn.execute("""
            CREATE TABLE streamers (
                id SERIAL PRIMARY KEY,
                twitch_username VARCHAR(100) NOT NULL UNIQUE,
                display_name VARCHAR(100) NOT NULL,
                avatar_url TEXT,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        print("📊 Создание индексов...")
        await conn.execute("""
            CREATE INDEX idx_streamers_active 
            ON streamers(is_active, display_order)
        """)
        await conn.execute("""
            CREATE INDEX idx_streamers_username 
            ON streamers(LOWER(twitch_username))
        """)
        
        print("\n✅ Таблица streamers успешно пересоздана!")
        print("\n💡 Теперь можно добавлять стримеров через админку,")
        print("   просто вставляя ссылки на их Twitch каналы!")
        
        await conn.close()
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(recreate_streamers_table())
