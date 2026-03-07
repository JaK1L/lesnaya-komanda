-- Добавляем поле expires_at для автоматического скрытия событий
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Индекс для быстрой фильтрации активных событий
CREATE INDEX IF NOT EXISTS idx_events_expires_at ON events(expires_at);

-- Комментарий
COMMENT ON COLUMN events.expires_at IS 'Дата и время когда событие автоматически скрывается с сайта';
