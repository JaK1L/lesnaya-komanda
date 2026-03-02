-- Add custom_status column to discord_presence table
-- Migration: add_custom_status
-- Date: 2025

-- Add custom_status column for Discord custom status
ALTER TABLE discord_presence 
ADD COLUMN IF NOT EXISTS custom_status TEXT;

-- Comments for documentation
COMMENT ON COLUMN discord_presence.custom_status IS 'User custom status text from Discord';
