"""
Проверка достижений пользователя
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_user_achievements():
    """Проверка достижений пользователя"""
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    
    try:
        print("=== Проверка достижений пользователя ===\n")
        
        # Получаем последнего пользователя
        user = await conn.fetchrow(
            "SELECT id, discord_id, discord_username FROM users ORDER BY id DESC LIMIT 1"
        )
        
        if not user:
            print("❌ Пользователь не найден!")
            return
        
        print(f"Пользователь: {user['discord_username']}")
        print(f"ID: {user['id']}")
        print(f"Discord ID: {user['discord_id']}\n")
        
        # Проверяем типы достижений
        achievement_types = await conn.fetch("SELECT * FROM achievement_types")
        print(f"Всего типов достижений: {len(achievement_types)}\n")
        
        for at in achievement_types:
            print(f"  - {at['icon']} {at['name']} ({at['category']}, {at['points']} очков)")
        
        print("\n" + "="*50 + "\n")
        
        # Проверяем достижения пользователя
        user_achievements = await conn.fetch(
            """
            SELECT 
                ua.id,
                ua.user_id,
                ua.achievement_type_id,
                ua.progress,
                ua.max_progress,
                ua.is_completed,
                ua.earned_at,
                at.name,
                at.icon,
                at.description,
                at.category,
                at.points
            FROM user_achievements ua
            JOIN achievement_types at ON ua.achievement_type_id = at.id
            WHERE ua.user_id = $1
            ORDER BY ua.earned_at DESC
            """,
            user['id']
        )
        
        print(f"Достижений у пользователя: {len(user_achievements)}\n")
        
        if user_achievements:
            for ua in user_achievements:
                status = "✅" if ua['is_completed'] else "⏳"
                print(f"{status} {ua['icon']} {ua['name']}")
                print(f"   Прогресс: {ua['progress']}/{ua['max_progress']}")
                print(f"   Категория: {ua['category']}")
                print(f"   Очки: {ua['points']}")
                if ua['earned_at']:
                    print(f"   Получено: {ua['earned_at']}")
                print()
        else:
            print("❌ У пользователя нет достижений!")
            print("\nВыдайте достижение через админ-панель:")
            print(f"  User ID: {user['id']}")
            print(f"  Discord ID: {user['discord_id']}")
        
        # Проверяем статистику
        stats = await conn.fetchrow(
            """
            SELECT 
                COUNT(*) as total_achievements,
                COUNT(*) FILTER (WHERE is_completed = true) as completed_achievements,
                COALESCE(SUM(at.points) FILTER (WHERE ua.is_completed = true), 0) as total_points
            FROM achievement_types at
            LEFT JOIN user_achievements ua ON at.id = ua.achievement_type_id AND ua.user_id = $1
            """,
            user['id']
        )
        
        print("\n" + "="*50)
        print("СТАТИСТИКА:")
        print(f"  Всего достижений: {stats['total_achievements']}")
        print(f"  Получено: {stats['completed_achievements']}")
        print(f"  Очков: {stats['total_points']}")
        
        if stats['total_achievements'] > 0:
            percentage = (stats['completed_achievements'] / stats['total_achievements']) * 100
            print(f"  Прогресс: {percentage:.1f}%")
    
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_user_achievements())
