# 🚀 ДЕПЛОЙ СЕЙЧАС - Пошаговая инструкция

Эта инструкция поможет тебе задеплоить проект за 30 минут.

---

## ⚡ Быстрый путь (если уже все настроено)

```powershell
# Просто запусти скрипт
.\deploy.ps1
```

Если что-то не работает - следуй полной инструкции ниже.

---

## 📋 Полная инструкция

### Шаг 1: Проверка кода (2 минуты)

```powershell
# Проверь что все файлы на месте
git status

# Если есть изменения - закоммить
git add .
git commit -m "Deploy: готов к деплою"
```

---

### Шаг 2: Neon - База данных (5 минут)

1. Открой https://console.neon.tech/
2. Войди через GitHub
3. Нажми "Create Project"
4. Настройки:
   - Name: `lesnaya-komanda`
   - Region: `Europe (Frankfurt)`
   - PostgreSQL: `15`
5. Скопируй `Connection string` (начинается с `postgresql://`)
6. Сохрани его - понадобится для Render и Railway

**✅ Готово:** У тебя есть DATABASE_URL

---

### Шаг 3: Render - Backend (10 минут)

1. Открой https://dashboard.render.com/
2. Войди через GitHub
3. Нажми "New +" → "Web Service"
4. Выбери репозиторий `lesnaya-komanda`
5. Настройки:
   - **Name:** `lesnayakomanda`
   - **Region:** `Frankfurt (EU Central)`
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`

6. Нажми "Advanced" → "Add Environment Variable"
7. Добавь переменные:

```env
DATABASE_URL=<твой DATABASE_URL из Neon>
SECRET_KEY=<сгенерируй ниже>
ALLOWED_ORIGINS=http://localhost:3000,https://lesnaya-komanda.vercel.app
DISCORD_CLIENT_ID=1329022035062079540
DISCORD_CLIENT_SECRET=Gt6g_0gQ13R-7Y7FZp0k2Xo8aZFQ7U8B
FRONTEND_URL=https://lesnaya-komanda.vercel.app
BACKEND_URL=https://lesnayakomanda.onrender.com
ADMIN_USERNAME=LesnoyBOSS
ADMIN_PASSWORD=LesnoyBOSS909!
DEBUG=False
```

8. Сгенерируй SECRET_KEY:
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Скопируй результат в `SECRET_KEY`

9. Нажми "Create Web Service"
10. Дождись деплоя (2-3 минуты)
11. Проверь: https://lesnayakomanda.onrender.com/api/
    - Должно вернуть: `{"status":"ok"}`

**✅ Готово:** Backend работает

---

### Шаг 4: Vercel - Frontend (5 минут)

1. Открой https://vercel.com/dashboard
2. Войди через GitHub
3. Нажми "Add New..." → "Project"
4. Выбери репозиторий `lesnaya-komanda`
5. Настройки:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

6. Нажми "Environment Variables"
7. Добавь переменные:

```env
NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com
NEXT_PUBLIC_GA_ID=G-3437T4EM9D
NEXT_PUBLIC_YM_ID=107194144
NEXT_PUBLIC_IMGBB_API_KEY=c026403294c4af46bc1d0a7e3faf582e
```

8. Нажми "Deploy"
9. Дождись деплоя (1-2 минуты)
10. Проверь: https://lesnaya-komanda.vercel.app
    - Сайт должен открыться

**✅ Готово:** Frontend работает

---

### Шаг 5: Railway - Discord Bot (5 минут)

1. Открой https://railway.app/dashboard
2. Войди через GitHub
3. Нажми "New Project"
4. Выбери "Deploy from GitHub repo"
5. Выбери репозиторий `lesnaya-komanda`
6. Настройки:
   - **Name:** `lesnaya-komanda-bot`
   - **Root Directory:** `bot`
   - **Start Command:** `python main.py`

7. Нажми "Variables"
8. Добавь переменные:

```env
DISCORD_BOT_TOKEN=<твой токен бота>
DISCORD_GUILD_ID=236652227060563969
DATABASE_URL=<тот же что и на Render>
API_URL=https://lesnayakomanda.onrender.com
WEBSITE_URL=https://lesnaya-komanda.vercel.app
```

9. Получить DISCORD_BOT_TOKEN:
   - Открой https://discord.com/developers/applications
   - Выбери приложение
   - Bot → Reset Token → Скопируй

10. Нажми "Deploy"
11. Проверь логи - должно быть: "Bot is ready!"

**✅ Готово:** Bot работает

---

### Шаг 6: Проверка (3 минуты)

```powershell
# Автоматическая проверка
.\check-deployment.sh

