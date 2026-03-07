"""
Тестовый скрипт для проверки API достижений
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def test_achievements():
    """Тестирование запроса достижений"""
    print("🔄 Подключение к базе данных...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Проверяем существование таблицы
        exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'achievement_types'
            )
        """)
        print(f"✅ Таблица achievement_types существует: {exists}")
        
        if not exists:
            print("❌ Таблица не существует!")
            return
        
        # Проверяем количество записей
        count = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
        print(f"📊 Всего типов достижений: {count}")
        
        # Проверяем активные достижения
        active_count = await conn.fetchval(
            "SELECT COUNT(*) FROM achievement_types WHERE is_active = true"
        )
        print(f"📊 Активных достижений: {active_count}")
        
        # Выполняем тот же запрос что и в API
        print("\n🔍 Выполнение запроса из API...")
        rows = await conn.fetch(
            "SELECT * FROM achievement_types WHERE is_active = true ORDER BY category, points, id"
        )
        
        print(f"✅ Получено {len(rows)} записей")
        
        if rows:
            print("\n📋 Первые 5 достижений:")
            for i, row in enumerate(rows[:5], 1):
                print(f"{i}. {row['icon']} {row['name']} ({row['category']}, {row['points']} поинтов)")
        
        # Проверяем структуру данных
        if rows:
            print("\n🔍 Структура первой записи:")
            first_row = dict(rows[0])
            for key, value in first_row.items():
                print(f"  {key}: {value} ({type(value).__name__})")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()
        print("\n🔌 Соединение закрыто")


if __name__ == "__main__":
    asyncio.run(test_achievements())
