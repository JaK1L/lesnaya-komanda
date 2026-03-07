# 🚀 Быстрый гайд по деплою

## Автоматический деплой (рекомендуется)

### Windows (PowerShell)
```powershell
.\deploy.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x deploy.sh
./deploy.sh
```

Скрипт автоматически:
- ✅ Проверит Git статус
- ✅ Запушит код в GitHub
- ✅ Дождется деплоя (2 минуты)
- ✅ Проверит все сервисы
- ✅ Проверит CORS
- ✅ Выдаст отчет

---

## Ручной деплой

### 1. Пуш в GitHub
```bash
git add .
git commit -m "Deploy: описание изменений"
git push origin main
```

### 2. Автоматический деплой
После пуша автоматически запустятся:
- **Vercel** (Frontend) - 1-2 минуты
- **Render** (Backend) - 2-3 минуты
- **Railway** (Bot) - 1-2 минуты

### 3. Проверка
```bash
# Автоматическая проверка
chmod +x check-deployment.sh
./check-deployment.sh

# Или вручную
curl https://lesnayakomanda.onrender.com/api/
curl https://lesnaya-komanda.vercel.app
```

---

## Первичная настройка

### 1. Neon (База данных)
1. Зайти на https://console.neon.tech/
2. Создать проект: `lesnaya-komanda`
3. Скопировать `DATABASE_URL`

### 2. Render (Backend)
1. Зайти на https://dashboard.render.com/
2. New → Web Service
3. Подключить GitHub репозиторий
4. Настройки:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Environment Variables (см. ниже)

### 3. Vercel (Frontend)
1. Зайти на https://vercel.com/dashboard
2. Import Project → GitHub
3. Настройки:
   - Root Directory: `frontend`
   - Framework: Next.js
4. Environment Variables (см. ниже)

### 4. Railway (Discord Bot)
1. Зайти на https://railway.app/dashboard
2. New Project → Deploy from GitHub
3. Настройки:
   - Root Directory: `bot`
   - Start Command: `python main.py`
4. Environment Variables (см. ниже)

---

## Переменные окружения

### Render (Backend)
```env
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
SECRET_KEY=<сгенерировать: python -c "import secrets; print(secrets.token_urlsafe(32))">
ALLOWED_ORIGINS=http://localhost:3000,https://lesnaya-komanda.vercel.app
DISCORD_CLIENT_ID=1329022035062079540
DISCORD_CLIENT_SECRET=Gt6g_0gQ13R-7Y7FZp0k2Xo8aZFQ7U8B
FRONTEND_URL=https://lesnaya-komanda.vercel.app
BACKEND_URL=https://lesnayakomanda.onrender.com
ADMIN_USERNAME=LesnoyBOSS
ADMIN_PASSWORD=LesnoyBOSS909!
DEBUG=False
```

### Vercel (Frontend)
```env
NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com
NEXT_PUBLIC_GA_ID=G-3437T4EM9D
NEXT_PUBLIC_YM_ID=107194144
NEXT_PUBLIC_IMGBB_API_KEY=c026403294c4af46bc1d0a7e3faf582e
```

### Railway (Bot)
```env
DISCORD_BOT_TOKEN=<ваш токен>
DISCORD_GUILD_ID=236652227060563969
DATABASE_URL=<тот же что и на Render>
API_URL=https://lesnayakomanda.onrender.com
WEBSITE_URL=https://lesnaya-komanda.vercel.app
```

---

## Проверка после деплоя

### Чеклист
- [ ] Backend: https://lesnayakomanda.onrender.com/api/
- [ ] API Docs: https://lesnayakomanda.onrender.com/api/docs
- [ ] Frontend: https://lesnaya-komanda.vercel.app
- [ ] Admin: https://lesnaya-komanda.vercel.app/admin
- [ ] Bot онлайн в Discord

### Тест админки
1. Открыть https://lesnaya-komanda.vercel.app/admin
2. Логин: `LesnoyBOSS`
3. Пароль: `LesnoyBOSS909!`
4. Проверить редактирование новостей/событий

---

## Troubleshooting

### Backend не запускается
```bash
# Проверить логи
https://dashboard.render.com/ → Logs

# Частые проблемы:
# - DATABASE_URL неправильный
# - SECRET_KEY слишком короткий
# - Зависимости не установились
```

### CORS ошибка
```bash
# Проверить ALLOWED_ORIGINS на Render
# Должен содержать: https://lesnaya-komanda.vercel.app

# Проверить CORS
curl -X OPTIONS https://lesnayakomanda.onrender.com/api/token \
  -H "Origin: https://lesnaya-komanda.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Frontend не подключается к API
```bash
# Проверить NEXT_PUBLIC_API_URL на Vercel
# Должен быть: https://lesnayakomanda.onrender.com

# Проверить в DevTools → Network
# Должны быть запросы к API
```

### Bot не отвечает
```bash
# Проверить логи Railway
https://railway.app/dashboard → Logs

# Проверить что:
# - DISCORD_BOT_TOKEN правильный
# - Bot добавлен на сервер
# - Intents включены в Discord Developer Portal
```

---

## Мониторинг

### Uptime мониторинг
Настроить на https://uptimerobot.com:
- Frontend: https://lesnaya-komanda.vercel.app
- Backend: https://lesnayakomanda.onrender.com/api/

### Логи
- **Frontend**: Vercel Dashboard → Logs
- **Backend**: Render Dashboard → Logs
- **Bot**: Railway Dashboard → Logs
- **Database**: Neon Dashboard → Monitoring

---

## Полезные ссылки

### Дашборды
- Render: https://dashboard.render.com/
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
- Neon: https://console.neon.tech/

### Документация
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Полная документация
- [ENV-VARIABLES.md](./ENV-VARIABLES.md) - Все переменные окружения
- [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md) - Чеклист для деплоя

### Discord
- Developer Portal: https://discord.com/developers/applications
- OAuth2 настройка для входа на сайт

---

## Стоимость

Все сервисы на бесплатных планах:
- **Neon**: 0.25 vCPU, 1GB storage
- **Vercel**: 100GB bandwidth
- **Render**: 750 часов/месяц
- **Railway**: $5 кредитов/месяц

**Итого: $0/месяц**

---

**Последнее обновление:** 07.03.2026
