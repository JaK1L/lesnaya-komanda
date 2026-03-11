# Автоматическое получение последнего поста из Telegram

## Что сделано

Реализована система автоматического получения ID последнего поста из Telegram канала через API.

### Компоненты:

1. **Backend сервис** - `backend/app/services/telegram_service.py`
   - Получает последний пост через Telegram Bot API
   - Парсит RSS feed канала как fallback
   - Кэширует результаты

2. **API endpoint** - `/api/telegram/latest-post`
   - Возвращает ID последнего поста
   - Формат для виджета: `channel/post_id`

3. **Frontend** - `frontend/components/home/HeroSection.tsx`
   - Автоматически запрашивает последний пост при загрузке
   - Обновляет виджет с актуальным ID

## Настройка

### Способ 1: С Telegram Bot (Рекомендуется)

Этот способ позволяет получать посты через официальный API.

#### 1. Создай Telegram бота

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь команду `/newbot`
3. Следуй инструкциям (придумай имя и username)
4. Получи токен бота (выглядит как `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### 2. Добавь бота в канал

1. Открой настройки своего канала
2. Administrators → Add Administrator
3. Найди своего бота и добавь его
4. Дай права: "Post Messages" (минимум)

#### 3. Настрой .env

Добавь в `backend/.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_USERNAME=lesnayakomanda
```

#### 4. Перезапусти бэкенд

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Способ 2: Без бота (RSS парсинг)

Если не хочешь создавать бота, система автоматически использует RSS feed.

**Требования:**
- Канал должен быть публичным
- Имеет username (например, @lesnayakomanda)

**Настройка:**

Просто укажи username канала в `.env`:

```env
TELEGRAM_CHANNEL_USERNAME=lesnayakomanda
```

Бот токен можно не указывать - система автоматически переключится на RSS парсинг.

## Как это работает

### 1. При загрузке страницы:

```
Frontend → GET /api/telegram/latest-post → Backend
Backend → Telegram API / RSS → Получает последний пост
Backend → Возвращает ID поста
Frontend → Обновляет виджет с новым ID
```

### 2. Telegram Widget:

```tsx
<script data-telegram-post="lesnayakomanda/123" />
```

Автоматически показывает пост с ID 123.

## API Response

### Успешный ответ:

```json
{
  "success": true,
  "channel_username": "lesnayakomanda",
  "latest_post_id": 123,
  "widget_data": "lesnayakomanda/123"
}
```

### Ошибка:

```json
{
  "success": false,
  "error": "Bot token not configured",
  "channel_username": "lesnayakomanda",
  "latest_post_id": null,
  "widget_data": null
}
```

В случае ошибки фронтенд использует дефолтное значение.

## Методы получения поста

### Метод 1: Telegram Bot API (Приоритет)

```python
GET https://api.telegram.org/bot{TOKEN}/getUpdates
```

Получает последние обновления канала через бота.

**Плюсы:**
- Официальный API
- Надежно
- Быстро

**Минусы:**
- Требует создания бота
- Бот должен быть админом канала

### Метод 2: RSS Feed Parsing (Fallback)

```python
GET https://t.me/s/{CHANNEL_USERNAME}
```

Парсит HTML страницу канала и извлекает ID постов.

**Плюсы:**
- Не требует бота
- Работает для любого публичного канала

**Минусы:**
- Менее надежно (зависит от структуры HTML)
- Может быть медленнее

## Troubleshooting

### Виджет показывает "Post not found"

**Причины:**
1. Бот не настроен и RSS парсинг не работает
2. Канал приватный
3. Неправильный username канала

**Решение:**
1. Проверь что `TELEGRAM_CHANNEL_USERNAME` правильный
2. Проверь что канал публичный
3. Настрой бота (см. выше)

### API возвращает null

**Причины:**
1. Бот не админ канала
2. Неправильный токен бота
3. Канал не существует

**Решение:**
1. Проверь токен в `.env`
2. Убедись что бот добавлен в канал как админ
3. Проверь логи бэкенда: `docker logs backend`

### Виджет не обновляется

**Причины:**
1. Кэширование браузера
2. API не отвечает

**Решение:**
1. Очисти кэш браузера (Ctrl+Shift+R)
2. Проверь что бэкенд запущен
3. Открой DevTools → Network → проверь запрос к `/api/telegram/latest-post`

## Тестирование

### 1. Проверь API напрямую:

```bash
curl http://localhost:8000/api/telegram/latest-post
```

Должен вернуть JSON с `latest_post_id`.

### 2. Проверь в браузере:

Открой DevTools → Console:

```javascript
fetch('http://localhost:8000/api/telegram/latest-post')
  .then(r => r.json())
  .then(console.log)
```

### 3. Проверь виджет:

Открой главную страницу - виджет должен показать последний пост.

## Обновление поста

Виджет автоматически обновляется при:
- Перезагрузке страницы
- Первом заходе на сайт

Для автоматического обновления без перезагрузки можно добавить:

```tsx
// Обновлять каждые 5 минут
useEffect(() => {
  const interval = setInterval(fetchLatestPost, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
```

## Безопасность

- Токен бота хранится только на бэкенде
- Фронтенд получает только ID поста
- API публичный (не требует авторизации)
- Rate limiting применяется автоматически

## Альтернативы

Если не хочешь использовать API, можно:

1. **Вручную обновлять ID** в коде
2. **Использовать виджет канала** вместо поста:
   ```tsx
   <script data-telegram-discussion="lesnayakomanda" />
   ```
3. **Встроить iframe** напрямую:
   ```tsx
   <iframe src="https://t.me/lesnayakomanda" />
   ```
