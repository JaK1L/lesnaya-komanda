"""
Скрипт для прямого применения миграции системы достижений в Neon
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def apply_migration():
    """Применить миграцию системы достижений"""
    print("🔄 Подключение к базе данных...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Проверяем существует ли таблица
        exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'achievement_types'
            )
        """)
        
        if exists:
            print("✅ Таблица achievement_types уже существует")
            
            # Проверяем количество записей
            count = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
            print(f"📊 В таблице {count} типов достижений")
            
            if count == 0:
                print("⚠️ Таблица пустая, добавляем базовые достижения...")
                await insert_base_achievements(conn)
            
            return
        
        print("📝 Создание таблиц системы достижений...")
        
        # Создаем таблицу типов достижений
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS achievement_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(50) DEFAULT '🏆',
                category VARCHAR(50) DEFAULT 'general',
                requirement JSONB,
                points INTEGER DEFAULT 10,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        ''')
        print("✅ Таблица achievement_types создана")
        
        # Создаем индексы
        await conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_achievement_types_category ON achievement_types(category);
            CREATE INDEX IF NOT EXISTS idx_achievement_types_active ON achievement_types(is_active);
        ''')
        print("✅ Индексы для achievement_types созданы")
        
        # Создаем таблицу достижений пользователей
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS user_achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                achievement_type_id INTEGER REFERENCES achievement_types(id) ON DELETE CASCADE,
                progress INTEGER DEFAULT 0,
                max_progress INTEGER DEFAULT 100,
                earned_at TIMESTAMP,
                is_completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, achievement_type_id)
            );
        ''')
        print("✅ Таблица user_achievements создана")
        
        # Создаем индексы
        await conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type_id);
            CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);
            CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);
        ''')
        print("✅ Индексы для user_achievements созданы")
        
        # Вставляем базовые достижения
        await insert_base_achievements(conn)
        
        print("\n🎉 Миграция успешно применена!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        await conn.close()
        print("🔌 Соединение закрыто")


async def insert_base_achievements(conn):
    """Вставить базовые достижения"""
    print("📝 Добавление базовых достижений...")
    
    await conn.execute('''
        INSERT INTO achievement_types (name, description, icon, category, requirement, points) VALUES
        -- Активность
        ('Первые шаги', 'Присоединился к сообществу', '🌱', 'activity', '{"type": "join"}', 5),
        ('Болтун', 'Отправил 100 сообщений', '💬', 'activity', '{"type": "messages", "count": 100}', 10),
        ('Говорун', 'Отправил 500 сообщений', '🗣️', 'activity', '{"type": "messages", "count": 500}', 25),
        ('Легенда чата', 'Отправил 1000 сообщений', '👑', 'activity', '{"type": "messages", "count": 1000}', 50),
        
        -- Голосовые каналы
        ('Слушатель', 'Провел 10 часов в войсе', '🎧', 'voice', '{"type": "voice_hours", "count": 10}', 10),
        ('Собеседник', 'Провел 50 часов в войсе', '🎤', 'voice', '{"type": "voice_hours", "count": 50}', 25),
        ('Радиоведущий', 'Провел 100 часов в войсе', '📻', 'voice', '{"type": "voice_hours", "count": 100}', 50),
        
        -- События
        ('Участник', 'Посетил первое событие', '🎯', 'events', '{"type": "events_attended", "count": 1}', 10),
        ('Активист', 'Посетил 5 событий', '⭐', 'events', '{"type": "events_attended", "count": 5}', 25),
        ('Фанат', 'Посетил 10 событий', '🌟', 'events', '{"type": "events_attended", "count": 10}', 50),
        
        -- Игры CS2
        ('Новичок CS2', 'Первая победа в CS2', '🔫', 'games', '{"type": "game_wins", "game": "cs2", "count": 1}', 10),
        ('Боец CS2', '10 побед в CS2', '⚔️', 'games', '{"type": "game_wins", "game": "cs2", "count": 10}', 25),
        ('Мастер CS2', '50 побед в CS2', '👑', 'games', '{"type": "game_wins", "game": "cs2", "count": 50}', 50),
        
        -- Игры Dota 2
        ('Новичок Dota 2', 'Первая победа в Dota 2', '🛡️', 'games', '{"type": "game_wins", "game": "dota2", "count": 1}', 10),
        ('Боец Dota 2', '10 побед в Dota 2', '⚡', 'games', '{"type": "game_wins", "game": "dota2", "count": 10}', 25),
        ('Мастер Dota 2', '50 побед в Dota 2', '🏆', 'games', '{"type": "game_wins", "game": "dota2", "count": 50}', 50),
        
        -- Специальные
        ('Старожил', 'В сообществе более года', '🎂', 'special', '{"type": "member_days", "count": 365}', 100),
        ('Легенда', 'Получил все достижения', '💎', 'special', '{"type": "all_achievements"}', 500)
        ON CONFLICT DO NOTHING
    ''')
    
    count = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
    print(f"✅ Добавлено {count} типов достижений")


if __name__ == "__main__":
    asyncio.run(apply_migration())
