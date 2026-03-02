-- Добавление полей для системы опыта и уровней
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- Индекс для сортировки по уровню
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC, current_xp DESC);

-- Комментарии
COMMENT ON COLUMN users.level IS 'Текущий уровень пользователя';
COMMENT ON COLUMN users.current_xp IS 'Опыт для текущего уровня (сбрасывается при повышении)';
COMMENT ON COLUMN users.total_xp IS 'Общий накопленный опыт за все время';
