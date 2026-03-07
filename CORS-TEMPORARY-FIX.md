# 🔧 Временное исправление CORS

**Дата:** 07.03.2026  
**Статус:** Временное решение для отладки

## Проблема

CORS ошибка при POST запросах (создание достижений):
```
Access to fetch at 'https://lesnayakomanda.onrender.com/api/achievements/types' 
from origin 'https://lesnaya-komanda.vercel.app' has been blocked by CORS policy
```

## Временное решение

Добавлено условие в `backend/app/main.py`:

```python
# ВРЕМЕННО: Разрешаем все origins для отладки CORS
cors_origins = ["*"] if settings.DEBUG else settings.ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # ["*"] в DEBUG режиме
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],  # Разрешаем все заголовки
    ...
)
```

## Как это работает

- Если `DEBUG=True` → разрешены ВСЕ origins (`["*"]`)
- Если `DEBUG=False` → используется `ALLOWED_ORIGINS` из .env

## Текущие настройки

### backend/.env
```env
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app
```

### Результат
С `DEBUG=True` backend разрешает запросы с ЛЮБЫХ доменов.

## Проверка

После деплоя (2-3 минуты):

1. Открой: https://lesnaya-komanda.vercel.app/admin
2. Войди как админ
3. Попробуй создать достижение
4. CORS ошибка должна исчезнуть

## ⚠️ ВАЖНО: Это временное решение!

### Для production нужно:

1. Установить `DEBUG=False` на Render
2. Убрать условие `["*"]` из кода
3. Правильно настроить `ALLOWED_ORIGINS`

### Правильная настройка для production:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Без ["*"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        ...
    ],
)
```

```env
# backend/.env или Render Environment Variables
DEBUG=False
ALLOWED_ORIGINS=https://lesnaya-komanda.vercel.app
```

## Почему возникла проблема

### Возможные причины:

1. **Переменная на Render переопределяет .env**
   - На Render может быть установлена `ALLOWED_ORIGINS` с неправильным значением
   - Render Environment Variables имеют приоритет над .env файлом

2. **Preflight запросы (OPTIONS) блокируются**
   - Браузер отправляет OPTIONS перед POST
   - Если OPTIONS не возвращает правильные CORS заголовки → блокировка

3. **Cloudflare кэширует ответы**
   - Render использует Cloudflare CDN
   - Старые ответы без CORS могут быть закэшированы

## Следующие шаги

### 1. Проверить работает ли временное решение

После деплоя попробуй создать достижение. Если работает → проблема в CORS настройках.

### 2. Проверить переменные на Render

1. Открой: https://dashboard.render.com/
2. Сервис `lesnayakomanda` → Environment
3. Проверь есть ли `ALLOWED_ORIGINS`
4. Если есть - удали или исправь на: `https://lesnaya-komanda.vercel.app`

### 3. Вернуть правильные настройки

После того как убедишься что проблема в CORS:

```python
# backend/app/main.py - убрать временное решение
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Вернуть обратно
    ...
)
```

```env
# backend/.env или Render
DEBUG=False  # Для production
ALLOWED_ORIGINS=https://lesnaya-komanda.vercel.app
```

## Логи для отладки

После деплоя проверь логи на Render:

```
🌐 CORS: Разрешенные origins: ['http://localhost:3000', ...]
🌐 DEBUG mode: True
🌐 CORS origins для middleware: ['*']
```

Если видишь `['*']` - значит временное решение работает.

## Тестирование

```bash
# Проверка OPTIONS запроса
curl -X OPTIONS \
  -H "Origin: https://lesnaya-komanda.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://lesnayakomanda.onrender.com/api/achievements/types \
  -v 2>&1 | grep -i "access-control"

# Должно вернуть:
# access-control-allow-origin: *
# access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
# access-control-allow-headers: *
```

---

**Коммит:** `89c4143`  
**Статус:** ⚠️ Временное решение (не для production)  
**Время действия:** До исправления основной проблемы
