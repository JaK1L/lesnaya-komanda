# Быстрый старт: Деплой на Fly.io

## 1. Установка Fly CLI

### Windows
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### macOS/Linux
```bash
curl -L https://fly.io/install.sh | sh
```

## 2. Авторизация

```bash
fly auth login
```

## 3. Первоначальная настройка

### Автоматически (рекомендуется)

**Windows:**
```powershell
.\deploy-fly.ps1 -Action setup
```

**macOS/Linux:**
```bash
chmod +x deploy-fly.sh
./deploy-fly.sh --setup
```

### Вручную

```bash
# Создать Postgres базу
fly postgres create --name lesnaya-komanda-db --region ams

# Создать приложение
fly launch --name lesnaya-komanda-backend --region ams --no-deploy

# Подключить базу
fly postgres attach lesnaya-komanda-db --app lesnaya-komanda-backend
```

## 4. Установка секретов

```bash
# Обязательные секреты
fly secrets set SECRET_KEY="ваш-супер-секретный-ключ-минимум-32-символа"
fly secrets set ADMIN_USERNAME="admin"
fly secrets set ADMIN_PASSWORD="ваш-надежный-пароль"

# Discord OAuth
fly secrets set DISCORD_CLIENT_ID="ваш-discord-client-id"
fly secrets set DISCORD_CLIENT_SECRET="ваш-discord-client-secret"

# URLs
fly secrets set FRONTEND_URL="https://ваш-фронтенд.vercel.app"
fly secrets set BACKEND_URL="https://lesnaya-komanda-backend.fly.dev"
fly secrets set ALLOWED_ORIGINS="https://ваш-фронтенд.vercel.app"
```

## 5. Деплой

### Автоматически

**Windows:**
```powershell
.\deploy-fly.ps1 -Action deploy
```

**macOS/Linux:**
```bash
./deploy-fly.sh --deploy
```

### Вручную

```bash
fly deploy
```

## 6. Проверка

После деплоя откройте:

- Health check: https://lesnaya-komanda-backend.fly.dev/health
- Database check: https://lesnaya-komanda-backend.fly.dev/health/db
- API документация: https://lesnaya-komanda-backend.fly.dev/api/docs

## 7. Мониторинг

```bash
# Логи в реальном времени
fly logs

# Статус приложения
fly status

# Или используйте скрипты
.\deploy-fly.ps1 -Action logs    # Windows
./deploy-fly.sh --logs           # macOS/Linux
```

## Автоматический деплой через GitHub Actions

1. Получите API токен:
```bash
fly auth token
```

2. Добавьте токен в GitHub Secrets:
   - Перейдите в Settings → Secrets and variables → Actions
   - Создайте секрет `FLY_API_TOKEN` со значением токена

3. Теперь при каждом push в main ветку бэкенд будет автоматически деплоиться!

## Полезные команды

```bash
# Просмотр секретов
fly secrets list

# Масштабирование
fly scale memory 1024
fly scale count 2

# Откат к предыдущей версии
fly releases rollback

# SSH доступ
fly ssh console

# Dashboard
fly dashboard
```

## Стоимость

Бесплатный tier включает:
- 3 shared-cpu VMs (256MB RAM)
- 3GB persistent storage
- 160GB outbound transfer

Для production (~$5-10/месяц):
- 1-2 машины с 512MB-1GB RAM

## Troubleshooting

### Приложение не запускается
```bash
fly logs
fly checks list
```

### Проблемы с базой
```bash
fly postgres connect -a lesnaya-komanda-db
```

### CORS ошибки
Проверьте ALLOWED_ORIGINS:
```bash
fly secrets list
fly secrets set ALLOWED_ORIGINS="https://ваш-фронтенд.vercel.app"
```

## Дополнительная информация

Подробная документация: [docs/FLY-IO-DEPLOYMENT.md](docs/FLY-IO-DEPLOYMENT.md)
