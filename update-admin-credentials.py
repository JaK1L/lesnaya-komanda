"""
Скрипт для обновления логина и пароля администратора
"""
import asyncio
import asyncpg
import os
import sys
from passlib.context import CryptContext

# Получаем DATABASE_URL из переменных окружения
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ Ошибка: DATABASE_URL не найден в переменных окружения")
    print("\nДля локального использования:")
    print("  export DATABASE_URL='postgresql://user:password@localhost:5432/dbname'")
    sys.exit(1)

# Render использует postgres://, но asyncpg требует postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

# Настройка хеширования паролей (как в auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Новые данные администратора
NEW_USERNAME = "LesnoyBOSS"
NEW_PASSWORD = "LesnoyBOSS909!"

async def update_admin():
    """Обновить данные администратора"""
    print("🔧 Подключение к базе данных...")
    print(f"📍 URL: {DATABASE_URL[:30]}...")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключение установлено")
        
        # Хешируем новый пароль
        print(f"\n🔐 Хеширование пароля...")
        password_hash = pwd_context.hash(NEW_PASSWORD)
        
        # Проверяем существует ли админ с username 'admin'
        old_admin = await conn.fetchrow(
            "SELECT id, username FROM admin_users WHERE username = 'admin'"
        )
        
        if old_admin:
            print(f"\n📝 Обновление существующего админа (ID: {old_admin['id']})...")
            await conn.execute(
                """
                UPDATE admin_users 
                SET username = $1, password_hash = $2
                WHERE username = 'admin'
                """,
                NEW_USERNAME, password_hash
            )
            print(f"✅ Админ обновлен: admin → {NEW_USERNAME}")
        else:
            # Если старого админа нет, создаем нового
            print(f"\n📝 Создание нового администратора...")
            await conn.execute(
                """
                INSERT INTO admin_users (username, password_hash, role)
                VALUES ($1, $2, 'admin')
                ON CONFLICT (username) DO UPDATE
                SET password_hash = EXCLUDED.password_hash
                """,
                NEW_USERNAME, password_hash
            )
            print(f"✅ Создан новый админ: {NEW_USERNAME}")
        
        # Проверяем что админ создан/обновлен
        admin = await conn.fetchrow(
            "SELECT id, username, role FROM admin_users WHERE username = $1",
            NEW_USERNAME
        )
        
        if admin:
            print(f"\n✅ Проверка успешна:")
            print(f"   ID: {admin['id']}")
            print(f"   Username: {admin['username']}")
            print(f"   Role: {admin['role']}")
        else:
            print("\n⚠️ Не удалось найти созданного админа")
        
        await conn.close()
        
        print(f"\n🎉 Готово! Новые данные для входа:")
        print(f"   Логин: {NEW_USERNAME}")
        print(f"   Пароль: {NEW_PASSWORD}")
        print(f"\n🔗 Войти: https://lesnayakomanda.vercel.app/admin/login")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(update_admin())
