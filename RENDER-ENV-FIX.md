# 🔧 Исправление CORS на Render

## Проблема
CORS ошибка на production: `Access to fetch at 'https://lesnayakomanda.onrender.com/api/admin/events' from origin 'https://lesnaya-komanda.vercel.app' has been blocked by CORS policy`

## Причина
На Render в переменных окружения указан неправильный `BACKEND_URL` с дефисом вместо без дефиса.

## Решение

### Шаг 1: Открой Render Dashboard
1. Перейди на https://dashboard.render.com
2. Найди сервис `lesnayakomanda` (backend)
3. Перейди в раздел **Environment**

### Шаг 2: Обнови переменные окружения

Найди и измени следующие переменные:

```bash
# БЫЛО (неправильно):
BACKEND_URL=https://lesnaya-komanda.onrender.com

# ДОЛЖНО БЫТЬ (правильно):
BACKEND_URL=https://lesnayakomanda.onrender.com
```

**ВАЖНО**: URL должен быть БЕЗ дефиса между `lesnaya` и `komanda`!

### Шаг 3: Проверь другие переменные

Убедись что эти переменные установлены правильно:

```bash
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app
FRONTEND_URL=https://lesnaya-komanda.vercel.app
```

**Примечание**: `FRONTEND_URL` и `ALLOWED_ORIGINS` должны содержать URL С дефисом (это Vercel URL).

### Шаг 4: Сохрани и дождись редеплоя

1. Нажми **Save Changes**
2. Render автоматически перезапустит сервис (5-10 минут)
3. Дождись статуса **Live**

### Шаг 5: Проверь что CORS работает

Открой консоль браузера (F12) на https://lesnaya-komanda.vercel.app/admin/events

Не должно быть ошибок CORS.

## Альтернативное решение (если не помогло)

Если после изменения переменных CORS все еще не работает, добавь в Render переменную:

```bash
ALLOWED_ORIGINS=*
```

Это временно разрешит все origins (только для отладки!).

## Проверка текущих настроек

Чтобы проверить какие переменные используются на Render:

1. Открой **Logs** в Render Dashboard
2. Найди строки при запуске:
   ```
   🌐 CORS: Разрешенные origins: ...
   🌐 DEBUG mode: True
   🌐 CORS origins для middleware: ...
   ```

Эти логи покажут какие настройки реально используются.

## Итоговая конфигурация

### Frontend (Vercel)
- URL: `https://lesnaya-komanda.vercel.app` (С дефисом)
- `.env.local`: `NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com` (БЕЗ дефиса)

### Backend (Render)
- URL: `https://lesnayakomanda.onrender.com` (БЕЗ дефиса)
- Environment Variables:
  - `BACKEND_URL=https://lesnayakomanda.onrender.com` (БЕЗ дефиса)
  - `FRONTEND_URL=https://lesnaya-komanda.vercel.app` (С дефисом)
  - `ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app`
  - `DEBUG=True`

---

**После исправления все CORS ошибки должны исчезнуть!** ✅
