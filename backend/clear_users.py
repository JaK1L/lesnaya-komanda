"""
Скрипт для очистки таблицы users
ВНИМАНИЕ: Удаляет всех пользователей из базы данных!
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def clear_users():
    """Удаляет всех пользователей из таблицы users"""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Подсчитываем количество пользователей
        count = await conn.fetchval("SELECT COUNT(*) FROM users")
        print(f"📊 Найдено пользователей: {count}")
        
        if count == 0:
            print("✅ Таблица users уже пуста")
            return
        
        # Запрашиваем подтверждение
        confirm = input(f"\n⚠️  ВНИМАНИЕ! Будет удалено {count} пользователей. Продолжить? (yes/no): ")
        
        if confirm.lower() != 'yes':
            print("❌ Операция отменена")
            return
        
        # Удаляем всех пользователей
        # CASCADE автоматически удалит связанные записи в других таблицах
        await conn.execute("DELETE FROM users")
        
        # Сбрасываем счетчик ID
        await conn.execute("ALTER SEQUENCE users_id_seq RESTART WITH 1")
        
        print(f"✅ Успешно удалено {count} пользователей")
        print("✅ Счетчик ID сброшен")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    print("=" * 50)
    print("🗑️  СКРИПТ ОЧИСТКИ ПОЛЬЗОВАТЕЛЕЙ")
    print("=" * 50)
    asyncio.run(clear_users())
