"""
Скрипт для применения миграции XP системы напрямую к базе данных
Работает как локально, так и на Render.com
"""
import asyncio
import asyncpg
import os
import sys
from pathlib import Path

# Получаем DATABASE_URL из переменных окружения
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ Ошибка: DATABASE_URL не найден в переменных окружения")
    print("\nДля локального использования:")
    print("  export DATABASE_URL='postgresql://user:password@localhost:5432/dbname'")
    print("\nДля Render.com:")
    print("  DATABASE_URL должен быть автоматически доступен")
    sys.exit(1)

# Render использует postgres://, но asyncpg требует postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

async def apply_migration():
    """Применить миграцию XP системы"""
    print("🔧 Подключение к базе данных...")
    print(f"📍 URL: {DATABASE_URL[:30]}...") # Показываем только начало для безопасности
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключение установлено")
        
        # Читаем SQL файл
        migration_file = Path(__file__).parent / 'backend' / 'migrations' / 'add_xp_and_level.sql'
        
        # Если запускаем на Render, путь может быть другим
        if not migration_file.exists():
            migration_file = Path('/opt/render/project/src/backend/migrations/add_xp_and_level.sql')
        
        if not migration_file.exists():
            # Пробуем относительный путь
            migration_file = Path('backend/migrations/add_xp_and_level.sql')
        
        print(f"\n📝 Чтение миграции: {migration_file}")
        
        if not migration_file.exists():
            print(f"❌ Файл миграции не найден: {migration_file}")
            print("\nПопытка найти файл...")
            # Ищем файл
            for path in ['.', '..', '../..']:
                search_path = Path(path) / 'backend' / 'migrations' / 'add_xp_and_level.sql'
                if search_path.exists():
                    migration_file = search_path
                    print(f"✅ Найден: {migration_file}")
                    break
            else:
                print("❌ Не удалось найти файл миграции")
                await conn.close()
                sys.exit(1)
        
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
        print("\n🎉 Теперь можно перезапустить бэкенд и проверить сайт!")
        
    except asyncpg.exceptions.DuplicateColumnError as e:
        print(f"\n⚠️ Колонки уже существуют: {e}")
        print("✅ Миграция уже была применена ранее. Всё в порядке!")
    except asyncpg.exceptions.DuplicateTableError as e:
        print(f"\n⚠️ Таблицы уже существуют: {e}")
        print("✅ Миграция уже была применена ранее. Всё в порядке!")
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(apply_migration())
