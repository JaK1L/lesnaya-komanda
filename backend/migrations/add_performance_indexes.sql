-- Миграция: Добавление индексов для производительности
-- Дата: 2026-03-07
-- Описание: Создание индексов на часто запрашиваемых полях для ускорения запросов

-- Индексы для таблицы users
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_users_forest_rank ON users(forest_rank);

-- Индексы для таблицы news
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_published_created ON news(published, created_at DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_news_author ON news(author_id);

-- Индексы для таблицы events
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_game ON events(game);
CREATE INDEX IF NOT EXISTS idx_events_expires ON events(expires_at) WHERE expires_at IS NOT NULL;

-- Индексы для таблицы achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_game ON achievements(game);
CREATE INDEX IF NOT EXISTS idx_achievements_earned ON achievements(earned_at DESC);

-- Индексы для таблицы game_profiles
CREATE INDEX IF NOT EXISTS idx_game_profiles_user ON game_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_game_profiles_game ON game_profiles(game);
CREATE INDEX IF NOT EXISTS idx_game_profiles_updated ON game_profiles(updated_at DESC);

-- Индексы для таблицы activity_log
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_channel ON activity_log(channel);

-- Индексы для таблицы discord_presence
CREATE INDEX IF NOT EXISTS idx_presence_activity_name ON discord_presence(activity_name) WHERE activity_name IS NOT NULL;

-- Индексы для таблицы home_feed
CREATE INDEX IF NOT EXISTS idx_home_feed_kind ON home_feed(kind);
CREATE INDEX IF NOT EXISTS idx_home_feed_created ON home_feed(created_at DESC);

-- Индексы для таблицы user_achievements (если существует)
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed_earned ON user_achievements(is_completed, earned_at DESC) WHERE is_completed = true;

-- Индексы для таблицы game_accounts (если существует)
CREATE INDEX IF NOT EXISTS idx_game_accounts_account_id ON game_accounts(account_id);

-- Индексы для таблицы streamers (если существует)
CREATE INDEX IF NOT EXISTS idx_streamers_active ON streamers(is_active, display_order) WHERE is_active = true;

-- Индексы для таблицы merch (если существует)
CREATE INDEX IF NOT EXISTS idx_merch_in_stock ON merch(in_stock, display_order) WHERE in_stock = true;
CREATE INDEX IF NOT EXISTS idx_merch_category ON merch(category);

-- Вывод информации
DO $$
BEGIN
    RAISE NOTICE 'Performance indexes created successfully!';
    RAISE NOTICE 'Run ANALYZE to update query planner statistics.';
END $$;
