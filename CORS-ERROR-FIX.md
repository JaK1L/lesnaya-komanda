# 🔧 Исправление CORS ошибки

**Дата:** 07.03.2026  
**Проблема:** CORS блокирует запросы с frontend

## Ошибка

```
Access to fetch at 'https://lesnayakomanda.onrender.com/api/achievements/types' 
from origin 'https://lesnaya-komanda.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Причина

На Render может быть установлена переменная окружения `ALLOWED_ORIGINS` которая не включает frontend URL.

## Решение

### Вариант 1: Проверить переменные на Render (рекомендуется)

1. Открой: https://dashboard.render.com/
2. Сервис `lesnayakomanda` → **Environment**
3. Найди переменную `ALLOWED_ORIGINS`
4. Если она есть, проверь что включает:
   ```
   http://localhost:3000,https://lesnaya-komanda.vercel.app
   ```
5. Если её нет или значение неправильное - добавь/исправь
6. Сохрани и дождись перезапуска сервиса

### Вариант 2: Добавить в .env файл

Если переменной нет на Render, она берется из кода по умолчанию:

```python
# backend/app/config.py
ALLOWED_ORIGINS: Union[list, str] = [
    "http://localhost:3000", 
    "https://lesnaya-komanda.vercel.app"
]
```

Это уже правильно настроено в коде.

### Вариант 3: Временное решение - разрешить все origins

⚠️ **Только для тестирования! Не для production!**

В `backend/app/main.py` измени:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешить все origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

## Проверка

### 1. Проверь что backend возвращает CORS заголовки

```bash
curl -H "Origin: https://lesnaya-komanda.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://lesnayakomanda.onrender.com/api/achievements/types \
     -v 2>&1 | grep -i "access-control"
```

Должно вернуть:
```
< access-control-allow-origin: https://lesnaya-komanda.vercel.app
< access-control-allow-credentials: true
< access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
```

### 2. Проверь в браузере

1. Открой: https://lesnaya-komanda.vercel.app
2. Открой DevTools (F12) → Network
3. Обнови страницу
4. Найди запрос к `/api/achievements/types`
5. Проверь Response Headers:
   - Должен быть `access-control-allow-origin: https://lesnaya-komanda.vercel.app`

## Возможные причины

### 1. Переменная ALLOWED_ORIGINS на Render неправильная

Проверь что на Render установлено:
```
ALLOWED_ORIGINS=http://localhost:3000,https://lesnaya-komanda.vercel.app
```

### 2. Backend не перезапустился после изменений

После изменения переменных окружения нужно:
- Render → Manual Deploy → Deploy latest commit

### 3. Кэш браузера

Очисти кэш браузера:
- Chrome: Ctrl+Shift+Delete → Clear cache
- Firefox: Ctrl+Shift+Delete → Clear cache

### 4. Cloudflare кэширует ответы

Render использует Cloudflare. Может быть закэширован старый ответ без CORS заголовков.

Решение:
- Подожди 5-10 минут
- Или добавь случайный query параметр: `/api/achievements/types?_t=123456`

## Текущие настройки

### Backend (config.py)
```python
ALLOWED_ORIGINS: Union[list, str] = [
    "http://localhost:3000",
    "https://lesnaya-komanda.vercel.app"
]
```

### CORS Middleware (main.py)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Requested-With",
    ],
    max_age=3600,
)
```

## Быстрое решение

Если нужно срочно исправить:

1. Открой Render Dashboard
2. Environment → Add Environment Variable
3. Добавь:
   ```
   Name: ALLOWED_ORIGINS
   Value: http://localhost:3000,https://lesnaya-komanda.vercel.app
   ```
4. Save
5. Подожди 2-3 минуты пока сервис перезапустится
6. Проверь сайт

## Проверка логов

Render → Logs → Ищи строку:
```
🌐 CORS: Разрешенные origins: ['http://localhost:3000', 'https://lesnaya-komanda.vercel.app']
```

Если там другие origins - значит переменная на Render установлена неправильно.

---

**Статус:** Требуется проверка переменных на Render  
**Время:** ~5 минут
