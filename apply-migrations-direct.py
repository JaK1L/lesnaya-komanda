#!/usr/bin/env python3
"""
Прямое применение миграций к базе данных через asyncpg
"""
import asyncio
import asyncpg

# Connection string
DATABASE_URL = "postgresql://neondb_owner:npg_PRJbuN0f4Yyc@ep-purple-boat-agxuy7jr.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# SQL миграций
MIGRATION_1 = """
-- Add profile fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS site_nickname VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Create index for visibility queries
CREATE INDEX IF NOT EXISTS idx_users_is_hidden ON users(is_hidden);

-- Comments for documentation
COMMENT ON COLUMN users.site_nickname IS 'User-defined nickname for the site, independent from Discord username';
COMMENT ON COLUMN users.bio IS 'User biography/description, max 500 characters';
COMMENT ON COLUMN users.is_hidden IS 'Flag to hide user from public lists while keeping profile accessible via direct URL';
"""

MIGRATION_2 = """
-- Add is_admin column for Discord role-based admin access
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster admin checks (partial index for admins only)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Set is_admin to FALSE for all existing users
UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL;

-- Comments for documentation
COMMENT ON COLUMN users.is_admin IS 'Flag indicating if user has Discord role "🐓ПИТУХ🐓" and should have admin access';
"""


async def apply_migrations():
    """Применить миграции к базе данных"""
    print("=" * 60)
    print("🔧 ПРИМЕНЕНИЕ МИГРАЦИЙ")
    print("=" * 60)
    print()
    
    try:
        print("📡 Подключение к базе данных...")
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключено!")
        print()
        
        # Миграция 1
        print("📝 Применение миграции 1: add_profile_fields")
        await conn.execute(MIGRATION_1)
        print("✅ Миграция 1 применена успешно!")
        print()
        
        # Миграция 2
        print("📝 Применение миграции 2: add_is_admin_column")
        await conn.execute(MIGRATION_2)
        print("✅ Миграция 2 применена успешно!")
        print()
        
        # Проверка
        print("🔍 Проверка результата...")
        result = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('site_nickname', 'bio', 'is_hidden', 'is_admin')
            ORDER BY column_name
        """)
        
        print("Созданные колонки:")
        for row in result:
            print(f"  - {row['column_name']}: {row['data_type']}")
        
        await conn.close()
        print()
        print("=" * 60)
        print("✅ ВСЕ МИГРАЦИИ ПРИМЕНЕНЫ УСПЕШНО!")
        print("=" * 60)
        print()
        print("Теперь можно:")
        print("1. Зайти на https://lesnaya-komanda.vercel.app")
        print("2. Войти через Discord")
        print("3. Открыть ПРОФИЛЬ - должно работать!")
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ ОШИБКА")
        print("=" * 60)
        print(f"Ошибка: {e}")
        print()
        print("Возможные причины:")
        print("1. База данных Neon 'спит' (бесплатный план)")
        print("2. Неверные данные подключения")
        print("3. Проблемы с сетью")
        print()
        print("Попробуйте:")
        print("1. Зайти на https://console.neon.tech и 'разбудить' базу")
        print("2. Проверить что база данных активна")
        print("3. Запустить скрипт снова")


if __name__ == "__main__":
    try:
        asyncio.run(apply_migrations())
    except KeyboardInterrupt:
        print("\n\n⚠️ Прервано пользователем.")
