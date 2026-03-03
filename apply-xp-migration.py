"""
Скрипт для применения миграции XP системы напрямую к базе данных
"""
import asyncio
import asyncpg
import os
from pathlib import Path

# Получаем DATABASE_URL из .env или используем значение по умолчанию
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/lesnaya')

async def apply_migration():
    """Применить миграцию XP системы"""
    print("🔧 Подключение к базе данных...")
    print(f"📍 URL: {DATABASE_URL}")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключение установлено")
        
        # Читаем SQL файл
        migration_file = Path(__file__).parent / 'backend' / 'migrations' / 'add_xp_and_level.sql'
        print(f"\n📝 Чтение миграции: {migration_file}")
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        print("\n🚀 Применение миграции...")
        await conn.execute(sql)
        print("✅ Миграция успешно применена!")
        
        # Проверяем что колонки добавились
        print("\n🔍 Проверка колонок...")
        columns = await conn.fetch("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'users' 
            AND column_name IN ('level', 'current_xp', 'total_xp', 'points')
            ORDER BY column_name
        """)
        
        if columns:
            print("✅ Колонки успешно добавлены:")
            for col in columns:
                print(f"   - {col['column_name']}: {col['data_type']} (default: {col['column_default']})")
        else:
            print("⚠️ Колонки не найдены")
        
        # Проверяем таблицы
        print("\n🔍 Проверка таблиц...")
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('xp_transactions', 'points_purchases')
            ORDER BY table_name
        """)
        
        if tables:
            print("✅ Таблицы успешно созданы:")
            for table in tables:
                print(f"   - {table['table_name']}")
        else:
            print("⚠️ Таблицы не найдены")
        
        await conn.close()
        print("\n✅ Готово! Миграция применена успешно.")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(apply_migration())
