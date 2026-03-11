# Интеграция Twitch API для стримеров

## Обзор

Система полностью интегрирована с Twitch API. Теперь для добавления стримера достаточно просто вставить ссылку на его Twitch канал, и вся информация будет получена автоматически.

## Что получается автоматически

При добавлении стримера через ссылку на Twitch, система автоматически получает:

- ✅ **Username** - уникальный идентификатор на Twitch
- ✅ **Display Name** - отображаемое имя стримера
- ✅ **Avatar** - аватар профиля
- ✅ **Description** - описание канала
- ✅ **Live статус** - онлайн ли стример сейчас
- ✅ **Игра** - в какую игру играет (если онлайн)
- ✅ **Название стрима** - текущее название трансляции
- ✅ **Количество зрителей** - сколько смотрят сейчас

## Миграция базы данных

### Вариант 1: Автоматическая миграция (рекомендуется)

```bash
cd backend
python recreate_streamers_table.py
```

⚠️ **ВНИМАНИЕ**: Это удалит существующую таблицу streamers!

### Вариант 2: Ручная миграция через SQL

Выполните SQL из файла `backend/migrate_streamers_simple.sql` в вашей базе данных.

## Новая структура таблицы

```sql
CREATE TABLE streamers (
    id SERIAL PRIMARY KEY,
    twitch_username VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Использование в админке

### Добавление стримера

1. Откройте админку → Стримеры
2. Нажмите "Добавить"
3. Вставьте ссылку на Twitch канал:
   - `https://twitch.tv/username`
   - `twitch.tv/username`
   - или просто `username`
4. Нажмите "Добавить стримера"

Система автоматически:
- Проверит существование канала на Twitch
- Получит всю информацию о стримере
- Сохранит в базу данных
- Покажет текущий статус (онлайн/оффлайн)

### Обновление данных

При редактировании стримера система снова обращается к Twitch API и обновляет все данные.

## API Endpoints

### Админские эндпоинты

#### GET `/api/admin/streamers`
Получить список всех стримеров с актуальными данными о стримах.

**Response:**
```json
[
  {
    "id": 1,
    "twitch_username": "jak1lqa",
    "display_name": "JaK1L",
    "avatar_url": "https://...",
    "description": "Описание канала",
    "is_active": true,
    "display_order": 0,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00",
    "is_live": true,
    "game_name": "Counter-Strike 2",
    "stream_title": "Играем в CS2!",
    "viewer_count": 150
  }
]
```

#### POST `/api/admin/streamers`
Добавить нового стримера.

**Request:**
```json
{
  "twitch_url": "https://twitch.tv/username",
  "is_active": true,
  "display_order": 0
}
```

#### PUT `/api/admin/streamers/{id}`
Обновить стримера (обновляет данные из Twitch API).

**Request:**
```json
{
  "twitch_url": "https://twitch.tv/username",
  "is_active": true,
  "display_order": 0
}
```

#### DELETE `/api/admin/streamers/{id}`
Удалить стримера.

### Публичные эндпоинты

#### GET `/api/streamers`
Получить список активных стримеров с live-данными.

**Response:**
```json
[
  {
    "id": 1,
    "twitch_username": "jak1lqa",
    "display_name": "JaK1L",
    "avatar_url": "https://...",
    "description": "Описание",
    "stream_url": "https://twitch.tv/jak1lqa",
    "is_live": true,
    "game_name": "Counter-Strike 2",
    "stream_title": "Играем в CS2!",
    "viewer_count": 150,
    "thumbnail_url": "https://..."
  }
]
```

## Twitch API Service

Сервис находится в `backend/app/services/twitch_service.py`.

### Основные методы

#### `extract_username_from_url(url: str) -> Optional[str]`
Извлекает username из различных форматов URL:
- `https://twitch.tv/username` → `username`
- `twitch.tv/username` → `username`
- `username` → `username`

#### `get_full_streamer_info(twitch_url: str) -> Optional[dict]`
Получает полную информацию о стримере:
```python
{
    'username': 'jak1lqa',
    'display_name': 'JaK1L',
    'avatar_url': 'https://...',
    'description': 'Описание канала',
    'is_live': True,
    'game': 'Counter-Strike 2',
    'viewer_count': 150,
    'stream_title': 'Играем в CS2!',
    'thumbnail_url': 'https://...'
}
```

#### `get_streams(usernames: List[str]) -> Dict[str, dict]`
Получает информацию о стримах для списка пользователей.

## Настройка Twitch API

### 1. Получение Client ID и Secret

1. Перейдите на https://dev.twitch.tv/console
2. Создайте новое приложение
3. Получите Client ID и Client Secret

### 2. Настройка .env

```env
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here
```

### 3. Проверка работы

```bash
cd backend
python -c "from app.services.twitch_service import twitch_service; import asyncio; print(asyncio.run(twitch_service.get_full_streamer_info('jak1lqa')))"
```

## Отображение на фронтенде

### Компонент стримера

Стримеры отображаются с:
- Аватаром (с фиолетовой рамкой если онлайн)
- Индикатором LIVE (красный бейдж)
- Количеством зрителей
- Текущей игрой и названием стрима
- Ссылкой на канал

### Пример использования

```typescript
const streamers = await fetch('/api/streamers').then(r => r.json())

streamers.map(streamer => (
  <div>
    <img src={streamer.avatar_url} />
    <h3>{streamer.display_name}</h3>
    {streamer.is_live && (
      <span>🔴 LIVE - {streamer.viewer_count} viewers</span>
    )}
    {streamer.is_live && (
      <div>
        <strong>{streamer.game_name}</strong>
        <p>{streamer.stream_title}</p>
      </div>
    )}
  </div>
))
```

## Кэширование

Twitch API токены кэшируются автоматически:
- Токен действителен ~1 час
- Автоматически обновляется при истечении
- Не требует ручного управления

## Лимиты API

Twitch API имеет следующие лимиты:
- 800 запросов в минуту для большинства эндпоинтов
- Можно запрашивать до 100 стримов за раз

Текущая реализация оптимизирована и не превышает лимиты.

## Troubleshooting

### Ошибка "Стример не найден на Twitch"

Проверьте:
1. Правильность написания username
2. Существует ли канал на Twitch
3. Не забанен ли канал

### Ошибка "Failed to get Twitch token"

Проверьте:
1. Правильность TWITCH_CLIENT_ID и TWITCH_CLIENT_SECRET в .env
2. Активно ли приложение в Twitch Developer Console
3. Доступен ли Twitch API (проверьте статус на https://status.twitch.tv)

### Стримеры не показывают live-статус

Проверьте:
1. Логи бэкенда на наличие ошибок Twitch API
2. Правильность twitch_username в базе данных
3. Онлайн ли стример на самом деле

## Дальнейшие улучшения

Возможные улучшения системы:

1. **WebSocket обновления** - real-time обновление статуса стримов
2. **Уведомления** - оповещения когда стример выходит в эфир
3. **Статистика** - история стримов, средняя длительность, пиковые зрители
4. **Клипы** - интеграция с Twitch Clips API
5. **Расписание** - автоматическое получение расписания стримов
6. **Категории** - группировка стримеров по играм

## Заключение

Новая система стримеров полностью автоматизирована и не требует ручного ввода данных. Все что нужно - это ссылка на Twitch канал, остальное система сделает сама!
