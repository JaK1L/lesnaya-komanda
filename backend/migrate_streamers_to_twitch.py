"""
Миграция таблицы streamers для полной интеграции с Twitch API
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate_streamers():
    """Обновляет структуру таблицы streamers для работы с Twitch API"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL не найден в .env")
        return
    
    print("🔄 Подключение к базе данных...")
    conn = await asyncpg.connect(database_url)
    
    try:
        print("\n📋 Проверка текущей структуры таблицы...")
        
        # Проверяем существует ли таблица
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'streamers'
            )
        """)
        
        if not table_exists:
            print("📝 Создание новой таблицы streamers...")
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
            print("✅ Таблица streamers создана")
        else:
            print("📝 Обновление существующей таблицы...")
            
            # Получаем список существующих колонок
            columns = await conn.fetch("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'streamers'
            """)
            column_names = [col['column_name'] for col in columns]
            
            # Создаем временную таблицу с новой структурой
            print("  → Создание временной таблицы...")
            await conn.execute("""
                CREATE TABLE streamers_new (
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
            
            # Пытаемся мигрировать данные из старой таблицы
            print("  → Миграция существующих данных...")
            
            # Проверяем какие поля есть в старой таблице
            if 'stream_url' in column_names:
                # Старая структура - извлекаем username из URL
                print("  → Обнаружена старая структура, извлекаем username из URL...")
                
                old_streamers = await conn.fetch("SELECT * FROM streamers")
                
                for streamer in old_streamers:
                    # Извлекаем username из stream_url
                    stream_url = streamer.get('stream_url', '')
                    username = None
                    
                    if 'twitch.tv/' in stream_url:
                        username = stream_url.split('twitch.tv/')[-1].strip('/').split('?')[0].split('#')[0]
                    
                    if username:
                        try:
                            await conn.execute("""
                                INSERT INTO streamers_new 
                                (twitch_username, display_name, avatar_url, description, is_active, display_order, created_at, updated_at)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            """,
                                username,
                                streamer.get('name', username),
                                streamer.get('avatar_url'),
                                streamer.get('game'),  # Используем game как description временно
                                streamer.get('is_active', True),
                                streamer.get('display_order', 0),
                                streamer.get('created_at'),
                                streamer.get('updated_at')
                            )
                            print(f"    ✓ Мигрирован: {username}")
                        except Exception as e:
                            print(f"    ⚠️  Ошибка миграции {username}: {e}")
            
            # Удаляем старую таблицу и переименовываем новую
            print("  → Замена таблицы...")
            await conn.execute("DROP TABLE streamers")
            await conn.execute("ALTER TABLE streamers_new RENAME TO streamers")
            
            print("✅ Таблица streamers обновлена")
        
        # Создаем индексы
        print("\n📊 Создание индексов...")
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_streamers_active 
            ON streamers(is_active, display_order)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_streamers_username 
            ON streamers(LOWER(twitch_username))
        """)
        
        print("✅ Индексы созданы")
        
        # Показываем текущее состояние
        count = await conn.fetchval("SELECT COUNT(*) FROM streamers")
        print(f"\n📊 Текущее количество стримеров: {count}")
        
        if count > 0:
            streamers = await conn.fetch("""
                SELECT twitch_username, display_name, is_active 
                FROM streamers 
                ORDER BY display_order, id
            """)
            print("\n📋 Список стримеров:")
            for s in streamers:
                status = "✅" if s['is_active'] else "❌"
                print(f"  {status} {s['display_name']} (@{s['twitch_username']})")
        
        print("\n✅ Миграция завершена успешно!")
        print("\n💡 Теперь в админке можно просто вставлять ссылки на Twitch каналы,")
        print("   и система автоматически получит всю информацию через API!")
        
    except Exception as e:
        print(f"\n❌ Ошибка миграции: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate_streamers())
