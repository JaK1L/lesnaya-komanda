-- Add is_admin column to users table
-- Migration: add_is_admin_column
-- Date: 2024

-- Add is_admin column for Discord role-based admin access
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster admin checks (partial index for admins only)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Set is_admin to FALSE for all existing users
UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL;

-- Comments for documentation
COMMENT ON COLUMN users.is_admin IS 'Flag indicating if user has Discord role "🐓ПИТУХ🐓" and should have admin access';
