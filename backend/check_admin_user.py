"""
Проверка администратора в базе данных
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_admin():
    """Проверка администратора"""
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    
    try:
        print("=== Проверка администратора ===\n")
        
        # Проверяем существование таблицы
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admin_users'
            )
        """)
        
        if not table_exists:
            print("❌ Таблица admin_users не существует!")
            return
        
        print("✅ Таблица admin_users существует\n")
        
        # Получаем всех админов
        admins = await conn.fetch("SELECT * FROM admin_users")
        
        if not admins:
            print("❌ Нет администраторов в базе данных!")
            print("\nСоздайте администратора командой:")
            print("python backend/create_admin.py")
            return
        
        print(f"Найдено администраторов: {len(admins)}\n")
        
        for admin in admins:
            print(f"ID: {admin['id']}")
            print(f"Username: {admin['username']}")
            print(f"Role: {admin['role']}")
            print(f"Password hash: {admin['password_hash'][:50]}...")
            print(f"Created: {admin['created_at']}")
            
            # Проверяем пароль из .env
            env_username = os.getenv("ADMIN_USERNAME")
            env_password = os.getenv("ADMIN_PASSWORD")
            
            if admin['username'] == env_username:
                print(f"\n✅ Username совпадает с .env: {env_username}")
                
                # Проверяем пароль
                if pwd_context.verify(env_password, admin['password_hash']):
                    print(f"✅ Пароль из .env подходит!")
                else:
                    print(f"❌ Пароль из .env НЕ подходит!")
                    print(f"   Пароль в .env: {env_password}")
            else:
                print(f"\n⚠️ Username НЕ совпадает с .env")
                print(f"   В базе: {admin['username']}")
                print(f"   В .env: {env_username}")
            
            print("-" * 50)
    
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_admin())
