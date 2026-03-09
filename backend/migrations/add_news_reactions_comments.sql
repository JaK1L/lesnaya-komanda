-- Миграция: Добавление лайков/дизлайков и комментариев к новостям
-- Дата: 2026-03-09

-- Таблица реакций на новости
CREATE TABLE IF NOT EXISTS news_reactions (
    id SERIAL PRIMARY KEY,
    news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction VARCHAR(10) NOT NULL CHECK (reaction IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(news_id, user_id)
);

-- Таблица комментариев к новостям
CREATE TABLE IF NOT EXISTS news_comments (
    id SERIAL PRIMARY KEY,
    news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_news_reactions_news_id ON news_reactions(news_id);
CREATE INDEX IF NOT EXISTS idx_news_reactions_user_id ON news_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_news_id ON news_comments(news_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_created_at ON news_comments(created_at DESC);

-- Комментарии
COMMENT ON TABLE news_reactions IS 'Лайки и дизлайки к новостям';
COMMENT ON TABLE news_comments IS 'Комментарии к новостям';
