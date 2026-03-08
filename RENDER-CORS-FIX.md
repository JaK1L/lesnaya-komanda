# Исправление CORS на Render.com

## Проблема
CORS ошибка при обращении с Vercel (https://lesnaya-komanda.vercel.app) к бэкенду на Render (https://lesnayakomanda.onrender.com).

## Решение

### 1. Зайди в Render.com Dashboard
https://dashboard.render.com/

### 2. Выбери свой бэкенд сервис
`lesnayakomanda` (или как называется твой backend service)

### 3. Перейди в Environment
Слева в меню: **Environment**

### 4. Найди переменную ALLOWED_ORIGINS
Если её нет - создай новую переменную.

### 5. Установи значение:
```
http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://lesnaya-komanda.vercel.app,https://lesnayakomanda.onrender.com,https://lesnaya-komanda.onrender.com
```

### 6. Сохрани изменения
Нажми **Save Changes**

### 7. Render автоматически перезапустит сервис
Подожди 2-3 минуты пока сервис перезапустится.

### 8. Проверь
Обнови страницу https://lesnaya-komanda.vercel.app/admin/events - CORS ошибки должны исчезнуть.

## Альтернатива: через Render CLI

Если есть Render CLI:
```bash
render env set ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://lesnaya-komanda.vercel.app,https://lesnayakomanda.onrender.com,https://lesnaya-komanda.onrender.com"
```

## Проверка текущих настроек

Можешь проверить текущие CORS настройки через API:
```bash
curl https://lesnayakomanda.onrender.com/health
```

Если сервер работает, но CORS не настроен - увидишь ответ, но без CORS заголовков.

## Важно!

После изменения переменных окружения Render автоматически:
1. Пересобирает образ (если нужно)
2. Перезапускает сервис
3. Применяет новые настройки

Это занимает 2-5 минут.
