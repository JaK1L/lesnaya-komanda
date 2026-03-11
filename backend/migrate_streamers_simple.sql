-- Миграция таблицы streamers для Twitch API интеграции

-- Создаем новую таблицу с правильной структурой
CREATE TABLE IF NOT EXISTS streamers_new (
    id SERIAL PRIMARY KEY,
    twitch_username VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Если есть старая таблица, удаляем её (осторожно!)
-- DROP TABLE IF EXISTS streamers CASCADE;

-- Переименовываем новую таблицу
-- ALTER TABLE streamers_new RENAME TO streamers;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_streamers_active ON streamers(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_streamers_username ON streamers(LOWER(twitch_username));

-- Примеры добавления стримеров (замените на реальные данные)
-- INSERT INTO streamers (twitch_username, display_name, avatar_url, description, is_active, display_order)
-- VALUES 
--   ('jak1lqa', 'JaK1L', 'https://...', 'Описание', true, 0),
--   ('username2', 'DisplayName2', 'https://...', 'Описание', true, 1);
