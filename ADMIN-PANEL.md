# 🎨 Админ-панель

Полное руководство по использованию админ-панели "Лесная Команда".

## 📋 Содержание

1. [Доступ к админ-панели](#доступ-к-админ-панели)
2. [Управление новостями](#управление-новостями)
3. [Управление событиями](#управление-событиями)
4. [Управление лентой](#управление-лентой)
5. [Настройки сайта](#настройки-сайта)
6. [API документация](#api-документация)

---

## Доступ к админ-панели

### URL

- **Production**: https://lesnaya-komanda.vercel.app/admin
- **Development**: http://localhost:3000/admin

### Учетные данные

```
Логин: LesnoyBOSS
Пароль: LesnoyBOSS909!
```

### Вход

1. Открыть `/admin`
2. Ввести логин и пароль
3. Нажать "Войти"
4. Токен сохраняется в localStorage

### Выход

Нажать кнопку "Выйти" в правом верхнем углу.

---

## Управление новостями

### Создание новости

1. Перейти в раздел "📰 Новости"
2. Нажать "+ Добавить"
3. Заполнить форму:
   - **Заголовок** (до 200 символов)
   - **Содержание** (до 5000 символов)
   - **Опубликовать сразу** (чекбокс)
4. Нажать "Создать новость"

### Просмотр новостей

Все новости отображаются списком с:
- Заголовком
- Содержанием
- Статусом (Опубликовано / Черновик)
- Датой создания

### Удаление новости

1. Найти новость в списке
2. Нажать 🗑️
3. Подтвердить удаление

### Примеры новостей

```
Заголовок: Открытие сезона 2026
Содержание: Стартует новый сезон турниров! Регистрация открыта для всех желающих. Призовой фонд - 50,000 рублей.
Опубликовать: ✓

Заголовок: CS2 турнир - результаты
Содержание: Поздравляем команду "Лесные Волки" с победой в турнире! Финальный счет 16:14.
Опубликовать: ✓
```

---

## Управление событиями

### Создание события

1. Перейти в раздел "📅 События"
2. Нажать "+ Добавить"
3. Заполнить форму:
   - **Название события** (до 200 символов)
   - **Описание** (до 2000 символов)
   - **Игра** (выбрать из списка)
   - **Дата и время** (datetime picker)
   - **Статус** (выбрать из списка)
4. Нажать "Создать событие"

### Игры

- Общее
- CS2
- Dota 2
- Valorant
- PUBG
- Apex Legends

### Статусы событий

- **Планируется** - событие в планах
- **Регистрация открыта** - можно регистрироваться
- **Идет сейчас** - событие проходит прямо сейчас
- **Завершено** - событие закончилось
- **Отменено** - событие отменено

### Просмотр событий

События отображаются с:
- Названием
- Описанием
- Игрой
- Датой и временем
- Статусом

### Удаление события

1. Найти событие в списке
2. Нажать 🗑️
3. Подтвердить удаление

### Примеры событий

```
Название: CS2 Турнир 5v5
Описание: Командный турнир по CS2. Призовой фонд 10,000 руб. Регистрация до 15 марта.
Игра: CS2
Дата: 2026-03-20 18:00
Статус: Регистрация открыта

Название: Dota 2 Инхаус
Описание: Дружеские матчи внутри команды. Все желающие приглашаются!
Игра: Dota 2
Дата: 2026-03-15 19:00
Статус: Планируется
```

---

## Управление лентой

Лента активности отображается на главной странице сайта.

### Типы записей

1. **📝 Пост** - обычная запись (новость, объявление)
2. **🏆 Достижение** - достижение игрока или команды

### Создание записи

1. Перейти в раздел "📝 Лента"
2. Нажать "+ Добавить"
3. Заполнить форму:
   - **Тип записи** (Пост / Достижение)
   - **Заголовок** (до 200 символов)
   - **Описание** (до 2000 символов, необязательно)
4. Нажать "Создать запись"

### Просмотр ленты

Записи отображаются с:
- Типом (Пост / Достижение)
- Заголовком
- Описанием (если есть)
- Датой и временем

### Удаление записи

1. Найти запись в списке
2. Нажать 🗑️
3. Подтвердить удаление

### Примеры записей

**Пост:**
```
Тип: 📝 Пост
Заголовок: Новый рекорд сервера!
Описание: Команда "Лесные Волки" установила новый рекорд скорости прохождения карты - 2:34!
```

**Достижение:**
```
Тип: 🏆 Достижение
Заголовок: JaK1L получил достижение "Мастер CS2"
Описание: 1000 побед в рейтинговых матчах!
```

---

## Настройки сайта

### Общие настройки

#### Ссылка на Discord сервер

URL приглашения на Discord сервер. Используется на всем сайте.

```
Пример: https://discord.gg/YgX4RQZ
```

#### Режим технического обслуживания

Когда включен, сайт показывает сообщение о техническом обслуживании вместо обычного контента.

**Использование:**
1. Включить чекбокс "Режим технического обслуживания"
2. Ввести сообщение (необязательно)
3. Нажать "Сохранить настройки"

**Пример сообщения:**
```
Сайт временно недоступен. Ведутся технические работы.
Ожидаемое время восстановления: 2 часа.
```

### Информация

Отображает:
- Версию сайта
- URL API
- Окружение (development/production)

---

## API документация

### Аутентификация

Все эндпоинты требуют JWT токен в заголовке:

```bash
Authorization: Bearer <your_token>
```

### Получение токена

```bash
POST /api/token
Content-Type: application/x-www-form-urlencoded

username=LesnoyBOSS&password=LesnoyBOSS909!
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Новости

#### Получить все новости

```bash
GET /api/admin/news
Authorization: Bearer <token>
```

**Ответ:**
```json
[
  {
    "id": 1,
    "title": "Открытие сезона 2026",
    "content": "Стартует новый сезон...",
    "author_id": 1,
    "published": true,
    "created_at": "2026-03-07T12:00:00",
    "updated_at": null
  }
]
```

#### Создать новость

```bash
POST /api/admin/news
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Заголовок",
  "content": "Содержание",
  "published": true
}
```

#### Удалить новость

```bash
DELETE /api/admin/news/{news_id}
Authorization: Bearer <token>
```

### События

#### Получить все события

```bash
GET /api/admin/events
Authorization: Bearer <token>
```

**Ответ:**
```json
[
  {
    "id": 1,
    "title": "CS2 Турнир",
    "description": "Командный турнир...",
    "game": "CS2",
    "event_date": "2026-03-20T18:00:00",
    "created_by": 1,
    "participants": [],
    "status": "Регистрация открыта"
  }
]
```

#### Создать событие

```bash
POST /api/admin/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "CS2 Турнир",
  "description": "Описание",
  "game": "CS2",
  "event_date": "2026-03-20T18:00:00",
  "status": "Планируется"
}
```

#### Удалить событие

```bash
DELETE /api/admin/events/{event_id}
Authorization: Bearer <token>
```

### Лента

#### Получить всю ленту

```bash
GET /api/admin/feed
Authorization: Bearer <token>

# Фильтр по типу (необязательно)
GET /api/admin/feed?kind=post
GET /api/admin/feed?kind=achievement
```

**Ответ:**
```json
[
  {
    "id": 1,
    "kind": "post",
    "title": "Новый рекорд!",
    "content": "Описание...",
    "created_at": "2026-03-07T12:00:00"
  }
]
```

#### Создать запись

```bash
POST /api/admin/feed
Authorization: Bearer <token>
Content-Type: application/json

{
  "kind": "post",
  "title": "Заголовок",
  "content": "Описание"
}
```

#### Удалить запись

```bash
DELETE /api/admin/feed/{feed_id}
Authorization: Bearer <token>
```

### Настройки

#### Получить настройки

```bash
GET /api/admin/settings/common
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "discord_join_url": "https://discord.gg/YgX4RQZ",
  "maintenance_enabled": false,
  "maintenance_message": null
}
```

#### Обновить настройки

```bash
PUT /api/admin/settings/common
Authorization: Bearer <token>
Content-Type: application/json

{
  "discord_join_url": "https://discord.gg/YgX4RQZ",
  "maintenance_enabled": false,
  "maintenance_message": null
}
```

---

## Swagger UI

Полная интерактивная документация API доступна по адресу:

- **Production**: https://your-backend.onrender.com/api/docs
- **Development**: http://localhost:8000/api/docs

В Swagger UI можно:
- Просмотреть все эндпоинты
- Протестировать запросы
- Посмотреть схемы данных
- Авторизоваться с токеном

---

## Безопасность

### Смена пароля

Для смены пароля админа нужно обновить запись в базе данных:

```python
# backend/change_admin_password.py
import asyncio
from app.database import database
from app.auth import get_password_hash

async def change_password():
    await database.connect()
    
    new_password = "NewSecurePassword123!"
    password_hash = get_password_hash(new_password)
    
    async with database.get_connection() as conn:
        await conn.execute(
            "UPDATE admin_users SET password_hash = $1 WHERE username = 'LesnoyBOSS'",
            password_hash
        )
    
    print("Пароль изменен!")
    await database.disconnect()

asyncio.run(change_password())
```

### Добавление нового админа

```python
# backend/add_admin.py
import asyncio
from app.database import database
from app.auth import get_password_hash

async def add_admin():
    await database.connect()
    
    username = "NewAdmin"
    password = "SecurePassword123!"
    role = "editor"  # или "admin"
    
    password_hash = get_password_hash(password)
    
    async with database.get_connection() as conn:
        await conn.execute(
            "INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, $3)",
            username, password_hash, role
        )
    
    print(f"Админ {username} создан!")
    await database.disconnect()

asyncio.run(add_admin())
```

### Роли

- **admin** - полный доступ ко всем функциям
- **editor** - доступ к управлению контентом (новости, события, лента)

---

## Troubleshooting

### Не могу войти

1. Проверить логин и пароль
2. Проверить что backend запущен
3. Проверить CORS настройки в backend
4. Посмотреть ошибки в Console (F12)

### Токен истек

Токен действителен 30 дней. После истечения нужно войти заново.

### Не сохраняются изменения

1. Проверить что токен валидный
2. Проверить подключение к базе данных
3. Посмотреть логи backend
4. Проверить Network tab в DevTools

### Ошибка 401 Unauthorized

Токен невалидный или истек. Выйти и войти заново.

### Ошибка 403 Forbidden

У пользователя нет прав на это действие. Проверить роль в базе данных.

---

## Roadmap

### Планируется добавить

- [ ] Редактирование новостей и событий
- [ ] Загрузка изображений
- [ ] Управление пользователями
- [ ] Статистика и аналитика
- [ ] Модерация комментариев
- [ ] История изменений
- [ ] Множественное удаление
- [ ] Экспорт данных
- [ ] Предпросмотр перед публикацией

---

## Поддержка

Если возникли проблемы:
1. Проверить [Troubleshooting](#troubleshooting)
2. Посмотреть логи backend
3. Создать [Issue на GitHub](https://github.com/JaK1L/lesnaya-komanda/issues)
4. Написать в Discord

---

**Последнее обновление:** 07.03.2026  
**Версия:** 1.0.0

