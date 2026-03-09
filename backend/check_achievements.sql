-- Проверка достижений в базе данных

-- 1. Типы достижений
SELECT COUNT(*) as total_achievement_types FROM achievement_types;

-- 2. Выданные достижения
SELECT COUNT(*) as total_user_achievements FROM user_achievements;

-- 3. Последние выданные достижения
SELECT 
    u.discord_username,
    at.name as achievement_name,
    at.icon,
    ua.is_completed,
    ua.earned_at
FROM user_achievements ua
JOIN users u ON ua.user_id = u.id
JOIN achievement_types at ON ua.achievement_type_id = at.id
ORDER BY ua.id DESC
LIMIT 10;
