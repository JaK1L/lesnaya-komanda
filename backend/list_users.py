"""
Список всех пользователей в базе
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def list_users():
    """Выводит список всех пользователей"""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        query = """
            SELECT 
                id, 
                discord_username, 
                email, 
                discord_id,
                is_admin,
                forest_rank,
                user_tag,
                created_at
            FROM users
            ORDER BY id;
        """
        
        users = await conn.fetch(query)
        
        print("=" * 120)
        print("👥 СПИСОК ПОЛЬЗОВАТЕЛЕЙ")
        print("=" * 120)
        
        if not users:
            print("Пользователей нет")
        else:
            print(f"{'ID':<5} {'Username':<20} {'User Tag':<20} {'Email':<30} {'Admin':<7} {'Rank'}")
            print("-" * 120)
            
            for user in users:
                email = user['email'] or '-'
                admin = '✅' if user['is_admin'] else '❌'
                user_tag = user['user_tag'] or '-'
                
                print(f"{user['id']:<5} {user['discord_username']:<20} {user_tag:<20} {email:<30} {admin:<7} {user['forest_rank']}")
        
        print("-" * 120)
        print(f"Всего: {len(users)} пользователей")
        
        # Статистика
        email_users = sum(1 for u in users if u['email'])
        discord_users = sum(1 for u in users if u['discord_id'])
        admins = sum(1 for u in users if u['is_admin'])
        
        print(f"\n📊 Статистика:")
        print(f"  - Email регистрация: {email_users}")
        print(f"  - Discord OAuth: {discord_users}")
        print(f"  - Администраторы: {admins}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(list_users())
