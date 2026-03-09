"""
Скрипт для создания/проверки администратора
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Хеширование пароля"""
    return pwd_context.hash(password)

async def setup_admin():
    """Создание администратора если его нет"""
    database_url = os.getenv('DATABASE_URL')
    admin_username = os.getenv('ADMIN_USERNAME', 'LKBOSS322')
    admin_password = os.getenv('ADMIN_PASSWORD', 'LKTEAMPASSWORD3228')
    
    print("=" * 60)
    print("🔧 НАСТРОЙКА АДМИНИСТРАТОРА")
    print("=" * 60)
    
    try:
        conn = await asyncpg.connect(database_url)
        print("✅ Подключение к базе данных успешно")
        
        # Проверяем существует ли таблица admin_users
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admin_users'
            )
        """)
        
        if not table_exists:
            print("📦 Создание таблицы admin_users...")
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS admin_users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'admin',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            print("✅ Таблица admin_users создана")
        
        # Проверяем существует ли админ
        existing_admin = await conn.fetchrow(
            "SELECT id, username, role FROM admin_users WHERE username = $1",
            admin_username
        )
        
        if existing_admin:
            print(f"✅ Администратор '{admin_username}' уже существует")
            print(f"   ID: {existing_admin['id']}")
            print(f"   Role: {existing_admin['role']}")
        else:
            print(f"📝 Создание администратора '{admin_username}'...")
            password_hash = get_password_hash(admin_password)
            
            result = await conn.fetchrow("""
                INSERT INTO admin_users (username, password_hash, role)
                VALUES ($1, $2, $3)
                RETURNING id, username, role, created_at
            """, admin_username, password_hash, 'admin')
            
            print("✅ Администратор создан успешно!")
            print(f"   ID: {result['id']}")
            print(f"   Username: {result['username']}")
            print(f"   Role: {result['role']}")
            print(f"   Created: {result['created_at']}")
        
        # Также проверим есть ли is_admin в таблице users
        print("\n📊 Проверка пользователей с правами админа в таблице users...")
        admin_users = await conn.fetch("""
            SELECT id, discord_username, email, is_admin 
            FROM users 
            WHERE is_admin = true
            LIMIT 5
        """)
        
        if admin_users:
            print(f"✅ Найдено {len(admin_users)} админов в таблице users:")
            for user in admin_users:
                print(f"   - {user['discord_username']} (ID: {user['id']}, Email: {user['email']})")
        else:
            print("⚠️  Нет пользователей с правами админа в таблице users")
        
        await conn.close()
        
        print("\n" + "=" * 60)
        print("✅ НАСТРОЙКА ЗАВЕРШЕНА")
        print("=" * 60)
        print(f"\n📝 Данные для входа в админку:")
        print(f"   Username: {admin_username}")
        print(f"   Password: {admin_password}")
        print("\n💡 Для входа используйте: https://lesnayakomanda.onrender.com/admin")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(setup_admin())
