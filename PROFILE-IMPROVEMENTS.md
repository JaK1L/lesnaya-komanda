# 🎨 Улучшения профиля пользователя

**Дата:** 8 марта 2026  
**Статус:** 📋 План улучшений

---

## 📊 ТЕКУЩЕЕ СОСТОЯНИЕ

### ✅ Что работает
- Просмотр профиля (свой и публичный)
- Редактирование никнейма, био, аватара
- Скрытие профиля
- Игровые предпочтения
- Достижения
- Игровая статистика

### ⚠️ Что можно улучшить
- Нет поля "возраст" в БД (есть в UI, но не сохраняется)
- Активность на сайте (заглушка)
- Нет истории изменений профиля
- Нет социальных ссылок (Steam, Twitch, YouTube)
- Нет статистики активности (сообщения, войс)

---

## 🎯 ПРЕДЛОЖЕНИЯ ПО УЛУЧШЕНИЮ

### 1. Добавить поле "Возраст" в БД
**Приоритет:** Высокий  
**Сложность:** Низкая

**Что сделать:**
- Добавить колонку `age` в таблицу `users`
- Обновить схемы Pydantic
- Добавить валидацию (13-100 лет)

**Миграция:**
```sql
ALTER TABLE users ADD COLUMN age INTEGER;
ALTER TABLE users ADD CONSTRAINT age_check CHECK (age IS NULL OR (age >= 13 AND age <= 100));
```

---

### 2. Социальные ссылки
**Приоритет:** Средний  
**Сложность:** Средняя

**Что добавить:**
- Steam ID
- Twitch username
- YouTube channel
- Twitter/X handle
- Instagram

**Структура:**
```sql
CREATE TABLE user_social_links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- steam, twitch, youtube, twitter, instagram
    username VARCHAR(200) NOT NULL,
    url TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, platform)
);
```

---

### 3. Статистика активности
**Приоритет:** Средний  
**Сложность:** Средняя

**Что показывать:**
- Сообщений в Discord (из activity_log)
- Часов в войсе (из voice_sessions)
- Посещенных событий
- Полученных достижений
- Уровень и XP

**Пример:**
```typescript
interface ActivityStats {
  messages_count: number
  voice_hours: number
  events_attended: number
  achievements_earned: number
  level: number
  current_xp: number
  total_xp: number
}
```

---

### 4. История активности (лента)
**Приоритет:** Низкий  
**Сложность:** Высокая

**Что показывать:**
- Полученные достижения
- Посещенные события
- Изменения уровня
- Новые игровые предпочтения

**Структура:**
```sql
CREATE TABLE user_activity_feed (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- achievement, event, level_up, game_added
    title VARCHAR(200) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_user ON user_activity_feed(user_id, created_at DESC);
```

---

### 5. Настройки приватности
**Приоритет:** Средний  
**Сложность:** Низкая

**Что добавить:**
- Скрыть возраст
- Скрыть игровые предпочтения
- Скрыть достижения
- Скрыть статистику

**Структура:**
```sql
ALTER TABLE users ADD COLUMN privacy_settings JSONB DEFAULT '{
  "show_age": true,
  "show_games": true,
  "show_achievements": true,
  "show_stats": true,
  "show_activity": true
}'::jsonb;
```

---

### 6. Кастомизация профиля
**Приоритет:** Низкий  
**Сложность:** Средняя

**Что добавить:**
- Баннер профиля (обложка)
- Цветовая тема профиля
- Значки/бейджи
- Кастомный статус

---

### 7. Друзья и подписки
**Приоритет:** Низкий  
**Сложность:** Высокая

**Что добавить:**
- Список друзей
- Подписки на других игроков
- Уведомления об активности друзей

**Структура:**
```sql
CREATE TABLE user_friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user ON user_friends(user_id);
CREATE INDEX idx_friends_friend ON user_friends(friend_id);
```

---

## 🚀 ПЛАН РЕАЛИЗАЦИИ

### Фаза 1: Базовые улучшения (1-2 дня)
1. ✅ Добавить поле "возраст" в БД
2. ✅ Обновить схемы и API
3. ✅ Добавить валидацию
4. ✅ Обновить UI

### Фаза 2: Социальные ссылки (2-3 дня)
1. Создать таблицу social_links
2. Добавить API endpoints
3. Создать UI компонент
4. Добавить валидацию ссылок

