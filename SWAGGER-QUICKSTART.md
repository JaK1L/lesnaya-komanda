# 🚀 Swagger API Documentation - Quick Start

## Запуск backend сервера

### Вариант 1: Через uvicorn (рекомендуется)
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Вариант 2: Через main.py
```bash
cd backend
python -m app.main
```

### Вариант 3: С виртуальным окружением
```bash
cd backend
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
python -m uvicorn app.main:app --reload
```

---

## 📖 Доступ к документации

После запуска сервера откройте в браузере:

### Swagger UI (интерактивная документация)
```
http://localhost:8000/api/docs
```

**Что можно делать:**
- ✅ Просматривать все эндпоинты
- ✅ Тестировать API прямо в браузере
- ✅ Смотреть примеры запросов/ответов
- ✅ Авторизоваться через JWT токен
- ✅ Копировать curl команды

### ReDoc (альтернативная документация)
```
http://localhost:8000/api/redoc
```

**Преимущества:**
- ✅ Более читаемый формат
- ✅ Удобная навигация
- ✅ Поиск по эндпоинтам
- ✅ Экспорт в PDF

### OpenAPI JSON схема
```
http://localhost:8000/api/openapi.json
```

**Использование:**
- Импорт в Postman/Insomnia
- Генерация клиентских SDK
- Автоматическое тестирование

---

## 🔐 Тестирование с аутентификацией

### Шаг 1: Получить JWT токен

1. Откройте Swagger UI: http://localhost:8000/api/docs
2. Найдите раздел **auth** → `POST /api/token`
3. Нажмите **"Try it out"**
4. Введите учетные данные:
   ```json
   {
     "username": "LesnoyBOSS",
     "password": "LesnoyBOSS909!"
   }
   ```
5. Нажмите **"Execute"**
6. Скопируйте `access_token` из ответа

### Шаг 2: Авторизоваться в Swagger

1. Нажмите кнопку **"Authorize"** 🔓 вверху страницы
2. В поле `Value` вставьте:
   ```
   Bearer <ваш_скопированный_токен>
   ```
3. Нажмите **"Authorize"**
4. Нажмите **"Close"**

### Шаг 3: Тестировать защищенные эндпоинты

Теперь можно тестировать любые защищенные эндпоинты:
- `GET /api/me` - информация о текущем пользователе
- `GET /api/profile` - ваш профиль
- `PUT /api/profile` - обновить профиль
- `POST /api/profile/avatar` - загрузить аватар

---

## 📝 Примеры тестирования

### Пример 1: Публичный эндпоинт (без токена)

**Эндпоинт:** `GET /api/stats`

1. Найдите в разделе **users**
2. Нажмите **"Try it out"**
3. Нажмите **"Execute"**
4. Смотрите ответ:
   ```json
   {
     "members": 5,
     "online": 0,
     "achievements": 5
   }
   ```

### Пример 2: Получить список игроков

**Эндпоинт:** `GET /api/players`

**Параметры:**
- `limit`: 10 (количество игроков)
- `offset`: 0 (смещение)

**Ответ:**
```json
[
  {
    "discord_id": 123456789,
    "discord_username": "JaK1L",
    "forest_rank": "🐺 Старый Волк",
    "rating": 95.0,
    "avatar_url": "https://..."
  }
]
```

### Пример 3: Обновить профиль (требует токен)

**Эндпоинт:** `PUT /api/profile`

**Тело запроса:**
```json
{
  "site_nickname": "Лесной Волк",
  "bio": "Играю в CS2 и Dota 2. Люблю командную игру!",
  "is_hidden": false
}
```

**Ответ:**
```json
{
  "discord_id": 123456789,
  "site_nickname": "Лесной Волк",
  "discord_username": "JaK1L",
  "bio": "Играю в CS2 и Dota 2. Люблю командную игру!",
  "is_hidden": false,
  "forest_rank": "🐺 Старый Волк",
  "rating": 95.0
}
```

---

## 🎯 Группы эндпоинтов

### 👥 users - Пользователи
- `GET /api/` - Статус API
- `GET /api/stats` - Общая статистика
- `GET /api/players` - Список игроков
- `GET /api/players/{discord_id}` - Профиль игрока
- `GET /api/discord/overview` - Discord сводка
- `GET /api/discord/top/messages` - Топ по сообщениям
- `GET /api/discord/top/voice` - Топ по голосовым каналам
- `GET /api/discord/now-playing` - Кто во что играет

### 🔐 auth - Аутентификация
- `POST /api/token` - Получить JWT токен
- `POST /api/register` - Регистрация (только админ)
- `GET /api/me` - Текущий пользователь
- `GET /api/protected` - Тестовый защищенный эндпоинт
- `GET /api/admin-only` - Тестовый админский эндпоинт

### 👤 profile - Профиль
- `GET /api/profile/public/{discord_id}` - Публичный профиль
- `GET /api/profile` - Мой профиль (требует токен)
- `PUT /api/profile` - Обновить профиль (требует токен)
- `POST /api/profile/avatar` - Загрузить аватар (требует токен)
- `GET /api/uploads/avatars/{filename}` - Получить аватар

### 📰 content - Контент
- `GET /api/events` - Список событий
- `GET /api/news` - Список новостей
- `GET /api/feed` - Лента активности
- `GET /api/settings/common` - Общие настройки

### 🎮 game_preferences - Игровые предпочтения
- `GET /game-preferences` - Получить предпочтения (требует токен)
- `POST /game-preferences` - Сохранить предпочтения (требует токен)
- `GET /game-preferences/statistics` - Статистика по играм

### 🔄 migration - Миграция
- Временные эндпоинты для миграции данных

---

## 🛠️ Использование с другими инструментами

### Postman

1. Откройте Postman
2. Нажмите **Import**
3. Вставьте URL: `http://localhost:8000/api/openapi.json`
4. Нажмите **Import**
5. Коллекция готова к использованию!

### Insomnia

1. Откройте Insomnia
2. Нажмите **Create** → **Import From** → **URL**
3. Вставьте: `http://localhost:8000/api/openapi.json`
4. Нажмите **Fetch and Import**

### curl

Скопируйте curl команду прямо из Swagger UI:
```bash
curl -X GET "http://localhost:8000/api/stats" -H "accept: application/json"
```

---

## ❓ Частые вопросы

### Q: Как получить токен для тестирования?
A: Используйте эндпоинт `POST /api/token` с учетными данными:
- Username: `LesnoyBOSS`
- Password: `LesnoyBOSS909!`

### Q: Почему эндпоинт возвращает 401 Unauthorized?
A: Эндпоинт требует аутентификации. Получите токен и нажмите кнопку "Authorize" в Swagger UI.

### Q: Как загрузить файл (аватар)?
A: В Swagger UI найдите `POST /api/profile/avatar`, нажмите "Try it out", выберите файл и нажмите "Execute".

### Q: Где посмотреть схему данных?
A: В Swagger UI прокрутите вниз до раздела "Schemas" или откройте ReDoc.

### Q: Как экспортировать документацию?
A: Откройте `http://localhost:8000/api/openapi.json` и сохраните JSON файл.

---

## 🎓 Полезные ссылки

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [ReDoc](https://github.com/Redocly/redoc)

---

**Готово! Теперь можно тестировать API через удобный веб-интерфейс! 🚀**
