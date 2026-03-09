"""
Быстрая проверка достижений
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def quick_check():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    
    try:
        # Проверяем типы достижений
        types_count = await conn.fetchval("SELECT COUNT(*) FROM achievement_types")
        print(f"Типов достижений в системе: {types_count}")
        
        # Проверяем выданные достижения
        user_achievements_count = await conn.fetchval("SELECT COUNT(*) FROM user_achievements")
        print(f"Выдано достижений пользователям: {user_achievements_count}")
        
        if user_achievements_count > 0:
            # Показываем последние выданные
            recent = await conn.fetch("""
                SELECT 
                    u.discord_username,
                    at.name as achievement_name,
                    ua.is_completed,
                    ua.earned_at
                FROM user_achievements ua
                JOIN users u ON ua.user_id = u.id
                JOIN achievement_types at ON ua.achievement_type_id = at.id
                ORDER BY ua.id DESC
                LIMIT 5
            """)
            
            print("\nПоследние выданные достижения:")
            for r in recent:
                status = "✅" if r['is_completed'] else "⏳"
                print(f"  {status} {r['discord_username']}: {r['achievement_name']}")
        else:
            print("\n❌ Никому не выдано ни одного достижения!")
            print("Выдайте достижение через админ-панель")
    
    finally:
        await conn.close()

asyncio.run(quick_check())
