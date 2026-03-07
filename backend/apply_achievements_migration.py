"""
Применить миграцию системы достижений
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def apply_migration():
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    if not DATABASE_URL:
        print("❌ Ошибка: DATABASE_URL не найден в .env")
        return
    
    print("🔌 Подключение к базе данных...")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключено к базе данных")
        
        # Читаем SQL файл
        with open('migrations/create_achievements_system.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
        
        print("📝 Применение миграции системы достижений...")
        await conn.execute(sql)
        print("✅ Миграция успешно применена!")
        
        # Проверяем результат
        types_count = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
        print(f"📊 Создано типов достижений: {types_count}")
        
        # Показываем категории
        categories = await conn.fetch("""
            SELECT category, COUNT(*) as count 
            FROM achievement_types 
            GROUP BY category 
            ORDER BY category
        """)
        
        print("\n📋 Достижения по категориям:")
        for cat in categories:
            print(f"  - {cat['category']}: {cat['count']}")
        
        await conn.close()
        print("\n✅ Готово!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(apply_migration())
