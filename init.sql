-- Создание базы данных
CREATE DATABASE lesnaya;

\c lesnaya;

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    discord_id BIGINT UNIQUE,
    discord_username VARCHAR(100),
    forest_rank VARCHAR(50) DEFAULT '🌱 Росток',
    rating FLOAT DEFAULT 0,
    joined_at TIMESTAMP,
    last_seen TIMESTAMP DEFAULT NOW(),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Игровые профили
CREATE TABLE game_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game VARCHAR(50), -- 'cs2', 'dota2', 'valorant', 'other'
    game_username VARCHAR(100),
    rank VARCHAR(50),
    stats JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Достижения
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_name VARCHAR(100),
    achievement_icon VARCHAR(50),
    game VARCHAR(50),
    earned_at TIMESTAMP DEFAULT NOW()
);

-- Лог активности (сообщения)
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    discord_id BIGINT,
    username VARCHAR(100),
    type VARCHAR(20), -- 'message', 'command'
    channel VARCHAR(100),
    content TEXT,
    created_at TIMESTAMP
);

-- Сессии голосовых каналов
CREATE TABLE voice_sessions (
    id SERIAL PRIMARY KEY,
    discord_id BIGINT,
    channel VARCHAR(100),
    joined_at TIMESTAMP,
    left_at TIMESTAMP
);

-- Таблица администраторов
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'editor',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица новостей
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author_id INTEGER REFERENCES admin_users(id),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Таблица событий (одна версия)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    game VARCHAR(50),
    event_date TIMESTAMP,
    created_by INTEGER REFERENCES admin_users(id),
    participants INTEGER[] DEFAULT '{}'
);

-- Админ по умолчанию создаётся при первом запуске бэкенда (main.py init_db), если таблица пуста.

-- Индексы для производительности
CREATE INDEX idx_activity_discord_id ON activity_log(discord_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at);
CREATE INDEX idx_users_rating ON users(rating DESC);
CREATE INDEX idx_voice_sessions_discord_id ON voice_sessions(discord_id);