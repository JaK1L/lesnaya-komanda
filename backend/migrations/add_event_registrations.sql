-- Миграция: Регистрация на события
-- Дата: 2026-03-07

-- Таблица регистраций на события
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    discord_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'registered',
    registered_at TIMESTAMP DEFAULT NOW(),
    attended BOOLEAN DEFAULT false,
    UNIQUE(event_id, user_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_discord ON event_registrations(discord_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Добавляем поля к events если их нет
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Комментарии
COMMENT ON TABLE event_registrations IS 'Регистрации пользователей на события';
COMMENT ON COLUMN event_registrations.status IS 'Статус регистрации: registered, cancelled, waitlist';
COMMENT ON COLUMN event_registrations.attended IS 'Отметка о посещении события';
COMMENT ON COLUMN events.max_participants IS 'Максимальное количество участников (NULL = без ограничений)';
COMMENT ON COLUMN events.registration_enabled IS 'Включена ли регистрация на событие';
COMMENT ON COLUMN events.reminder_sent IS 'Отправлено ли напоминание о событии';
