-- Add game_preferences field to users table
-- Migration: add_game_preferences
-- Date: 2026-03-03

-- Add JSONB column for storing game preferences
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS game_preferences JSONB DEFAULT NULL;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_game_preferences 
  ON users USING GIN (game_preferences);

-- Comments for documentation
COMMENT ON COLUMN users.game_preferences IS 
  'Array of game preference objects with structure: 
   [{"game": "CS2", "custom_name": null}, {"game": "Другое", "custom_name": "Minecraft"}]
   NULL = user has not completed survey
   [] = user skipped survey';
