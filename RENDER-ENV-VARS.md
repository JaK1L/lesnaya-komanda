# Переменные окружения для Render.com

Скопируй эти переменные в настройки Render.com (Environment):

## Обязательные переменные

```
DATABASE_URL=YOUR_POSTGRESQL_CONNECTION_STRING_HERE

SECRET_KEY=YOUR_SECRET_KEY_HERE

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://lesnaya-komanda.vercel.app,https://lesnayakomanda.onrender.com,https://lesnaya-komanda.onrender.com

DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE

DISCORD_GUILD_ID=236652227060563969

DISCORD_CLIENT_ID=1329022035062079540

DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET_HERE

FRONTEND_URL=https://lesnaya-komanda.vercel.app

BACKEND_URL=https://lesnayakomanda.onrender.com

ADMIN_USERNAME=YOUR_ADMIN_USERNAME

ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD

DEBUG=False
```

## Опциональные переменные

```
REDIS_URL=redis://localhost:6379/0
```

---

## Как добавить на Render.com

### Способ 1: Через Web UI

1. Зайди на https://dashboard.render.com/
2. Выбери свой backend сервис
3. Перейди в **Environment** (слева в меню)
4. Для каждой переменной:
   - Нажми **Add Environment Variable**
   - Введи **Key** (название переменной)
   - Введи **Value** (значение)
   - Нажми **Save**
5. После добавления всех переменных нажми **Save Changes**
6. Render автоматически перезапустит сервис

### Способ 2: Через render.yaml (рекомендуется)

Создай файл `render.yaml` в корне проекта:

```yaml
services:
  - type: web
    name: lesnayakomanda-backend
    env: python
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: ALGORITHM
        value: HS256
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: 30
      - key: ALLOWED_ORIGINS
        value: http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://lesnaya-komanda.vercel.app,https://lesnayakomanda.onrender.com,https://lesnaya-komanda.onrender.com
      - key: DISCORD_BOT_TOKEN
        sync: false
      - key: DISCORD_GUILD_ID
        value: 236652227060563969
      - key: DISCORD_CLIENT_ID
        value: 1329022035062079540
      - key: DISCORD_CLIENT_SECRET
        sync: false
      - key: FRONTEND_URL
        value: https://lesnaya-komanda.vercel.app
      - key: BACKEND_URL
        value: https://lesnayakomanda.onrender.com
      - key: ADMIN_USERNAME
        sync: false
      - key: ADMIN_PASSWORD
        sync: false
      - key: DEBUG
        value: False
```

Затем в Render.com добавь секретные переменные (sync: false) вручную.

---

## Проверка

После обновления переменных:

1. Подожди 2-5 минут пока Render перезапустит сервис
2. Проверь логи: https://dashboard.render.com/ → твой сервис → Logs
3. Проверь что сервис запустился без ошибок
4. Проверь CORS: открой https://lesnaya-komanda.vercel.app/admin/events

## Если всё ещё не работает

Проверь логи на Render.com:
- Ищи ошибки запуска
- Проверь что все переменные загружены
- Убедись что порт правильный (Render использует переменную $PORT)

## Важно!

- `sync: false` означает что переменная не будет в git (секретная)
- После изменения переменных Render автоматически перезапускает сервис
- Если сервис не запускается - проверь логи
