-- ============================================
-- DIRECT SQL MIGRATIONS
-- ============================================
-- Этот файл можно выполнить напрямую в pgAdmin
-- или любом другом PostgreSQL клиенте
-- ============================================

-- МИГРАЦИЯ 1: Добавление полей профиля
-- ============================================

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

-- ============================================
-- МИГРАЦИЯ 2: Добавление колонки is_admin
-- ============================================

-- Add is_admin column for Discord role-based admin access
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster admin checks (partial index for admins only)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Set is_admin to FALSE for all existing users
UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL;

-- Comments for documentation
COMMENT ON COLUMN users.is_admin IS 'Flag indicating if user has Discord role "🐓ПИТУХ🐓" and should have admin access';

-- ============================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================

-- Проверить что колонки созданы
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('site_nickname', 'bio', 'is_hidden', 'is_admin')
ORDER BY column_name;

-- Проверить индексы
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
AND indexname IN ('idx_users_is_hidden', 'idx_users_is_admin');

-- Показать структуру таблицы users
\d users
