# Система Опыта и Поинтов - Лесная Команда

## Обзор

Система опыта и поинтов создана для мотивации игроков и создания живого сообщества. Две валюты работают параллельно:

- **Опыт (XP)** - для повышения уровня и ранга
- **Поинты** - для покупки плюшек и привилегий

## Формула расчета уровней

Для достижения следующего уровня требуется:
```
XP для уровня N = N × 100
```

Примеры:
- Уровень 1 → 2: 100 XP
- Уровень 5 → 6: 500 XP
- Уровень 10 → 11: 1000 XP

## Начисление Опыта

### Игровая активность

| Действие | Опыт | Условия |
|----------|------|---------|
| 30 минут в голосовом канале | +10 XP | Во время игры (CS2, Dota 2, Valorant) |
| Победа в катке | +5 XP | В команде с кем-то из "Леса" |

### Жизнь в чате

| Действие | Опыт | Условия |
|----------|------|---------|
| Сообщение в текстовом канале | +1 XP | Максимум 20 XP в день |
| Помощь новичку | +3 XP | Ставится реакцией от новичка |

### Участие в тусовке

| Действие | Опыт | Бонус |
|----------|------|-------|
| Участие в ивенте/турнире | +15 XP | - |
| Победа в турнире | +50 XP | +50 поинтов |
| Организация игры (5+ человек) | +20 XP | - |

## Начисление Поинтов

### Уникальные действия

| Действие | Поинты |
|----------|--------|
| Киллтейп в спец-канале | +5 |
| Стрим с упоминанием сервера | +10 |
| Приведенный друг (до 3 ранга) | +25 |
| Победа в турнире | +50 |

## Траты Поинтов

### Магазин привилегий

| Товар | Стоимость | Длительность |
|-------|-----------|--------------|
| Смена ника в Discord | 100 поинтов | 1 месяц |
| Кастомная цветная роль | 150 поинтов | 1 месяц |
| Выделенный слот для игры | 200 поинтов | Разовая |
| Вход в закрытый турнир | 50 поинтов | Разовая |
| Предложить название ивента | 50 поинтов | Разовая |

## API Endpoints

### Для админов

#### Добавить опыт
```http
POST /api/xp/add-xp
Authorization: Bearer {admin_token}

{
  "discord_id": 123456789,
  "type": "xp",
  "amount": 50,
  "reason": "Победа в турнире",
  "source": "admin"
}
```

#### Добавить поинты
```http
POST /api/xp/add-points
Authorization: Bearer {admin_token}

{
  "discord_id": 123456789,
  "type": "points",
  "amount": 50,
  "reason": "Победа в турнире",
  "source": "admin"
}
```

#### Обновить статистику пользователя
```http
PUT /api/xp/update-user
Authorization: Bearer {admin_token}

{
  "discord_id": 123456789,
  "level": 10,
  "current_xp": 250,
  "total_xp": 5000,
  "points": 150
}
```

#### Получить историю транзакций
```http
GET /api/xp/transactions/{discord_id}?limit=50
Authorization: Bearer {admin_token}
```

### Публичные

#### Таблица лидеров
```http
GET /api/xp/leaderboard?by=level&limit=100

Параметры:
- by: level | total_xp | points
- limit: 1-100 (по умолчанию 100)
```

#### XP для уровня
```http
GET /api/xp/xp-for-level/{level}
```

## База данных

### Таблица users (новые поля)

```sql
ALTER TABLE users 
ADD COLUMN level INTEGER DEFAULT 1,
ADD COLUMN current_xp INTEGER DEFAULT 0,
ADD COLUMN total_xp INTEGER DEFAULT 0,
ADD COLUMN points INTEGER DEFAULT 0;
```

### Таблица xp_transactions

```sql
CREATE TABLE xp_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    discord_id BIGINT,
    type VARCHAR(20) NOT NULL, -- 'xp' или 'points'
    amount INTEGER NOT NULL,
    reason VARCHAR(200) NOT NULL,
    source VARCHAR(100), -- 'voice_activity', 'message', 'event_win', 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES admin_users(id)
);
```

### Таблица points_purchases

```sql
CREATE TABLE points_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    discord_id BIGINT,
    item_name VARCHAR(200) NOT NULL,
    cost INTEGER NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Интеграция с Discord ботом

Для автоматического начисления опыта бот должен:

1. **Отслеживать голосовые каналы**
   - Записывать время входа/выхода
   - Проверять, что пользователь в игровом канале
   - Начислять +10 XP каждые 30 минут

2. **Отслеживать сообщения**
   - Считать сообщения в день
   - Начислять +1 XP (максимум 20/день)
   - Отслеживать реакции для "помощи новичку"

3. **Интеграция с API**
   ```python
   import requests
   
   API_URL = "http://localhost:8000"
   ADMIN_TOKEN = "your_admin_token"
   
   def add_xp(discord_id: int, amount: int, reason: str, source: str):
       response = requests.post(
           f"{API_URL}/api/xp/add-xp",
           headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
           json={
               "discord_id": discord_id,
               "type": "xp",
               "amount": amount,
               "reason": reason,
               "source": source
           }
       )
       return response.json()
   ```

## Админ-панель

Доступна по адресу: `/admin/xp`

Функции:
- Просмотр всех пользователей с их уровнями и поинтами
- Поиск по имени
- Добавление XP/поинтов с указанием причины
- Прямое редактирование уровня, XP и поинтов
- Просмотр статистики

## Миграция

Для применения изменений в базе данных:

```bash
# Применить миграцию
python apply-migrations.py backend/migrations/add_xp_and_level.sql
```

Или через веб-интерфейс:
```
http://localhost:8000/api/migration/apply
```

## Будущие улучшения

1. **Автоматизация через бота**
   - Автоматическое начисление за голосовую активность
   - Автоматическое начисление за сообщения
   - Интеграция с игровыми API для отслеживания побед

2. **Магазин поинтов**
   - Веб-интерфейс для покупки привилегий
   - Автоматическое применение покупок
   - История покупок

3. **Достижения**
   - Специальные достижения за уровни
   - Бонусные поинты за достижения
   - Отображение на профиле

4. **Сезоны**
   - Сезонные таблицы лидеров
   - Награды за топ позиции
   - Сброс рейтинга между сезонами
