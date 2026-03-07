# ✅ TASK 14: Swagger документация API

**Дата завершения:** 2026-03-07  
**Статус:** ✅ Выполнено  
**Приоритет:** 🟢 Низкий

---

## 📋 Что было сделано

### 1. Расширенная конфигурация FastAPI
Обновлен `backend/app/main.py` с полной документацией:

- ✅ Подробное описание API с markdown форматированием
- ✅ Список основных возможностей
- ✅ Инструкции по аутентификации
- ✅ Информация об окружениях (production/development)
- ✅ Контактная информация и ссылки
- ✅ Метаданные тегов для группировки эндпоинтов

### 2. Настройка Swagger UI
```python
app = FastAPI(
    title="Лесная Команда API",
    description="...",  # Полное markdown описание
    version="1.0.0",
    docs_url="/api/docs",        # Swagger UI
    redoc_url="/api/redoc",      # ReDoc альтернатива
    openapi_url="/api/openapi.json",  # OpenAPI схема
    contact={...},
    license_info={...},
    tags_metadata=[...]  # Описания для каждого тега
)
```

### 3. Теги для группировки эндпоинтов
Созданы описания для 7 групп эндпоинтов:

- **users** - Операции с пользователями
- **auth** - Аутентификация и авторизация
- **discord** - Discord OAuth интеграция
- **profile** - Управление профилем
- **content** - Публичный контент
- **game_preferences** - Игровые предпочтения
- **migration** - Временные эндпоинты миграции

### 4. Улучшенные Pydantic модели
Добавлены примеры и описания в `backend/app/schemas.py`:

```python
class UserLogin(BaseModel):
    username: str = Field(
        ..., 
        description="Имя пользователя", 
        examples=["LesnoyBOSS"]
    )
    password: str = Field(
        ..., 
        description="Пароль", 
        examples=["LesnoyBOSS909!"]
    )

class Token(BaseModel):
    access_token: str = Field(
        ..., 
        description="JWT токен доступа",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
    )
    token_type: str = Field(
        default="bearer",
        description="Тип токена",
        examples=["bearer"]
    )

class ProfileUpdate(BaseModel):
    site_nickname: Optional[str] = Field(
        None,
        max_length=50,
        description="Никнейм на сайте",
        examples=["Лесной Волк"]
    )
    bio: Optional[str] = Field(
        None,
        max_length=500,
        description="Биография пользователя",
        examples=["Играю в CS2 и Dota 2. Люблю командную игру!"]
    )
    # ...
```

### 5. Подробные docstrings для эндпоинтов
Обновлены описания в `backend/app/routes/`:

**users.py:**
```python
@router.get("/stats", response_model=dict)
async def get_stats(db: asyncpg.Connection = Depends(get_db)):
    """
    Сводная статистика для главной страницы
    
    Возвращает общую статистику сообщества:
    - Количество участников
    - Количество игроков онлайн в Discord
    - Общее количество достижений
    
    **Не требует аутентификации**
    
    **Пример ответа:**
    ```json
    {
        "members": 150,
        "online": 23,
        "achievements": 487
    }
    ```
    """
```

**auth.py:**
```python
@router.post("/token", response_model=Token)
async def login_for_access_token(...):
    """
    Получение JWT токена доступа
    
    Аутентификация администратора для получения токена доступа.
    Токен используется для доступа к защищенным эндпоинтам.
    
    **Учетные данные по умолчанию:**
    - Username: `LesnoyBOSS`
    - Password: `LesnoyBOSS909!`
    
    **Использование токена:**
    ```
    Authorization: Bearer <access_token>
    ```
    """
```

---

## 🌐 Доступ к документации

### Swagger UI (интерактивная документация)
```
http://localhost:8000/api/docs
```

**Возможности:**
- Просмотр всех эндпоинтов
- Тестирование API прямо в браузере
- Автоматическая генерация примеров запросов
- Авторизация через JWT токен
- Просмотр схем данных

### ReDoc (альтернативная документация)
```
http://localhost:8000/api/redoc
```

**Возможности:**
- Более читаемый формат
- Удобная навигация
- Поиск по эндпоинтам
- Экспорт в PDF

### OpenAPI JSON схема
```
http://localhost:8000/api/openapi.json
```

**Использование:**
- Генерация клиентских SDK
- Импорт в Postman/Insomnia
- Автоматическое тестирование
- Интеграция с другими инструментами

---

## 📊 Структура API

### Публичные эндпоинты (без аутентификации)

#### Users
- `GET /api/` - Статус API
- `GET /api/stats` - Общая статистика
- `GET /api/players` - Список игроков
- `GET /api/players/{discord_id}` - Профиль игрока
- `GET /api/discord/overview` - Discord сводка
- `GET /api/discord/top/messages` - Топ по сообщениям
- `GET /api/discord/top/voice` - Топ по голосовым каналам
- `GET /api/discord/now-playing` - Кто во что играет

#### Content
- `GET /api/events` - Список событий
- `GET /api/news` - Список новостей
- `GET /api/feed` - Лента активности
- `GET /api/settings/common` - Общие настройки

#### Profile (публичные)
- `GET /api/profile/public/{discord_id}` - Публичный профиль

### Защищенные эндпоинты (требуют JWT токен)

#### Auth
- `POST /api/token` - Получить токен (логин)
- `GET /api/me` - Текущий пользователь
- `GET /api/protected` - Тестовый защищенный эндпоинт

#### Profile (приватные)
- `GET /api/profile` - Мой профиль
- `PUT /api/profile` - Обновить профиль
- `POST /api/profile/avatar` - Загрузить аватар

