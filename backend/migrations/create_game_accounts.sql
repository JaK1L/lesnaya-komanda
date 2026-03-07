-- Миграция: Привязка игровых аккаунтов
-- Дата: 2026-03-07

-- Таблица привязанных игровых аккаунтов
CREATE TABLE IF NOT EXISTS game_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game VARCHAR(20) NOT NULL,
    account_id VARCHAR(200) NOT NULL,
    account_tag VARCHAR(50),
    region VARCHAR(10),
    linked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, game)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_game_accounts_user ON game_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_accounts_game ON game_accounts(game);

-- Комментарии
COMMENT ON TABLE game_accounts IS 'Привязанные игровые аккаунты пользователей';
COMMENT ON COLUMN game_accounts.game IS 'Название игры/платформы: steam, dota2, valorant';
COMMENT ON COLUMN game_accounts.account_id IS 'ID аккаунта (Steam ID, Dota 2 Account ID, Riot ID)';
COMMENT ON COLUMN game_accounts.account_tag IS 'Тег аккаунта (для Valorant)';
COMMENT ON COLUMN game_accounts.region IS 'Регион (для Valorant)';
