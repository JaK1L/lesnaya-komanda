# Обновление фронтенда для работы с Fly.io

После деплоя бэкенда на Fly.io нужно обновить фронтенд, чтобы он использовал новый API URL.

## 1. Обновите переменные окружения на Vercel

### Через Vercel Dashboard

1. Перейдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект (lesnaya-komanda)
3. Settings → Environment Variables
4. Обновите или добавьте:

```
NEXT_PUBLIC_API_URL=https://lesnaya-komanda-backend.fly.dev
```

5. Сохраните изменения

### Через Vercel CLI

```bash
cd frontend
vercel env add NEXT_PUBLIC_API_URL production
# Введите: https://lesnaya-komanda-backend.fly.dev
```

## 2. Переразверните фронтенд

### Через Vercel Dashboard

1. Deployments → Latest Deployment
2. Нажмите "..." → Redeploy
3. Выберите "Use existing Build Cache" (быстрее) или без кэша

### Через Vercel CLI

```bash
cd frontend
vercel --prod
```

### Через Git

```bash
git commit --allow-empty -m "Redeploy for Fly.io backend"
git push origin main
```

## 3. Обновите локальные .env файлы

### frontend/.env.local

```env
NEXT_PUBLIC_API_URL=https://lesnaya-komanda-backend.fly.dev
```

### frontend/.env.development

```env
# Для локальной разработки оставьте localhost
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### frontend/.env.production

```env
NEXT_PUBLIC_API_URL=https://lesnaya-komanda-backend.fly.dev
```

## 4. Проверьте CORS на бэкенде

Убедитесь, что URL вашего фронтенда добавлен в ALLOWED_ORIGINS на Fly.io:

```bash
fly secrets set ALLOWED_ORIGINS="https://ваш-фронтенд.vercel.app,https://lesnaya-komanda.vercel.app"
```

Если у вас несколько доменов (production + preview):

```bash
fly secrets set ALLOWED_ORIGINS="https://lesnaya-komanda.vercel.app,https://lesnaya-komanda-*.vercel.app,https://www.lesnaya-komanda.com"
```

## 5. Проверьте работу

### Откройте фронтенд

```bash
open https://ваш-фронтенд.vercel.app
```

### Проверьте в консоли браузера

1. Откройте DevTools (F12)
2. Перейдите на вкладку Network
3. Обновите страницу
4. Проверьте, что запросы идут на `https://lesnaya-komanda-backend.fly.dev`
5. Убедитесь, что нет CORS ошибок

### Проверьте основные функции

- [ ] Главная страница загружается
- [ ] Новости отображаются
- [ ] События отображаются
- [ ] Можно войти через Discord
- [ ] Профиль пользователя работает
- [ ] Админ-панель доступна (для админов)

## 6. Обновите Discord OAuth Redirect URL

Если вы используете Discord OAuth, обновите redirect URL:

1. Перейдите в [Discord Developer Portal](https://discord.com/developers/applications)
2. Выберите ваше приложение
3. OAuth2 → Redirects
4. Добавьте: `https://lesnaya-komanda-backend.fly.dev/api/auth/discord/callback`
5. Сохраните изменения

## Troubleshooting

### CORS ошибки

Если видите ошибки типа "Access-Control-Allow-Origin":

1. Проверьте ALLOWED_ORIGINS на бэкенде:
```bash
fly secrets list
```

2. Обновите ALLOWED_ORIGINS:
```bash
fly secrets set ALLOWED_ORIGINS="https://ваш-фронтенд.vercel.app"
```

3. Перезапустите бэкенд:
```bash
fly apps restart lesnaya-komanda-backend
```

### API запросы идут на localhost

Проверьте:
1. NEXT_PUBLIC_API_URL установлен в Vercel
2. Фронтенд переразвернут после изменения переменных
3. Кэш браузера очищен (Ctrl+Shift+R)

### Discord OAuth не работает

Проверьте:
1. Redirect URL в Discord Developer Portal
2. DISCORD_CLIENT_ID и DISCORD_CLIENT_SECRET на Fly.io
3. FRONTEND_URL и BACKEND_URL на Fly.io

```bash
fly secrets list
```

### 404 ошибки на API

Проверьте:
1. Бэкенд запущен: `fly status`
2. Health check работает: `curl https://lesnaya-komanda-backend.fly.dev/health`
3. API docs доступны: `https://lesnaya-komanda-backend.fly.dev/api/docs`

## Полезные команды

```bash
# Проверить переменные окружения на Vercel
vercel env ls

# Проверить секреты на Fly.io
fly secrets list

# Проверить логи бэкенда
fly logs

# Проверить статус бэкенда
fly status

# Проверить health endpoints
curl https://lesnaya-komanda-backend.fly.dev/health
curl https://lesnaya-komanda-backend.fly.dev/health/db
```

## Дополнительная настройка (опционально)

### Custom Domain для бэкенда

Если хотите использовать свой домен (например, `api.lesnaya-komanda.com`):

1. Добавьте домен на Fly.io:
```bash
fly certs add api.lesnaya-komanda.com
```

2. Настройте DNS (CNAME):
```
api.lesnaya-komanda.com → lesnaya-komanda-backend.fly.dev
```

3. Обновите переменные на Vercel:
```
NEXT_PUBLIC_API_URL=https://api.lesnaya-komanda.com
```

4. Обновите BACKEND_URL на Fly.io:
```bash
fly secrets set BACKEND_URL="https://api.lesnaya-komanda.com"
```

### Мониторинг

Настройте мониторинг для отслеживания доступности:

- [UptimeRobot](https://uptimerobot.com/) - бесплатный мониторинг
- [Pingdom](https://www.pingdom.com/) - более продвинутый
- [Better Uptime](https://betteruptime.com/) - современный вариант

Добавьте URL для мониторинга:
```
https://lesnaya-komanda-backend.fly.dev/health
```