#### Game Preferences
- `GET /game-preferences` - Получить предпочтения
- `POST /game-preferences` - Сохранить предпочтения
- `GET /game-preferences/statistics` - Статистика по играм

### Админские эндпоинты (требуют роль admin)

#### Auth
- `POST /api/register` - Регистрация пользователя
- `GET /api/admin-only` - Тестовый админский эндпоинт

#### Users
- `POST /api/update-rating` - Обновить рейтинги

### WebSocket

- `WS /ws/discord?token=<jwt>` - Real-time Discord статус

---

## 🔐 Аутентификация в Swagger UI

### Шаг 1: Получить токен
1. Открыть `http://localhost:8000/api/docs`
2. Найти эндпоинт `POST /api/token`
3. Нажать "Try it out"
4. Ввести учетные данные:
   ```json
   {
     "username": "LesnoyBOSS",
     "password": "LesnoyBOSS909!"
   }
   ```
5. Нажать "Execute"
6. Скопировать `access_token` из ответа

### Шаг 2: Авторизоваться
1. Нажать кнопку "Authorize" вверху страницы
2. Вставить токен в поле `Value`:
   ```
   Bearer <ваш_токен>
   ```
3. Нажать "Authorize"
4. Теперь можно тестировать защищенные эндпоинты

---

## 📝 Примеры использования

### Пример 1: Получить статистику
```bash
curl http://localhost:8000/api/stats
```

**Ответ:**
```json
{
  "members": 150,
  "online": 23,
  "achievements": 487
}
```

### Пример 2: Получить токен
```bash
curl -X POST http://localhost:8000/api/token \
  -H "Content-Type: application/json" \
  -d '{"username":"LesnoyBOSS","password":"LesnoyBOSS909!"}'
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Пример 3: Получить свой профиль
```bash
curl http://localhost:8000/api/profile \
  -H "Authorization: Bearer <ваш_токен>"
```

**Ответ:**
```json
{
  "discord_id": 123456789,
  "site_nickname": "Лесной Волк",
  "discord_username": "JaK1L",
  "avatar_url": "https://...",
  "bio": "Играю в CS2",
  "is_hidden": false,
  "forest_rank": "🐺 Старый Волк",
  "rating": 95.0
}
```

### Пример 4: Обновить профиль
```bash
curl -X PUT http://localhost:8000/api/profile \
  -H "Authorization: Bearer <ваш_токен>" \
  -H "Content-Type: application/json" \
  -d '{
    "site_nickname": "Новый Ник",
    "bio": "Обновленная биография",
    "is_hidden": false
  }'
```

---

## 🎨 Особенности документации

### Автоматическая генерация
- Схемы данных генерируются из Pydantic моделей
- Примеры запросов/ответов создаются автоматически
- Валидация параметров из Field() описаний

### Интерактивность
- Тестирование API без Postman
- Автозаполнение примеров
- Валидация данных в реальном времени
- Копирование curl команд

### Группировка
- Эндпоинты сгруппированы по тегам
- Каждая группа имеет описание
- Удобная навигация по разделам

### Безопасность
- Поддержка JWT Bearer токенов
- Кнопка Authorize для всех защищенных эндпоинтов
- Автоматическое добавление заголовков

---

## 🚀 Следующие шаги

### Дополнительные улучшения (опционально)

1. **Добавить примеры ошибок:**
   ```python
   @router.get("/players/{discord_id}")
   async def get_player(...):
       """
       ...
       
       **Возможные ошибки:**
       - 404: Игрок не найден
       - 500: Ошибка сервера
       """
   ```

2. **Версионирование API:**
   ```python
   app = FastAPI(
       title="Лесная Команда API",
       version="1.0.0",
       # В будущем: v2, v3
   )
   ```

3. **Rate limiting документация:**
   ```python
   @router.get("/players")
   async def get_players(...):
       """
       ...
       
       **Rate Limits:**
       - 100 запросов в минуту
       - 1000 запросов в час
       """
   ```

4. **Webhooks документация:**
   Если добавятся webhooks, документировать их в OpenAPI

5. **Postman коллекция:**
   Экспортировать OpenAPI схему в Postman коллекцию

---

## 📚 Полезные ссылки

### FastAPI документация
- [OpenAPI Support](https://fastapi.tiangolo.com/tutorial/metadata/)
- [Response Models](https://fastapi.tiangolo.com/tutorial/response-model/)
- [Schema Extra](https://fastapi.tiangolo.com/tutorial/schema-extra-example/)

### OpenAPI спецификация
- [OpenAPI 3.0 Spec](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [ReDoc](https://github.com/Redocly/redoc)

### Инструменты
- [Swagger Editor](https://editor.swagger.io/) - редактор OpenAPI
- [Postman](https://www.postman.com/) - тестирование API
- [Insomnia](https://insomnia.rest/) - альтернатива Postman

---

## ✅ Чеклист завершения

- [x] Расширенное описание API в FastAPI
- [x] Настройка Swagger UI и ReDoc
- [x] Метаданные тегов для группировки
- [x] Примеры в Pydantic моделях
- [x] Подробные docstrings для эндпоинтов
- [x] Инструкции по аутентификации
- [x] Примеры использования API
- [x] Документация доступна по `/api/docs`
- [x] OpenAPI схема доступна по `/api/openapi.json`

---

**Задача полностью завершена! ✅**

Swagger документация настроена и доступна. Все эндпоинты документированы с примерами и описаниями.

**Доступ к документации:**
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- OpenAPI JSON: http://localhost:8000/api/openapi.json
