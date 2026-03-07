-- Создаем таблицу стримеров
CREATE TABLE IF NOT EXISTS streamers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    game VARCHAR(200),
    avatar_url TEXT,
    platform VARCHAR(20) DEFAULT 'twitch',
    stream_url TEXT NOT NULL,
    schedule VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_streamers_active ON streamers(is_active);
CREATE INDEX IF NOT EXISTS idx_streamers_order ON streamers(display_order);

-- Комментарии
COMMENT ON TABLE streamers IS 'Стримеры команды';
COMMENT ON COLUMN streamers.platform IS 'twitch, youtube, или другая платформа';
COMMENT ON COLUMN streamers.is_active IS 'Показывать ли стримера на сайте';
COMMENT ON COLUMN streamers.display_order IS 'Порядок отображения (меньше = выше)';
