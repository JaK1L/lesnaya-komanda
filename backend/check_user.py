import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

# Загружаем переменные окружения
load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)

async def check_user():
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL не найден в .env")
        return
    
    conn = await asyncpg.connect(DATABASE_URL)
    
    email = 'jak1lz1q@gmail.com'
    
    # Проверяем пользователя
    row = await conn.fetchrow(
        '''SELECT id, email, discord_username, password_hash, is_admin 
           FROM users WHERE email = $1''', 
        email.lower()
    )
    
    if row:
        print(f"✅ Пользователь найден:")
        print(f"  ID: {row['id']}")
        print(f"  Email: {row['email']}")
        print(f"  Username: {row['discord_username']}")
        print(f"  Есть пароль: {row['password_hash'] is not None}")
        print(f"  Админ: {row['is_admin']}")
        
        if row['password_hash']:
            # Проверяем пароль
            password = '22qq11QWE'
            is_valid = verify_password(password, row['password_hash'])
            print(f"\n🔑 Проверка пароля '22qq11QWE': {'✅ ВЕРНЫЙ' if is_valid else '❌ НЕВЕРНЫЙ'}")
        else:
            print("\n⚠️ У пользователя нет установленного пароля!")
    else:
        print(f"❌ Пользователь с email '{email}' не найден")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_user())
