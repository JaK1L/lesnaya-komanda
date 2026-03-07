# 📊 Заполнение базы данных тестовыми данными

## Что добавляется

### 📰 Новости (4 записи)
- Открытие нового сезона 2026
- Итоги CS2 турнира
- Новые стримеры в команде
- Обновление сайта

### 📅 События (5 записей)
- CS2 Турнир "Весенний Клатч" (15 марта)
- Dota 2 Инхаус (20 марта)
- Valorant Турнир (22 марта)
- Встреча сообщества (25 марта)
- Стрим-марафон (30 марта)

### 📝 Лента активности (8 записей)
- Достижения игроков
- Посты о событиях
- Анонсы стримов

---

## 🚀 Как использовать

### Вариант 1: Через psql (локально)

```bash
# Подключиться к базе данных
psql -U postgres -d lesnaya_komanda

# Выполнить скрипт
\i backend/seed_data.sql

# Или одной командой
psql -U postgres -d lesnaya_komanda -f backend/seed_data.sql
```

### Вариант 2: Через Python скрипт

```bash
cd backend
python seed_database.py
```

### Вариант 3: Через API эндпоинт (если добавлен)

```bash
curl -X POST http://localhost:8000/api/admin/seed-data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Вариант 4: Через Railway/Render (production)

**Railway:**
```bash
# Установить Railway CLI
npm install -g @railway/cli

# Подключиться к проекту
railway login
railway link

# Выполнить SQL
railway run psql -f backend/seed_data.sql
```

**Render:**
1. Открыть Dashboard → Database
2. Перейти в "Shell"
3. Скопировать содержимое `seed_data.sql`
4. Вставить и выполнить

---

## 🔄 Обновление данных

Если нужно обновить данные (не удаляя старые):

```sql
-- Просто запустить скрипт снова
-- Он добавит новые записи, не удаляя существующие
```

Если нужно полностью очистить и заполнить заново:

```sql
-- Раскомментировать строку в начале seed_data.sql:
TRUNCATE TABLE news, events, home_feed CASCADE;
```

---

## 📝 Создание Python скрипта для заполнения

Создайте файл `backend/seed_database.py`:

```python
import asyncio
import asyncpg
from app.config import settings

async def seed_database():
    """Заполнить базу данных тестовыми данными"""
    
    # Подключение к БД
    conn = await asyncpg.connect(settings.DATABASE_URL)
    
    try:
        # Читаем SQL файл
        with open('seed_data.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Выполняем SQL
        await conn.execute(sql)
        
        print("✅ База данных успешно заполнена!")
        
        # Проверяем результаты
        news_count = await conn.fetchval("SELECT COUNT(*) FROM news")
        events_count = await conn.fetchval("SELECT COUNT(*) FROM events")
        feed_count = await conn.fetchval("SELECT COUNT(*) FROM home_feed")
        
        print(f"📰 Новостей: {news_count}")
        print(f"📅 Событий: {events_count}")
        print(f"📝 Записей в ленте: {feed_count}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
```

Запуск:
```bash
cd backend
python seed_database.py
```

---

## 🎯 Проверка данных

После заполнения проверьте через API:

```bash
# Новости
curl http://localhost:8000/api/news

# События
curl http://localhost:8000/api/events

# Лента активности
curl http://localhost:8000/api/feed
```

Или через Swagger UI:
```
http://localhost:8000/api/docs
```

---

## 🔧 Кастомизация данных

Отредактируйте `seed_data.sql` под свои нужды:

### Добавить новость:
```sql
INSERT INTO news (title, content, published, created_at) VALUES
(
    'Ваш заголовок',
    'Ваш контент',
    true,
    NOW()
);
```

### Добавить событие:
```sql
INSERT INTO events (title, description, game, event_date, status) VALUES
(
    'Название события',
    'Описание',
    'cs2',  -- или 'dota2', 'valorant', null
    '2026-04-01 20:00:00',
    'Планируется'
);
```

### Добавить запись в ленту:
```sql
INSERT INTO home_feed (kind, title, content, created_at) VALUES
(
    'post',  -- или 'achievement'
    'Заголовок',
    'Контент (опционально)',
    NOW()
);
```

---

## 🗑️ Очистка данных

Если нужно удалить все тестовые данные:

```sql
TRUNCATE TABLE news CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE home_feed CASCADE;
```

Или через Python:
```python
await conn.execute("TRUNCATE TABLE news, events, home_feed CASCADE")
```

---

## 📚 Полезные команды

```sql
-- Посмотреть все новости
SELECT id, title, published, created_at FROM news ORDER BY created_at DESC;

-- Посмотреть все события
SELECT id, title, game, event_date, status FROM events ORDER BY event_date;

-- Посмотреть ленту активности
SELECT id, kind, title, created_at FROM home_feed ORDER BY created_at DESC;

-- Обновить новость
UPDATE news SET title = 'Новый заголовок' WHERE id = 1;

-- Удалить событие
DELETE FROM events WHERE id = 1;
```

---

**Готово! Теперь у вас есть тестовые данные для разработки и демонстрации! 🎉**
