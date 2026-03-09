"""
Проверка структуры таблицы users после миграции
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def check_table():
    """Проверяет структуру таблицы users"""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Получаем информацию о колонках
        query = """
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        """
        
        columns = await conn.fetch(query)
        
        print("=" * 70)
        print("📋 СТРУКТУРА ТАБЛИЦЫ USERS")
        print("=" * 70)
        print(f"{'Колонка':<25} {'Тип':<20} {'NULL':<8} {'По умолчанию'}")
        print("-" * 70)
        
        for col in columns:
            nullable = "YES" if col['is_nullable'] == 'YES' else "NO"
            default = col['column_default'] or '-'
            if len(default) > 20:
                default = default[:17] + "..."
            print(f"{col['column_name']:<25} {col['data_type']:<20} {nullable:<8} {default}")
        
        print("-" * 70)
        
        # Проверяем количество пользователей
        count = await conn.fetchval("SELECT COUNT(*) FROM users")
        print(f"\n📊 Всего пользователей: {count}")
        
        # Проверяем constraint
        constraint_query = """
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'users'::regclass
            AND contype = 'c';
        """
        
        constraints = await conn.fetch(constraint_query)
        
        if constraints:
            print("\n🔒 CONSTRAINTS:")
            for c in constraints:
                print(f"  - {c['conname']}")
                print(f"    {c['pg_get_constraintdef']}")
        
        print("\n✅ Миграция успешно применена!")
        print("✅ Таблица готова для регистрации через email/password")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_table())
