# Деплой бэкенда на Fly.io

Это руководство по развертыванию FastAPI бэкенда на Fly.io.

## Предварительные требования

1. Установите Fly CLI:
```bash
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

2. Войдите в аккаунт Fly.io:
```bash
fly auth login
```

## Настройка базы данных

Fly.io предлагает несколько вариантов для PostgreSQL:

### Вариант 1: Fly Postgres (рекомендуется для начала)

```bash
# Создайте Postgres кластер
fly postgres create --name lesnaya-komanda-db --region ams

# Подключите базу к приложению
fly postgres attach lesnaya-komanda-db --app lesnaya-komanda-backend
```

### Вариант 2: Внешняя база (Neon, Supabase, Railway)

Если у вас уже есть база на Neon или другом сервисе, просто установите секрет:

```bash
fly secrets set DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

## Настройка Redis (опционально)

```bash
# Создайте Redis инстанс через Upstash (бесплатный tier)
# Получите REDIS_URL и установите:
fly secrets set REDIS_URL="redis://default:password@host:port"
```

## Установка секретов

Установите все необходимые переменные окружения:

```bash
# Обязательные
fly secrets set SECRET_KEY="ваш-супер-секретный-ключ-минимум-32-символа"
fly secrets set ADMIN_USERNAME="admin"
fly secrets set ADMIN_PASSWORD="ваш-надежный-пароль"

# Discord OAuth
fly secrets set DISCORD_CLIENT_ID="ваш-discord-client-id"
fly secrets set DISCORD_CLIENT_SECRET="ваш-discord-client-secret"
fly secrets set FRONTEND_URL="https://ваш-фронтенд.vercel.app"
fly secrets set BACKEND_URL="https://lesnaya-komanda-backend.fly.dev"

# CORS (несколько origins через запятую)
fly secrets set ALLOWED_ORIGINS="https://ваш-фронтенд.vercel.app,https://другой-домен.com"

# Опционально: Discord Bot
fly secrets set DISCORD_BOT_TOKEN="ваш-бот-токен"
fly secrets set DISCORD_GUILD_ID="236652227060563969"

# Опционально: Twitch API
fly secrets set TWITCH_CLIENT_ID="ваш-twitch-client-id"
fly secrets set TWITCH_CLIENT_SECRET="ваш-twitch-client-secret"

# Опционально: Telegram
fly secrets set TELEGRAM_BOT_TOKEN="ваш-telegram-bot-token"
fly secrets set TELEGRAM_CHANNEL_USERNAME="lesnayakomanda"

# Опционально: Game APIs
fly secrets set STEAM_API_KEY="ваш-steam-api-key"
fly secrets set TRACKER_API_KEY="ваш-tracker-api-key"
fly secrets set HENRIK_API_KEY="ваш-henrik-api-key"
```

## Деплой приложения

```bash
# Создайте приложение (первый раз)
fly launch --no-deploy

# Или деплойте существующее
fly deploy

# Проверьте статус
fly status

# Откройте приложение в браузере
fly open
```

## Проверка работы

После деплоя проверьте:

1. Health check: `https://lesnaya-komanda-backend.fly.dev/health`
2. Database check: `https://lesnaya-komanda-backend.fly.dev/health/db`
3. API документация: `https://lesnaya-komanda-backend.fly.dev/api/docs`

## Мониторинг и логи

```bash
# Просмотр логов в реальном времени
fly logs

# Статус приложения
fly status

# Информация о машинах
fly machine list

# SSH доступ к контейнеру
fly ssh console

# Проверка метрик
fly dashboard
```

## Масштабирование

```bash
# Увеличить память
fly scale memory 1024

# Добавить больше машин
fly scale count 2

# Изменить регион
fly regions add fra # Frankfurt
fly regions add waw # Warsaw
```

## Обновление приложения

```bash
# Просто запустите деплой снова
fly deploy

# С нулевым downtime (если несколько машин)
fly deploy --strategy rolling
```

## Откат к предыдущей версии

```bash
# Посмотреть историю релизов
fly releases

# Откатиться к предыдущей версии
fly releases rollback
```

## Управление секретами

```bash
# Посмотреть список секретов (без значений)
fly secrets list

# Удалить секрет
fly secrets unset SECRET_NAME

# Импортировать из файла
fly secrets import < secrets.txt
```

## Подключение к базе данных

```bash
# Прямое подключение к Postgres
fly postgres connect -a lesnaya-komanda-db

# Получить connection string
fly postgres db show lesnaya-komanda-db
```

## Стоимость

Fly.io предоставляет бесплатный tier:
- 3 shared-cpu-1x VMs (256MB RAM)
- 3GB persistent storage
- 160GB outbound data transfer

Для production рекомендуется:
- 1-2 машины с 512MB-1GB RAM
- Стоимость: ~$5-10/месяц

## Troubleshooting

### Приложение не запускается

```bash
# Проверьте логи
fly logs

# Проверьте health checks
fly checks list

# Проверьте секреты
fly secrets list
```

### Проблемы с базой данных

```bash
# Проверьте подключение
fly ssh console
# Внутри контейнера:
env | grep DATABASE_URL
```

### CORS ошибки

Убедитесь, что ALLOWED_ORIGINS содержит URL вашего фронтенда:
```bash
fly secrets set ALLOWED_ORIGINS="https://ваш-фронтенд.vercel.app"
```

## Полезные ссылки

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Postgres](https://fly.io/docs/postgres/)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Fly.io Status](https://status.flyio.net/)

## Следующие шаги

1. Настройте custom domain: `fly certs add ваш-домен.com`
2. Настройте автоматический деплой через GitHub Actions
3. Настройте мониторинг (Sentry, Datadog, etc.)
4. Настройте бэкапы базы данных
