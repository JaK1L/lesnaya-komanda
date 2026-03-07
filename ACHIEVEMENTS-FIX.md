# 🏆 Исправление системы достижений

## Проблема
CORS ошибка при обращении к `/api/achievements/types`:
```
Access to fetch at 'https://lesnayakomanda.onrender.com/api/achievements/types' 
from origin 'https://lesnaya-komanda.vercel.app' has been blocked by CORS policy
```

## Причина
Таблица `achievement_types` не создана в базе данных, хотя миграция должна применяться автоматически при запуске backend.

## Решение

### Вариант 1: Перезапустить Backend на Render (рекомендуется)

1. Открой: https://dashboard.render.com/
2. Найди сервис `lesnayakomanda`
3. Нажми **Manual Deploy** → **Deploy latest commit**
4. Дождись завершения деплоя (2-3 минуты)
5. Проверь логи - должно быть:
   ```
   ✅ Миграция системы достижений успешно применена!
   ```

### Вариант 2: Применить миграцию вручную через Neon

1. Открой: https://console.neon.tech/
2. Выбери проект `lesnaya-komanda`
3. Перейди в **SQL Editor**
4. Скопируй и выполни SQL из файла `backend/migrations/create_achievements_system.sql`
5. Проверь что таблицы созданы:
   ```sql
   SELECT COUNT(*) FROM achievement_types;
   SELECT COUNT(*) FROM user_achievements;
   ```

## Проверка после исправления

### 1. Проверь API напрямую
```bash
curl https://lesnayakomanda.onrender.com/api/achievements/types
```

Должен вернуть массив достижений (не пустой):
```json
[
  {
    "id": 1,
    "name": "Первые шаги",
    "description": "Присоединился к сообществу",
    "icon": "🌱",
    "category": "activity",
    "requirement": {"type": "join"},
    "points": 5,
    "is_active": true,
    "created_at": "2026-03-07T..."
  },
  ...
]
```

### 2. Проверь на сайте
1. Открой: https://lesnaya-komanda.vercel.app
2. Перейди в раздел **Достижения** (если есть)
3. Должны загрузиться достижения

### 3. Проверь в Swagger
1. Открой: https://lesnayakomanda.onrender.com/api/docs
2. Найди `/api/achievements/types`
3. Try it out → Execute
4. Должен вернуть 200 OK с массивом достижений

## Что было сделано

### 1. Добавлена обработка ошибок в `/api/achievements/types`
```python
try:
    rows = await db.fetch("SELECT * FROM achievement_types ...")
    return [AchievementTypeOut(**dict(row)) for row in rows]
except asyncpg.UndefinedTableError:
    # Таблица не существует - вернуть пустой список
    return []
except Exception as e:
    # Логируем ошибку и возвращаем пустой список вместо 500
    logging.error(f"Error fetching achievement types: {e}")
    return []
```

### 2. Миграция встроена в `init_db()`
При запуске backend автоматически проверяется наличие таблицы `achievement_types` и создается если её нет.

### 3. Добавлена функция `get_optional_current_user`
Для эндпоинтов которые работают как с авторизованными, так и с неавторизованными пользователями.

## Структура таблиц

### achievement_types
```sql
CREATE TABLE achievement_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '🏆',
    category VARCHAR(50) DEFAULT 'general',
    requirement JSONB,
    points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### user_achievements
```sql
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_type_id INTEGER REFERENCES achievement_types(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    max_progress INTEGER DEFAULT 100,
    earned_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_type_id)
);
```

## Базовые достижения

После применения миграции будут созданы 18 базовых достижений:

### Активность (4)
- 🌱 Первые шаги (5 поинтов)
- 💬 Болтун (10 поинтов)
- 🗣️ Говорун (25 поинтов)
- 👑 Легенда чата (50 поинтов)

### Голосовые каналы (3)
- 🎧 Слушатель (10 поинтов)
- 🎤 Собеседник (25 поинтов)
- 📻 Радиоведущий (50 поинтов)

### События (3)
- 🎯 Участник (10 поинтов)
- ⭐ Активист (25 поинтов)
- 🌟 Фанат (50 поинтов)

### Игры CS2 (3)
- 🔫 Новичок CS2 (10 поинтов)
- ⚔️ Боец CS2 (25 поинтов)
- 👑 Мастер CS2 (50 поинтов)

### Игры Dota 2 (3)
- 🛡️ Новичок Dota 2 (10 поинтов)
- ⚡ Боец Dota 2 (25 поинтов)
- 🏆 Мастер Dota 2 (50 поинтов)

### Специальные (2)
- 🎂 Старожил (100 поинтов)
- 💎 Легенда (500 поинтов)

## API Endpoints

### Публичные
- `GET /api/achievements/types` - Список всех типов достижений
- `GET /api/achievements/user/{discord_id}` - Достижения пользователя
- `GET /api/achievements/user/{discord_id}/stats` - Статистика достижений

### Админские (требуется авторизация)
- `POST /api/achievements/types` - Создать тип достижения
- `PUT /api/achievements/types/{id}` - Обновить тип достижения
- `DELETE /api/achievements/types/{id}` - Удалить тип достижения
- `POST /api/achievements/grant/{user_id}/{achievement_type_id}` - Выдать достижение

## Следующие шаги

После исправления можно:

1. **Добавить раздел достижений на frontend**
   - Страница со списком всех достижений
   - Прогресс-бары для незавершенных
   - Фильтры по категориям

2. **Настроить автоматическое начисление**
   - Интеграция с Discord ботом
   - Отслеживание активности
   - Выдача достижений при выполнении условий

3. **Добавить уведомления**
   - Popup при получении достижения
   - Отправка в Discord канал
   - История получения

---

**Создано:** 07.03.2026  
**Статус:** Требуется перезапуск backend или ручное применение миграции  
**Время:** ~2 минуты
