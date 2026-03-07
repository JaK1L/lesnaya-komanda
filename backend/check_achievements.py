"""
Проверка таблиц достижений
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_achievements():
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    if not DATABASE_URL:
        print("❌ Ошибка: DATABASE_URL не найден в .env")
        return
    
    print("🔌 Подключение к базе данных...")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключено к базе данных")
        
        # Проверяем таблицу achievement_types
        types_count = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
        print(f"\n📊 Типов достижений в базе: {types_count}")
        
        if types_count > 0:
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
            
            # Показываем первые 5 достижений
            achievements = await conn.fetch("""
                SELECT id, name, icon, category, points
                FROM achievement_types
                ORDER BY category, points
                LIMIT 5
            """)
            
            print("\n🏆 Примеры достижений:")
            for ach in achievements:
                print(f"  {ach['icon']} {ach['name']} ({ach['category']}, {ach['points']} очков)")
        
        # Проверяем таблицу user_achievements
        user_ach_count = await conn.fetchval("SELECT COUNT(*) FROM user_achievements")
        print(f"\n👥 Выданных достижений пользователям: {user_ach_count}")
        
        await conn.close()
        print("\n✅ Проверка завершена!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_achievements())
