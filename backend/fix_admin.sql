-- Исправление админа в production
-- Выполнить в Neon SQL Editor: https://console.neon.tech/

-- 1. Проверить есть ли админ
SELECT id, username, role, created_at FROM admin_users;

-- 2. Обновить админа (хеш для пароля: LesnoyBOSS909!)
UPDATE admin_users 
SET 
    username = 'LesnoyBOSS',
    password_hash = '$2b$12$KLgqVoHH3ZkRanbKF5M0f.KrRP32hM4R4cCwN26Km4Uc4K0jfr5v.',
    role = 'admin'
WHERE id = 1;

-- 3. Проверить результат:
SELECT id, username, role FROM admin_users WHERE username = 'LesnoyBOSS';
