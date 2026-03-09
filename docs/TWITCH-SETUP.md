# Настройка Twitch API

## 1. Получение Twitch API credentials

1. Перейди на https://dev.twitch.tv/console
2. Войди через свой Twitch аккаунт
3. Нажми "Register Your Application"
4. Заполни форму:
   - Name: `Lesnaya Komanda`
   - OAuth Redirect URLs: `https://lesnayakomanda.onrender.com/api/auth/twitch/callback`
   - Category: `Website Integration`
5. Нажми "Create"
6. Скопируй `Client ID` и `Client Secret`

## 2. Добавление credentials в Render

1. Открой https://dashboard.render.com
2. Выбери свой backend сервис
3. Перейди в Environment
4. Добавь переменные:
   - `TWITCH_CLIENT_ID` = твой Client ID
   - `TWITCH_CLIENT_SECRET` = твой Client Secret
5. Сохрани изменения (сервис перезапустится автоматически)

## 3. Добавление колонки twitch_username

Запусти миграцию на production:

```bash
python backend/add_twitch_username.py
```

Или выполни SQL напрямую в Neon:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS twitch_username VARCHAR(100);
```

## 4. Установка Twitch username для стримеров

Обнови пользователей в базе данных:

```sql
-- Пример: установить Twitch username для пользователя
UPDATE users 
SET twitch_username = 'twitch_username_here' 
WHERE discord_id = 123456789;

-- Или по email
UPDATE users 
SET twitch_username = 'twitch_username_here' 
WHERE email = 'user@example.com';
```

## 5. Проверка работы

После настройки:

1. Открой главную страницу сайта
2. В секции "Стримеры" должны появиться:
   - Индикатор LIVE для онлайн стримеров
   - Название игры
   - Количество зрителей
   - Кнопка "Смотреть" вместо "Профиль" для онлайн стримеров

## Как это работает

- Backend каждый раз при запросе `/api/streamers` обращается к Twitch API
- Получает информацию о стримах для всех пользователей с `twitch_username`
- Возвращает данные на фронт с актуальным статусом
- Фронт показывает красивый индикатор LIVE и информацию о стриме

## Troubleshooting

### Не показывается статус онлайн

1. Проверь что `TWITCH_CLIENT_ID` и `TWITCH_CLIENT_SECRET` установлены в Render
2. Проверь что у пользователя заполнен `twitch_username`
3. Проверь что Twitch username написан правильно (без пробелов, в нижнем регистре)
4. Проверь логи backend на Render

### Ошибка "Failed to get Twitch token"

- Проверь что Client ID и Client Secret правильные
- Проверь что приложение активно в Twitch Developer Console
