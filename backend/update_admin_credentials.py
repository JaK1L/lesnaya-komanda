"""
Скрипт для обновления учетных данных администратора
"""
import asyncio
import asyncpg
from app.auth import get_password_hash
from app.config import settings

async def update_admin():
    """Обновить учетные данные администратора"""
    
    # Новые учетные данные
    new_username = "LKBOSS322"
    new_password = "LKTEAMPASSWORD3228"
    
    print(f"🔐 Обновление администратора...")
    print(f"   Новый логин: {new_username}")
    print(f"   Новый пароль: {new_password}")
    
    # Подключаемся к базе данных
    conn = await asyncpg.connect(settings.DATABASE_URL)
    
    try:
        # Хешируем новый пароль
        password_hash = get_password_hash(new_password)
        
        # Обновляем пароль существующего админа
        result = await conn.execute(
            """
            UPDATE admin_users 
            SET password_hash = $2, role = 'admin'
            WHERE username = $1
            """,
            new_username, password_hash
        )
        
        if result == "UPDATE 0":
            # Если админа нет - создаем
            await conn.execute(
                """
                INSERT INTO admin_users (username, password_hash, role)
                VALUES ($1, $2, 'admin')
                """,
                new_username, password_hash
            )
        
        print(f"✅ Администратор успешно обновлен!")
        print(f"   Логин: {new_username}")
        print(f"   Пароль: {new_password}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(update_admin())
