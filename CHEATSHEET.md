# 📝 Шпаргалка по деплою

Быстрая справка по командам и URLs.

---

## ⚡ Быстрые команды

```bash
# Деплой
.\deploy.ps1                    # Windows
./deploy.sh                     # Linux/Mac
make deploy                     # Через Makefile

# Проверка
.\check-deployment.sh           # Проверить все сервисы
make check                      # Через Makefile

# Разработка
make dev                        # Запустить локально
make dev-docker                 # Запустить в Docker
make install                    # Установить зависимости

# База данных
make db-migrate                 # Применить миграции
make db-seed                    # Заполнить данными
make admin-create               # Создать админа

# Утилиты
make clean                      # Очистить временные файлы
make status                     # Статус сервисов
make urls                       # Показать все URLs
make help                       # Все команды
```

---

## 🌐 URLs

### Production
```
Frontend:  https://lesnaya-komanda.vercel.app
Backend:   https://lesnayakomanda.onrender.com
API Docs:  https://lesnayakomanda.onrender.com/api/docs
Admin:     https://lesnaya-komanda.vercel.app/admin
```

### Local
```
Frontend:  http://localhost:3000
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/api/docs
```

### Дашборды
```
Render:    https://dashboard.render.com/
Vercel:    https://vercel.com/dashboard
Railway:   https://railway.app/dashboard
Neon:      https://console.neon.tech/
Discord:   https://discord.com/developers/applications
```

---

## 🔐 Переменные окружения

### Render (Backend)
```env
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
SECRET_KEY=<python -c "import secrets; print(secrets.token_urlsafe(32))">
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
DISCORD_BOT_TOKEN=<твой токен>
DISCORD_GUILD_ID=236652227060563969
DATABASE_URL=<тот же что и на Render>
API_URL=https://lesnayakomanda.onrender.com
WEBSITE_URL=https://lesnaya-komanda.vercel.app
```

---

## 🧪 Проверка

### Backend
```bash
curl https://lesnayakomanda.onrender.com/api/
# Ожидается: {"status":"ok"}
```

### Frontend
```bash
curl -I https://lesnaya-komanda.vercel.app
# Ожидается: HTTP/2 200
```

### CORS
```bash
curl -X OPTIONS https://lesnayakomanda.onrender.com/api/token \
  -H "Origin: https://lesnaya-komanda.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
# Ожидается: access-control-allow-origin: https://lesnaya-komanda.vercel.app
```

### Admin Login
```bash
curl -X POST https://lesnayakomanda.onrender.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=LesnoyBOSS&password=LesnoyBOSS909!"
# Ожидается: {"access_token":"..."}
```

---

## 🐛 Troubleshooting

### Backend не отвечает
```bash
# Проверить логи
https://dashboard.render.com/ → Logs

# Cold start - подожди 30 секунд
curl https://lesnayakomanda.onrender.com/api/
```

### CORS ошибка
```bash
# Проверить ALLOWED_ORIGINS на Render
# Должен содержать: https://lesnaya-komanda.vercel.app
```

### Frontend не подключается
```bash
# Проверить NEXT_PUBLIC_API_URL на Vercel
# Должен быть: https://lesnayakomanda.onrender.com
```

### Bot не отвечает
```bash
# Проверить логи
https://railway.app/dashboard → Logs

# Проверить что бот онлайн в Discord
```

---

## 📦 Git команды

```bash
# Статус
git status

# Коммит
git add .
git commit -m "Deploy: описание"

# Пуш (автоматический деплой)
git push origin main

# Откат
git revert HEAD
git push origin main
```

---

## 🗄️ База данных

### Подключение
```bash
psql "postgresql://...@neon.tech/neondb?sslmode=require"
```

### Миграции
```bash
cd backend
python apply_achievements_migration.py
python apply_events_migration.py
python apply_news_migration.py
```

### Тестовые данные
```bash
cd backend
python seed_database.py
```

### Создать админа
```bash
cd backend
python create_admin.py
```

### SQL запросы
```sql
-- Проверить таблицы
\dt

-- Проверить пользователей
SELECT * FROM users LIMIT 5;

-- Проверить админа
SELECT * FROM admin_users;

-- Обновить админа
UPDATE admin_users 
SET username = 'LesnoyBOSS',
    password_hash = '$2b$12$KLgqVoHH3ZkRanbKF5M0f.KrRP32hM4R4cCwN26Km4Uc4K0jfr5v.',
    role = 'admin'
WHERE id = 1;
```

---

## 🔑 Генерация ключей

### SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Password Hash
```bash
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('your_password'))"
```

---

## 📊 Мониторинг

### Логи
```bash
# Render
https://dashboard.render.com/ → Logs

# Vercel
https://vercel.com/dashboard → Logs

# Railway
https://railway.app/dashboard → Logs

# Neon
https://console.neon.tech/ → Monitoring
```

### Метрики
```bash
# Google Analytics
https://analytics.google.com

# Yandex Metrika
https://metrika.yandex.ru

# UptimeRobot
https://uptimerobot.com
```

---

## 🔄 Обновление

### Автоматическое
```bash
git push origin main
# Все сервисы обновятся автоматически
```

### С проверкой
```bash
.\deploy.ps1
# Скрипт проверит все после деплоя
```

### Rollback
```bash
# Vercel
https://vercel.com/dashboard → Deployments → Promote to Production

# Render
https://dashboard.render.com/ → Manual Deploy → Выбрать commit

# Railway
https://railway.app/dashboard → Deployments → Redeploy
```

---

## 📚 Документация

```
QUICK-START.md           - Быстрый старт
DEPLOY-NOW.md            - Пошаговая инструкция
DEPLOY-GUIDE.md          - Краткий гайд
DEPLOYMENT.md            - Полная документация
ENV-VARIABLES.md         - Переменные окружения
DEPLOYMENT-CHECKLIST.md  - Чеклист
CHEATSHEET.md            - Эта шпаргалка
```

---

**Последнее обновление:** 07.03.2026
