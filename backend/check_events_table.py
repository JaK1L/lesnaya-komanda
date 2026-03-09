import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv('.env')

async def check_events_table():
    """Проверка структуры таблицы events"""
    try:
        # Убираем channel_binding для asyncpg
        db_url = os.getenv('DATABASE_URL').replace('&channel_binding=require', '')
        conn = await asyncpg.connect(db_url)
        
        # Проверяем колонки
        columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'events' 
            ORDER BY ordinal_position
        """)
        
        print("📋 Колонки таблицы events:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        
        # Проверяем количество записей
        count = await conn.fetchval("SELECT COUNT(*) FROM events")
        print(f"\n📊 Всего событий в БД: {count}")
        
        # Пробуем выполнить тот же запрос, что в admin.py
        try:
            rows = await conn.fetch("""
                SELECT id, title, description, game, event_date, created_by, participants, status, telegram_url, expires_at
                FROM events
                ORDER BY event_date DESC NULLS LAST, id DESC
                LIMIT 50
            """)
            print(f"\n✅ Запрос выполнен успешно, получено {len(rows)} записей")
            if rows:
                print("\nПример первой записи:")
                print(dict(rows[0]))
        except Exception as query_error:
            print(f"\n❌ Ошибка при выполнении запроса: {query_error}")
        
        await conn.close()
        
    except Exception as e:
        print(f"❌ Ошибка подключения к БД: {e}")

if __name__ == "__main__":
    asyncio.run(check_events_table())
