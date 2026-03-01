-- Add profile fields to users table
-- Migration: add_profile_fields
-- Date: 2024

-- Add new columns for user profile
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS site_nickname VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Create index for visibility queries to optimize public user list filtering
CREATE INDEX IF NOT EXISTS idx_users_is_hidden ON users(is_hidden);

-- Comments for documentation
COMMENT ON COLUMN users.site_nickname IS 'User-defined nickname for the site, independent from Discord username';
COMMENT ON COLUMN users.bio IS 'User biography/description, max 500 characters';
COMMENT ON COLUMN users.is_hidden IS 'Flag to hide user from public lists while keeping profile accessible via direct URL';
