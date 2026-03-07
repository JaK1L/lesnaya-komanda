"""
Скрипт для заполнения базы данных тестовыми данными
Использование: python seed_database.py
"""
import asyncio
import asyncpg
import os
from pathlib import Path

# Получаем DATABASE_URL из переменных окружения
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/lesnaya_komanda')

async def seed_database():
    """Заполнить базу данных тестовыми данными"""
    
    print("🌲 Лесная Команда - Заполнение базы данных")
    print("=" * 50)
    
    try:
        # Подключение к БД
        print("📡 Подключение к базе данных...")
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключение установлено")
        
        # Читаем SQL файл
        sql_file = Path(__file__).parent / 'seed_data.sql'
        print(f"📄 Чтение файла: {sql_file}")
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Выполняем SQL
        print("⚙️  Выполнение SQL скрипта...")
        await conn.execute(sql)
        
        print("\n✅ База данных успешно заполнена!")
        print("=" * 50)
        
        # Проверяем результаты
        print("\n📊 Статистика:")
        news_count = await conn.fetchval("SELECT COUNT(*) FROM news WHERE published = true")
        events_count = await conn.fetchval("SELECT COUNT(*) FROM events")
        feed_count = await conn.fetchval("SELECT COUNT(*) FROM home_feed")
        
        print(f"  📰 Опубликованных новостей: {news_count}")
        print(f"  📅 Событий: {events_count}")
        print(f"  📝 Записей в ленте: {feed_count}")
        
        # Показываем последние записи
        print("\n📰 Последние новости:")
        news = await conn.fetch("""
            SELECT title, created_at 
            FROM news 
            WHERE published = true 
            ORDER BY created_at DESC 
            LIMIT 3
        """)
        for i, row in enumerate(news, 1):
            print(f"  {i}. {row['title']}")
        
        print("\n📅 Ближайшие события:")
        events = await conn.fetch("""
            SELECT title, event_date, status 
            FROM events 
            ORDER BY event_date 
            LIMIT 3
        """)
        for i, row in enumerate(events, 1):
            date_str = row['event_date'].strftime('%d.%m.%Y %H:%M') if row['event_date'] else 'Не указано'
            print(f"  {i}. {row['title']} - {date_str} ({row['status']})")
        
        print("\n" + "=" * 50)
        print("🎉 Готово! Данные успешно добавлены в базу.")
        print("\n💡 Проверить данные можно через:")
        print("   - Swagger UI: http://localhost:8000/api/docs")
        print("   - API: http://localhost:8000/api/news")
        print("   - API: http://localhost:8000/api/events")
        print("   - API: http://localhost:8000/api/feed")
        
    except FileNotFoundError:
        print("❌ Ошибка: Файл seed_data.sql не найден")
        print("   Убедитесь, что вы запускаете скрипт из папки backend/")
    except asyncpg.PostgresError as e:
        print(f"❌ Ошибка PostgreSQL: {e}")
        print("\n💡 Проверьте:")
        print("   - Правильность DATABASE_URL")
        print("   - Что база данных запущена")
        print("   - Что таблицы созданы (запустите init.sql)")
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        try:
            await conn.close()
            print("\n🔌 Соединение с базой данных закрыто")
        except:
            pass

if __name__ == "__main__":
    print("\n")
    asyncio.run(seed_database())
    print("\n")
