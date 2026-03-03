-- Добавление полей для системы опыта, уровней и поинтов
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Индексы для сортировки
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC, current_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

-- Таблица истории начисления опыта и поинтов
CREATE TABLE IF NOT EXISTS xp_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    discord_id BIGINT,
    type VARCHAR(20) NOT NULL, -- 'xp' или 'points'
    amount INTEGER NOT NULL,
    reason VARCHAR(200) NOT NULL,
    source VARCHAR(100), -- 'voice_activity', 'message', 'event_win', 'admin', etc.
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES admin_users(id) -- NULL если автоматически
);

-- Индексы для истории
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_discord ON xp_transactions(discord_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

-- Таблица покупок за поинты
CREATE TABLE IF NOT EXISTS points_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    discord_id BIGINT,
    item_name VARCHAR(200) NOT NULL,
    cost INTEGER NOT NULL,
    expires_at TIMESTAMP, -- для временных покупок
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для покупок
CREATE INDEX IF NOT EXISTS idx_points_purchases_user ON points_purchases(user_id);

-- Комментарии
COMMENT ON COLUMN users.level IS 'Текущий уровень пользователя';
COMMENT ON COLUMN users.current_xp IS 'Опыт для текущего уровня (сбрасывается при повышении)';
COMMENT ON COLUMN users.total_xp IS 'Общий накопленный опыт за все время';
COMMENT ON COLUMN users.points IS 'Поинты для покупки плюшек';
COMMENT ON TABLE xp_transactions IS 'История начисления опыта и поинтов';
COMMENT ON TABLE points_purchases IS 'История покупок за поинты';
