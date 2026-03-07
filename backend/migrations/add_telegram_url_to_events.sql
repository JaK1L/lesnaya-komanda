-- Добавление поля telegram_url в таблицу events
ALTER TABLE events ADD COLUMN IF NOT EXISTS telegram_url TEXT;

-- Комментарий
COMMENT ON COLUMN events.telegram_url IS 'URL поста в Telegram для события';
