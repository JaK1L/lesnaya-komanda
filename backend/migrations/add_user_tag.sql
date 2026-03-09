-- Миграция: Добавление уникального user_tag
-- Дата: 2026-03-09

-- Добавляем поле user_tag
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_tag VARCHAR(100) UNIQUE;

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_user_tag ON users(user_tag);

-- Комментарий
COMMENT ON COLUMN users.user_tag IS 'Уникальный тег пользователя (например: username#1234)';

-- Функция для генерации уникального тега
CREATE OR REPLACE FUNCTION generate_user_tag(username_param VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    tag VARCHAR;
    discriminator INT;
    max_attempts INT := 9999;
BEGIN
    -- Пробуем найти свободный дискриминатор от 0001 до 9999
    FOR discriminator IN 1..max_attempts LOOP
        tag := username_param || '#' || LPAD(discriminator::TEXT, 4, '0');
        
        -- Проверяем, свободен ли этот тег
        IF NOT EXISTS (SELECT 1 FROM users WHERE user_tag = tag) THEN
            RETURN tag;
        END IF;
    END LOOP;
    
    -- Если все заняты, добавляем случайный суффикс
    tag := username_param || '#' || LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0');
    RETURN tag;
END;
$$ LANGUAGE plpgsql;

-- Обновляем существующих пользователей (если есть)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, discord_username FROM users WHERE user_tag IS NULL LOOP
        UPDATE users 
        SET user_tag = generate_user_tag(user_record.discord_username)
        WHERE id = user_record.id;
    END LOOP;
END $$;
