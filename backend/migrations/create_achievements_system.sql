-- Миграция: Система достижений
-- Дата: 2026-03-07

-- Таблица типов достижений (шаблоны)
CREATE TABLE IF NOT EXISTS achievement_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '🏆',
    category VARCHAR(50) DEFAULT 'general',
    requirement JSONB,
    points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для achievement_types
CREATE INDEX IF NOT EXISTS idx_achievement_types_category ON achievement_types(category);
CREATE INDEX IF NOT EXISTS idx_achievement_types_active ON achievement_types(is_active);

-- Таблица достижений пользователей
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_type_id INTEGER REFERENCES achievement_types(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    max_progress INTEGER DEFAULT 100,
    earned_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_type_id)
);

-- Индексы для user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);

-- Вставка базовых достижений
INSERT INTO achievement_types (name, description, icon, category, requirement, points) VALUES
-- Активность
('Первые шаги', 'Присоединился к сообществу', '🌱', 'activity', '{"type": "join"}', 5),
('Болтун', 'Отправил 100 сообщений', '💬', 'activity', '{"type": "messages", "count": 100}', 10),
('Говорун', 'Отправил 500 сообщений', '🗣️', 'activity', '{"type": "messages", "count": 500}', 25),
('Легенда чата', 'Отправил 1000 сообщений', '👑', 'activity', '{"type": "messages", "count": 1000}', 50),

-- Голосовые каналы
('Слушатель', 'Провел 10 часов в войсе', '🎧', 'voice', '{"type": "voice_hours", "count": 10}', 10),
('Собеседник', 'Провел 50 часов в войсе', '🎤', 'voice', '{"type": "voice_hours", "count": 50}', 25),
('Радиоведущий', 'Провел 100 часов в войсе', '📻', 'voice', '{"type": "voice_hours", "count": 100}', 50),

-- События
('Участник', 'Посетил первое событие', '🎯', 'events', '{"type": "events_attended", "count": 1}', 10),
('Активист', 'Посетил 5 событий', '⭐', 'events', '{"type": "events_attended", "count": 5}', 25),
('Фанат', 'Посетил 10 событий', '🌟', 'events', '{"type": "events_attended", "count": 10}', 50),

-- Игры
('Новичок CS2', 'Первая победа в CS2', '🔫', 'games', '{"type": "game_wins", "game": "cs2", "count": 1}', 10),
('Боец CS2', '10 побед в CS2', '⚔️', 'games', '{"type": "game_wins", "game": "cs2", "count": 10}', 25),
('Мастер CS2', '50 побед в CS2', '👑', 'games', '{"type": "game_wins", "game": "cs2", "count": 50}', 50),

('Новичок Dota 2', 'Первая победа в Dota 2', '🛡️', 'games', '{"type": "game_wins", "game": "dota2", "count": 1}', 10),
('Боец Dota 2', '10 побед в Dota 2', '⚡', 'games', '{"type": "game_wins", "game": "dota2", "count": 10}', 25),
('Мастер Dota 2', '50 побед в Dota 2', '🏆', 'games', '{"type": "game_wins", "game": "dota2", "count": 50}', 50),

-- Специальные
('Старожил', 'В сообществе более года', '🎂', 'special', '{"type": "member_days", "count": 365}', 100),
('Легенда', 'Получил все достижения', '💎', 'special', '{"type": "all_achievements"}', 500)
ON CONFLICT DO NOTHING;

-- Комментарий к таблицам
COMMENT ON TABLE achievement_types IS 'Типы достижений (шаблоны)';
COMMENT ON TABLE user_achievements IS 'Достижения пользователей';
COMMENT ON COLUMN achievement_types.requirement IS 'JSON с условиями получения достижения';
COMMENT ON COLUMN user_achievements.progress IS 'Текущий прогресс (например, 50 из 100 сообщений)';
COMMENT ON COLUMN user_achievements.max_progress IS 'Максимальный прогресс для получения достижения';
