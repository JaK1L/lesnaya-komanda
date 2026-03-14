-- Миграция: Добавление banner_url для профилей пользователей
-- Дата: 2026-03-14

ALTER TABLE users
ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500);

COMMENT ON COLUMN users.banner_url IS 'URL баннера профиля пользователя';
