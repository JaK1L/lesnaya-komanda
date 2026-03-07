# 🚀 Руководство по деплою

Полное руководство по развертыванию проекта "Лесная Команда" в production.

## 📋 Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [База данных (Neon)](#база-данных-neon)
3. [Backend (Render)](#backend-render)
4. [Frontend (Vercel)](#frontend-vercel)
5. [Discord Bot (Railway)](#discord-bot-railway)
6. [Настройка домена](#настройка-домена)
7. [Переменные окружения](#переменные-окружения)
8. [Проверка деплоя](#проверка-деплоя)

---

## Обзор архитектуры

```
┌─────────────────┐
│   Пользователь  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Frontend       │─────▶│  Backend     │
│  (Vercel)       │      │  (Render)    │
│  Next.js 14     │      │  FastAPI     │
└─────────────────┘      └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  Database    │
                         │  (Neon)      │
                         │  PostgreSQL  │
                         └──────────────┘
                                ▲
                                │
                         ┌──────┴───────┐
                         │  Discord Bot │
                         │  (Railway)   │
                         └──────────────┘
```

---

## База данных (Neon)

### 1. Создание проекта

1. Перейти на [neon.tech](https://neon.tech)
2. Создать аккаунт (GitHub OAuth)
3. Нажать "Create Project"
4. Настройки:
   - **Name**: lesnaya-komanda
   - **Region**: Europe (Frankfurt) - ближайший к России
   - **PostgreSQL version**: 15
   - **Compute size**: 0.25 vCPU (бесплатный план)

### 2. Получение строки подключения

```bash
# В Neon Dashboard → Connection Details
DATABASE_URL=postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Инициализация схемы

База данных автоматически инициализируется при первом запуске backend.

Или вручную:
```bash
# Подключиться к базе
psql "postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Проверить таблицы
\dt

# Должны быть: users, news, events, home_feed, game_preferences
```

### 4. Заполнение тестовыми данными

```bash
cd backend
python seed_database.py
```

### 5. Настройки Neon

- **Auto-suspend**: 5 минут (по умолчанию)
- **Branching**: Включить для staging окружения
- **Backups**: Автоматические (7 дней)

---

## Backend (Render)

### 1. Создание Web Service

1. Перейти на [render.com](https://render.com)
2. Нажать "New +" → "Web Service"
3. Подключить GitHub репозиторий
4. Настройки:
   - **Name**: lesnaya-komanda-api
   - **Region**: Frankfurt (EU Central)
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

### 2. Переменные окружения

В Render Dashboard → Environment:

```bash
# Database
DATABASE_URL=postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Security
SECRET_KEY=your-super-secret-key-min-32-characters-long
ALLOWED_ORIGINS=https://lesnaya-komanda.vercel.app,https://lesnaya-komanda.com

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
FRONTEND_URL=https://lesnaya-komanda.vercel.app

# Optional
DEBUG=False
```

### 3. Генерация SECRET_KEY

```python
# В Python консоли
import secrets
print(secrets.token_urlsafe(32))
# Скопировать результат в SECRET_KEY
```

### 4. Discord OAuth настройка

1. Перейти в [Discord Developer Portal](https://discord.com/developers/applications)
2. Выбрать приложение
3. OAuth2 → Redirects → Добавить:
   ```
   https://your-backend.onrender.com/api/auth/discord/callback
   ```
4. Скопировать Client ID и Client Secret

### 5. Деплой

```bash
# Render автоматически деплоит при push в main
git push origin main

# Или вручную в Render Dashboard → Manual Deploy
```

### 6. Проверка

```bash
# Проверить health endpoint
curl https://your-backend.onrender.com/api/

# Должен вернуть: {"status": "ok"}

# Проверить Swagger docs
# Открыть: https://your-backend.onrender.com/api/docs
```

### 7. Настройки Render

- **Auto-Deploy**: Включено (деплой при push)
- **Health Check Path**: `/api/`
- **Disk**: Persistent Disk не нужен (stateless)

---

## Frontend (Vercel)

### 1. Создание проекта

1. Перейти на [vercel.com](https://vercel.com)
2. Нажать "Add New..." → "Project"
3. Import Git Repository (GitHub)
4. Настройки:
   - **Framework Preset**: Next.js
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
   - **Install Command**: `npm install`

### 2. Переменные окружения

В Vercel Dashboard → Settings → Environment Variables:

```bash
# API URL (ваш Render backend)
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com

# Analytics (получить на соответствующих сайтах)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_YM_ID=XXXXXXXX

# Sentry (опционально)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### 3. Получение Analytics ID

**Google Analytics:**
1. Перейти на [analytics.google.com](https://analytics.google.com)
2. Создать аккаунт и ресурс
3. Скопировать Measurement ID (G-XXXXXXXXXX)

**Yandex Metrika:**
1. Перейти на [metrika.yandex.ru](https://metrika.yandex.ru)
2. Добавить счетчик
3. Скопировать номер счетчика (XXXXXXXX)

### 4. Деплой

```bash
# Vercel автоматически деплоит при push в main
git push origin main

# Или вручную
cd frontend
vercel --prod
```

### 5. Проверка

```bash
# Открыть сайт
https://your-project.vercel.app

# Проверить что:
# - Главная страница загружается
# - Навигация работает
# - API запросы проходят (проверить в DevTools → Network)
```

### 6. Настройки Vercel

- **Auto-Deploy**: Включено
- **Production Branch**: main
- **Preview Deployments**: Включено (для PR)
- **Edge Functions**: Автоматически

---

## Discord Bot (Railway)

### 1. Создание проекта

1. Перейти на [railway.app](https://railway.app)
2. Нажать "New Project"
3. Выбрать "Deploy from GitHub repo"
4. Выбрать репозиторий
5. Настройки:
   - **Name**: lesnaya-komanda-bot
   - **Root Directory**: bot
   - **Start Command**: `python main.py`

### 2. Переменные окружения

В Railway Dashboard → Variables:

```bash
# Discord
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=236652227060563969

# Database (та же что и у backend)
DATABASE_URL=postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# API URLs
API_URL=https://your-backend.onrender.com
WEBSITE_URL=https://your-frontend.vercel.app
```

### 3. Получение Bot Token

1. Перейти в [Discord Developer Portal](https://discord.com/developers/applications)
2. Создать новое приложение или выбрать существующее
3. Bot → Reset Token → Скопировать
4. Bot → Privileged Gateway Intents:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### 4. Добавление бота на сервер

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Замените YOUR_CLIENT_ID на ваш Client ID.

### 5. Деплой

```bash
# Railway автоматически деплоит при push
git push origin main

# Проверить логи в Railway Dashboard → Deployments → Logs
```

### 6. Проверка

В Discord сервере:
```
!помощь
# Должен ответить списком команд

!сайт
# Должен вернуть ссылку на сайт
```

### 7. Настройки Railway

- **Auto-Deploy**: Включено
- **Restart Policy**: Always
- **Health Check**: Не требуется (Discord bot)

---

## Настройка домена

### 1. Купить домен

Рекомендуемые регистраторы:
- [Namecheap](https://www.namecheap.com)
- [GoDaddy](https://www.godaddy.com)
- [Reg.ru](https://www.reg.ru) (для .ru домена)

### 2. Настроить DNS для Frontend (Vercel)

В Vercel Dashboard → Settings → Domains:
1. Добавить домен: `lesnaya-komanda.com`
2. Добавить `www.lesnaya-komanda.com`

В DNS провайдере добавить записи:
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### 3. Настроить DNS для Backend (Render)

В Render Dashboard → Settings → Custom Domain:
1. Добавить: `api.lesnaya-komanda.com`

В DNS провайдере:
```
Type    Name    Value
CNAME   api     your-backend.onrender.com
```

### 4. Обновить переменные окружения

После настройки домена обновить:

**Backend (Render):**
```bash
ALLOWED_ORIGINS=https://lesnaya-komanda.com,https://www.lesnaya-komanda.com
FRONTEND_URL=https://lesnaya-komanda.com
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL=https://api.lesnaya-komanda.com
```

**Bot (Railway):**
```bash
API_URL=https://api.lesnaya-komanda.com
WEBSITE_URL=https://lesnaya-komanda.com
```

**Discord OAuth:**
```
https://api.lesnaya-komanda.com/api/auth/discord/callback
```

### 5. SSL сертификаты

SSL настраивается автоматически:
- Vercel: Let's Encrypt (автоматически)
- Render: Let's Encrypt (автоматически)

Проверка: https://www.ssllabs.com/ssltest/

---

## Переменные окружения

### Полный список

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.lesnaya-komanda.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_YM_ID=XXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Backend (.env)
```bash
DATABASE_URL=postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=your-super-secret-key-min-32-characters-long
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
ALLOWED_ORIGINS=https://lesnaya-komanda.com,https://www.lesnaya-komanda.com
FRONTEND_URL=https://lesnaya-komanda.com
DEBUG=False
```

#### Bot (.env)
```bash
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=236652227060563969
DATABASE_URL=postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
API_URL=https://api.lesnaya-komanda.com
WEBSITE_URL=https://lesnaya-komanda.com
```

---

## Проверка деплоя

### Чеклист

- [ ] **База данных**
  - [ ] Подключение работает
  - [ ] Таблицы созданы
  - [ ] Тестовые данные загружены

- [ ] **Backend**
  - [ ] Health check: `curl https://api.lesnaya-komanda.com/api/`
  - [ ] Swagger docs: https://api.lesnaya-komanda.com/api/docs
  - [ ] CORS настроен правильно
  - [ ] Discord OAuth работает

- [ ] **Frontend**
  - [ ] Сайт загружается: https://lesnaya-komanda.com
  - [ ] Все страницы работают (/, /profile, /social, /streams)
  - [ ] API запросы проходят (DevTools → Network)
  - [ ] Analytics работает (проверить в GA/YM)
  - [ ] Мобильная версия работает

- [ ] **Discord Bot**
  - [ ] Бот онлайн в Discord
  - [ ] Команды работают: `!помощь`, `!сайт`
  - [ ] Подключение к БД работает
  - [ ] API запросы проходят

- [ ] **Домен и SSL**
  - [ ] Домен резолвится
  - [ ] SSL сертификат валиден
  - [ ] Редирект с www работает
  - [ ] HTTPS принудительный

### Скрипт проверки

```bash
#!/bin/bash
# check-deploy.sh

echo "🔍 Проверка деплоя..."

# Backend
echo "📡 Backend..."
curl -s https://api.lesnaya-komanda.com/api/ | grep -q "ok" && echo "✅ Backend OK" || echo "❌ Backend FAIL"

# Frontend
echo "🌐 Frontend..."
curl -s -o /dev/null -w "%{http_code}" https://lesnaya-komanda.com | grep -q "200" && echo "✅ Frontend OK" || echo "❌ Frontend FAIL"

# SSL
echo "🔒 SSL..."
curl -s https://lesnaya-komanda.com > /dev/null && echo "✅ SSL OK" || echo "❌ SSL FAIL"

echo "✨ Проверка завершена!"
```

---

## Мониторинг

### Uptime мониторинг

Настроить на [UptimeRobot](https://uptimerobot.com):

1. Создать HTTP(s) монитор:
   - URL: `https://lesnaya-komanda.com`
   - Interval: 5 минут
   - Alert: Email + Telegram

2. Создать HTTP(s) монитор для API:
   - URL: `https://api.lesnaya-komanda.com/api/`
   - Interval: 5 минут

### Логи

- **Frontend**: Vercel Dashboard → Logs
- **Backend**: Render Dashboard → Logs
- **Bot**: Railway Dashboard → Logs
- **Database**: Neon Dashboard → Monitoring

### Алерты

Настроить уведомления:
- Email при downtime
- Telegram бот для критичных ошибок
- Discord webhook для деплоев

---

## Troubleshooting

### Backend не запускается

```bash
# Проверить логи в Render
# Частые проблемы:
# 1. DATABASE_URL неправильный
# 2. SECRET_KEY слишком короткий
# 3. Зависимости не установились

# Решение:
# - Проверить переменные окружения
# - Пересобрать: Manual Deploy → Clear build cache
```

### Frontend не подключается к API

```bash
# Проверить:
# 1. NEXT_PUBLIC_API_URL правильный
# 2. CORS настроен в backend
# 3. Backend доступен

# В DevTools → Console должны быть запросы к API
# Если CORS ошибка - проверить ALLOWED_ORIGINS в backend
```

### Bot не отвечает

```bash
# Проверить:
# 1. Bot Token правильный
# 2. Bot добавлен на сервер
# 3. Intents включены в Discord Developer Portal

# Проверить логи в Railway
# Должно быть: "Bot is ready!"
```

### База данных недоступна

```bash
# Neon может засыпать после 5 минут неактивности
# Первый запрос может быть медленным (cold start)

# Проверить:
psql "your_database_url"

# Если не подключается - проверить:
# 1. URL правильный
# 2. ?sslmode=require в конце
# 3. Проект не удален в Neon Dashboard
```

---

## Обновление production

### Процесс обновления

```bash
# 1. Разработка в ветке feature
git checkout -b feature/new-feature
# ... делаем изменения ...
git commit -m "Add new feature"
git push origin feature/new-feature

# 2. Создать Pull Request на GitHub
# 3. Vercel создаст preview deployment
# 4. Проверить preview: https://lesnaya-komanda-git-feature-xxx.vercel.app

# 5. Merge в main
git checkout main
git merge feature/new-feature
git push origin main

# 6. Автоматический деплой в production
# - Vercel деплоит frontend
# - Render деплоит backend
# - Railway деплоит bot
```

### Rollback

Если что-то пошло не так:

**Vercel:**
```bash
# В Dashboard → Deployments → Предыдущий деплой → Promote to Production
```

**Render:**
```bash
# В Dashboard → Manual Deploy → Выбрать предыдущий commit
```

**Railway:**
```bash
# В Dashboard → Deployments → Предыдущий деплой → Redeploy
```

---

## Стоимость

### Бесплатные планы

- **Neon**: 0.25 vCPU, 1GB storage, 100 часов compute/месяц
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Render**: 750 часов/месяц (1 инстанс 24/7)
- **Railway**: $5 кредитов/месяц

### Итого: $0/месяц (в рамках бесплатных планов)

### Платные планы (при росте)

- **Neon Pro**: $19/месяц (больше compute, storage)
- **Vercel Pro**: $20/месяц (больше bandwidth, team features)
- **Render Starter**: $7/месяц (больше часов, лучше performance)
- **Railway Pro**: $20/месяц (больше кредитов)

---

## Безопасность

### Чеклист безопасности

- [ ] Все SECRET_KEY уникальные и длинные (32+ символов)
- [ ] DATABASE_URL не в публичном репозитории
- [ ] CORS настроен только для нужных доменов
- [ ] HTTPS принудительный везде
- [ ] Discord Bot Token в секрете
- [ ] Rate limiting настроен в backend
- [ ] SQL injection защита (используем параметризованные запросы)
- [ ] XSS защита (React экранирует по умолчанию)

### Регулярные проверки

- Обновлять зависимости: `npm audit`, `pip check`
- Проверять логи на подозрительную активность
- Мониторить использование ресурсов
- Делать бэкапы БД (Neon делает автоматически)

---

## Поддержка

Если возникли проблемы:
1. Проверить [Troubleshooting](#troubleshooting)
2. Посмотреть логи в соответствующем сервисе
3. Создать [Issue на GitHub](https://github.com/JaK1L/lesnaya-komanda/issues)
4. Написать в Discord сервер

---

**Последнее обновление:** 07.03.2026  
**Версия:** 1.0.0

