"""
Скрипт для удаления дубликатов достижений
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def remove_duplicates():
    """Удалить дубликаты достижений"""
    print("🔄 Подключение к базе данных...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Проверяем количество до удаления
        count_before = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
        print(f"📊 Достижений до очистки: {count_before}")
        
        # Находим дубликаты
        duplicates = await conn.fetch("""
            SELECT name, category, COUNT(*) as count
            FROM achievement_types
            GROUP BY name, category
            HAVING COUNT(*) > 1
            ORDER BY name
        """)
        
        if not duplicates:
            print("✅ Дубликатов не найдено!")
            return
        
        print(f"\n⚠️ Найдено {len(duplicates)} групп дубликатов:")
        for dup in duplicates:
            print(f"  - {dup['name']} ({dup['category']}): {dup['count']} копий")
        
        # Удаляем дубликаты, оставляя только запись с минимальным ID
        print("\n🗑️ Удаление дубликатов...")
        result = await conn.execute("""
            DELETE FROM achievement_types a
            USING achievement_types b
            WHERE a.id > b.id 
              AND a.name = b.name 
              AND a.category = b.category
        """)
        
        # Извлекаем количество удаленных записей из результата
        deleted_count = int(result.split()[-1]) if result.startswith("DELETE") else 0
        print(f"✅ Удалено {deleted_count} дубликатов")
        
        # Проверяем количество после удаления
        count_after = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
        print(f"📊 Достижений после очистки: {count_after}")
        
        # Показываем оставшиеся достижения
        print("\n📋 Оставшиеся достижения:")
        achievements = await conn.fetch("""
            SELECT id, name, category, points, icon
            FROM achievement_types
            ORDER BY category, points, id
        """)
        
        current_category = None
        for ach in achievements:
            if ach['category'] != current_category:
                current_category = ach['category']
                print(f"\n{current_category.upper()}:")
            print(f"  {ach['icon']} {ach['name']} ({ach['points']} поинтов) [ID: {ach['id']}]")
        
        print(f"\n🎉 Очистка завершена! Осталось {count_after} уникальных достижений")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()
        print("🔌 Соединение закрыто")


if __name__ == "__main__":
    asyncio.run(remove_duplicates())