# Или вручную:
```

1. **Backend:**
   - Открой https://lesnayakomanda.onrender.com/api/
   - Должно быть: `{"status":"ok"}`

2. **API Docs:**
   - Открой https://lesnayakomanda.onrender.com/api/docs
   - Swagger UI должен открыться

3. **Frontend:**
   - Открой https://lesnaya-komanda.vercel.app
   - Сайт должен загрузиться

4. **Admin:**
   - Открой https://lesnaya-komanda.vercel.app/admin
   - Войди: `LesnoyBOSS` / `LesnoyBOSS909!`
   - Должна открыться админка

5. **Bot:**
   - Открой Discord
   - Бот должен быть онлайн
   - Напиши `!помощь` - должен ответить

**✅ Готово:** Все работает!

---

## 🔧 Если что-то не работает

### Backend не отвечает
```powershell
# Проверь логи на Render
# https://dashboard.render.com/ → Logs

# Частые проблемы:
# 1. DATABASE_URL неправильный - проверь что скопировал из Neon
# 2. SECRET_KEY слишком короткий - должен быть 32+ символов
# 3. Cold start - подожди 30 секунд и попробуй снова
```

### CORS ошибка
```powershell
# Проверь ALLOWED_ORIGINS на Render
# Должен содержать: https://lesnaya-komanda.vercel.app

# Если нет - добавь и сохрани
# Render автоматически перезапустится
```

### Frontend не подключается к API
```powershell
# Проверь NEXT_PUBLIC_API_URL на Vercel
# Должен быть: https://lesnayakomanda.onrender.com

# Если неправильный:
# 1. Vercel Dashboard → Settings → Environment Variables
# 2. Измени NEXT_PUBLIC_API_URL
# 3. Deployments → последний деплой → Redeploy
```

### Bot не отвечает
```powershell
# Проверь логи на Railway
# https://railway.app/dashboard → Logs

# Частые проблемы:
# 1. DISCORD_BOT_TOKEN неправильный
# 2. Bot не добавлен на сервер
# 3. Intents не включены в Discord Developer Portal
```

---

## 📊 Следующие шаги

После успешного деплоя:

1. **Заполни БД тестовыми данными:**
   ```powershell
   # Подключись к Neon через psql
   psql "<твой DATABASE_URL>"
   
   # Или используй Neon SQL Editor
   # https://console.neon.tech/ → SQL Editor
   ```

2. **Настрой мониторинг:**
   - UptimeRobot: https://uptimerobot.com
   - Добавь Frontend и Backend

3. **Проверь аналитику:**
   - Google Analytics: https://analytics.google.com
   - Yandex Metrika: https://metrika.yandex.ru

4. **Объяви о запуске:**
   - Напиши в Discord сервере
   - Пригласи пользователей

---

## 🎉 Готово!

Твой проект задеплоен и работает!

### URLs:
- **Frontend:** https://lesnaya-komanda.vercel.app
- **Backend:** https://lesnayakomanda.onrender.com
- **API Docs:** https://lesnayakomanda.onrender.com/api/docs
- **Admin:** https://lesnaya-komanda.vercel.app/admin

### Дашборды:
- **Render:** https://dashboard.render.com/
- **Vercel:** https://vercel.com/dashboard
- **Railway:** https://railway.app/dashboard
- **Neon:** https://console.neon.tech/

---

## 🔄 Обновление в будущем

Когда нужно обновить код:

```powershell
# 1. Внеси изменения
# 2. Закоммить
git add .
git commit -m "Update: описание изменений"

# 3. Запусти деплой
.\deploy.ps1

# Или просто запуш
git push origin main
```

Все сервисы обновятся автоматически!

---

**Время выполнения:** ~30 минут  
**Сложность:** Легко  
**Стоимость:** $0/месяц

**Последнее обновление:** 07.03.2026
