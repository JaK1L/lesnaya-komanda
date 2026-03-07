# CORS Fix для Render

## Проблема
Фронтенд на Vercel не мог обращаться к бэкенду на Render из-за CORS ошибки.

## Причина
В переменных окружения был указан неправильный URL бэкенда:
- Было: `https://lesnayakomanda.onrender.com` (без дефиса)
- Нужно: `https://lesnaya-komanda.onrender.com` (с дефисом)

## Исправление

### 1. Обновлены файлы .env
Добавлены оба варианта URL в ALLOWED_ORIGINS:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app,https://lesnayakomanda.onrender.com,https://lesnaya-komanda.onrender.com
BACKEND_URL=https://lesnaya-komanda.onrender.com
```

### 2. Что нужно сделать на Render

1. Зайдите в настройки вашего сервиса на Render
2. Перейдите в раздел "Environment"
3. Обновите переменную `ALLOWED_ORIGINS`:
   ```
   http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app,https://lesnayakomanda.onrender.com,https://lesnaya-komanda.onrender.com
   ```
4. Сохраните изменения
5. Render автоматически перезапустит сервис

### 3. Проверка

После перезапуска сервиса на Render:
- Откройте https://lesnaya-komanda.vercel.app/admin
- Попробуйте войти
- CORS ошибки должны исчезнуть

## Дополнительно

Если проблема сохраняется, проверьте:
1. Правильность URL бэкенда на Render (с дефисом или без)
2. Логи на Render - есть ли там ошибки при запуске
3. Что переменные окружения действительно обновились (можно посмотреть в логах при старте)
