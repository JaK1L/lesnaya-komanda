-- Миграция: Добавление email и password для обычной регистрации
-- Дата: 2026-03-09

-- Добавляем новые поля в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(200),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Делаем discord_id необязательным (для обычной регистрации)
ALTER TABLE users 
ALTER COLUMN discord_id DROP NOT NULL;

-- Добавляем индекс для email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Добавляем constraint: либо discord_id, либо email должны быть заполнены
ALTER TABLE users 
ADD CONSTRAINT users_auth_method_check 
CHECK (
    (discord_id IS NOT NULL) OR 
    (email IS NOT NULL AND password_hash IS NOT NULL)
);

-- Комментарии
COMMENT ON COLUMN users.email IS 'Email для обычной регистрации';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля для обычной регистрации';
COMMENT ON COLUMN users.email_verified IS 'Подтвержден ли email';
COMMENT ON COLUMN users.is_admin IS 'Является ли пользователь администратором';