### Фаза 3: Статистика активности (3-4 дня)
1. Создать endpoint для статистики
2. Агрегировать данные из разных таблиц
3. Создать UI компонент с графиками
4. Добавить кэширование

### Фаза 4: Настройки приватности (1-2 дня)
1. Добавить поле privacy_settings
2. Обновить API для учета настроек
3. Создать UI для настроек
4. Обновить публичный профиль

---

## 💡 БЫСТРЫЕ УЛУЧШЕНИЯ (можно сделать сейчас)

### 1. Заменить print() на logging
```python
# В profile.py
import logging
logger = logging.getLogger(__name__)

# Вместо print()
logger.info(f"Getting profile for user_id: {current_user.id}")
logger.error(f"Error fetching profile: {str(e)}", exc_info=True)
```

### 2. Добавить кэширование аватаров
```python
# В profile.py
from fastapi.responses import FileResponse

@router.get("/uploads/avatars/{filename}")
async def get_avatar(filename: str):
    # ...
    return FileResponse(
        file_path,
        headers={
            "Cache-Control": "public, max-age=31536000",  # 1 год
            "ETag": f'"{filename}"'
        }
    )
```

### 3. Оптимизировать загрузку профиля
```python
# Загружать все данные одним запросом
@router.get("/profile/full")
async def get_full_profile(
    current_user: User = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """Получить полный профиль со всеми данными"""
    # Профиль + достижения + игровые предпочтения + статистика
    # Одним запросом с JOIN
```

### 4. Добавить rate limiting для загрузки аватаров
```python
from ..rate_limit import limiter

@router.post("/profile/avatar")
@limiter.limit("5/hour")  # Максимум 5 загрузок в час
async def upload_avatar(...):
    # ...
```

---

## 🎨 UI/UX УЛУЧШЕНИЯ

### 1. Добавить прогресс-бар для уровня
```typescript
<div className="level-progress">
  <div className="level-info">
    <span>Уровень {level}</span>
    <span>{current_xp} / {xp_needed} XP</span>
  </div>
  <div className="progress-bar">
    <div 
      className="progress-fill" 
      style={{ width: `${(current_xp / xp_needed) * 100}%` }}
    />
  </div>
</div>
```

### 2. Улучшить форму редактирования
- Добавить предпросмотр изменений
- Показывать счетчик символов для био
- Добавить подсказки (tooltips)
- Валидация в реальном времени

### 3. Добавить скелетоны для загрузки
- Плавная загрузка секций
- Анимация появления
- Индикаторы прогресса

---

## 📊 МЕТРИКИ УСПЕХА

### Текущие показатели
- Время загрузки профиля: ~200-300ms
- Размер аватара: до 5MB
- Поля профиля: 8

### Целевые показатели
- Время загрузки: <150ms
- Размер аватара: до 2MB (с оптимизацией)
- Поля профиля: 15+
- Покрытие тестами: 80%

---

## 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Оптимизация изображений
```python
from PIL import Image

def optimize_avatar(file: UploadFile) -> bytes:
    """Оптимизировать аватар перед сохранением"""
    img = Image.open(file.file)
    
    # Изменить размер до 512x512
    img.thumbnail((512, 512), Image.Resampling.LANCZOS)
    
    # Конвертировать в WebP
    output = io.BytesIO()
    img.save(output, format='WEBP', quality=85)
    return output.getvalue()
```

### Валидация социальных ссылок
```python
SOCIAL_PATTERNS = {
    'steam': r'^https://steamcommunity\.com/(id|profiles)/[a-zA-Z0-9_-]+$',
    'twitch': r'^https://twitch\.tv/[a-zA-Z0-9_]+$',
    'youtube': r'^https://youtube\.com/@[a-zA-Z0-9_-]+$',
}

def validate_social_link(platform: str, url: str) -> bool:
    pattern = SOCIAL_PATTERNS.get(platform)
    if not pattern:
        return False
    return bool(re.match(pattern, url))
```

---

## 🎯 ПРИОРИТИЗАЦИЯ

### Must Have (Фаза 1)
- ✅ Поле "возраст"
- ✅ Замена print() на logging
- ✅ Кэширование аватаров

### Should Have (Фаза 2)
- Социальные ссылки
- Статистика активности
- Настройки приватности

### Nice to Have (Фаза 3)
- История активности
- Кастомизация профиля
- Друзья и подписки

---

**Что хочешь реализовать в первую очередь?**
1. Добавить поле "возраст" в БД
2. Социальные ссылки
3. Статистику активности
4. Что-то другое?
