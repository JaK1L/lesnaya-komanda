# 🔐 Переменные окружения для деплоя

## 📦 Render (Backend)

Открой: https://dashboard.render.com/ → Выбери сервис → Environment

```env
# База данных (из Neon)
DATABASE_URL=postgresql://neondb_owner:npg_PRJbuN0f4Yyc@ep-purple-boat-agxuy7jr-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis (опционально, можно оставить localhost)
REDIS_URL=redis://localhost:6379/0

# Безопасность
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS - ВАЖНО! Добавь URL Vercel
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app

# Discord OAuth
DISCORD_CLIENT_ID=1329022035062079540
DISCORD_CLIENT_SECRET=Gt6g_0gQ13R-7Y7FZp0k2Xo8aZFQ7U8B

# URLs - ВАЖНО! Production URLs
FRONTEND_URL=https://lesnaya-komanda.vercel.app
BACKEND_URL=https://lesnayakomanda.onrender.com

# Discord бот (опционально)
DISCORD_BOT_TOKEN=твой_токен_бота
DISCORD_GUILD_ID=236652227060563969

# Admin credentials (для автоматического создания админа при старте)
ADMIN_USERNAME=LesnoyBOSS
ADMIN_PASSWORD=LesnoyBOSS909!

# Режим
DEBUG=False
```

---

## 🚀 Vercel (Frontend)

Открой: https://vercel.com/dashboard → Выбери проект → Settings → Environment Variables

```env
# Backend API URL - ВАЖНО! URL Render без /api
NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com

# WebSocket URL
NEXT_PUBLIC_WS_URL=wss://lesnayakomanda.onrender.com/ws/discord

# Google Analytics
NEXT_PUBLIC_GA_ID=G-3437T4EM9D

# Yandex Metrika
NEXT_PUBLIC_YM_ID=107194144

# Image Upload (ImgBB API)
NEXT_PUBLIC_IMGBB_API_KEY=c026403294c4af46bc1d0a7e3faf582e
```

---

## ✅ Проверка после настройки

### 1. Проверить Backend (Render)

```bash
# Проверить что API работает
curl https://lesnayakomanda.onrender.com/api/

# Должен вернуть:
# {"message":"Лесная Команда API active","status":"ok"}
```

### 2. Проверить CORS

```bash
curl -X OPTIONS https://lesnayakomanda.onrender.com/api/token \
  -H "Origin: https://lesnaya-komanda.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Должен вернуть:
```
< access-control-allow-origin: https://lesnaya-komanda.vercel.app
< access-control-allow-credentials: true
```

### 3. Проверить логин через Swagger

Открой: https://lesnayakomanda.onrender.com/api/docs

POST `/api/token`:
```
username: LesnoyBOSS
password: LesnoyBOSS909!
```

Должен вернуть токен.

### 4. Проверить Frontend (Vercel)

Открой: https://lesnaya-komanda.vercel.app/admin

Войти с:
```
Логин: LesnoyBOSS
Пароль: LesnoyBOSS909!
```

---

## 🔄 После изменения переменных

### Render:
1. Сохранить переменные
2. Render автоматически перезапустит сервис (2-3 минуты)
3. Проверить логи: Logs tab

### Vercel:
1. Сохранить переменные
2. Deployments → последний деплой → ⋯ → Redeploy
3. Подождать 1-2 минуты

---

## 📝 Важные заметки

### ALLOWED_ORIGINS на Render
- Должен содержать URL Vercel: `https://lesnaya-komanda.vercel.app`
- Без этого будет CORS ошибка
- Можно добавить несколько через запятую

### NEXT_PUBLIC_API_URL на Vercel
- Должен быть URL Render: `https://lesnayakomanda.onrender.com`
- БЕЗ `/api` в конце!
- Должен начинаться с `NEXT_PUBLIC_` чтобы работать в браузере

### DATABASE_URL
- Получить из Neon: https://console.neon.tech/
- Должен содержать `?sslmode=require`
- Использовать pooler URL для лучшей производительности

### SECRET_KEY
- Сгенерировать случайный ключ:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- Никогда не коммитить в Git!

---

## 🐛 Troubleshooting

### Проблема: "Неверный логин или пароль"
**Решение:** Админ не создан в БД. Выполни SQL в Neon:
```sql
UPDATE admin_users 
SET 
    username = 'LesnoyBOSS',
    password_hash = '$2b$12$KLgqVoHH3ZkRanbKF5M0f.KrRP32hM4R4cCwN26Km4Uc4K0jfr5v.',
    role = 'admin'
WHERE id = 1;
```

### Проблема: CORS error
**Решение:** Проверь `ALLOWED_ORIGINS` на Render содержит URL Vercel

### Проблема: "Failed to fetch"
**Решение:** Проверь `NEXT_PUBLIC_API_URL` на Vercel правильный

### Проблема: Backend не отвечает
**Решение:** Render усыпляет бесплатные сервисы. Подожди 30 секунд при первом запросе.

---

**Дата:** 07.03.2026  
**Статус:** Актуально
