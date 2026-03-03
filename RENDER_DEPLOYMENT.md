# Деплой на Render.com - Пошаговая инструкция

## 🚀 Шаг 1: Деплой бэкенда

### Автоматический деплой (если включен)
Render автоматически задеплоит после push в main ветку. Подожди 5-10 минут.

### Ручной деплой
1. Зайди на https://dashboard.render.com
2. Найди свой Backend сервис
3. Нажми **"Manual Deploy"** → **"Deploy latest commit"**
4. Дождись завершения деплоя (статус "Live")

---

## 🗄️ Шаг 2: Применить миграцию базы данных

### Вариант А: Через Render Shell (Рекомендуется)

1. **Открой Shell на Render:**
   - Зайди в свой Backend сервис
   - Перейди на вкладку **"Shell"**
   - Нажми **"Connect"**

2. **Выполни команды:**
   ```bash
   # Проверь что миграция есть
   ls backend/migrations/add_xp_and_level.sql
   
   # Примени миграцию
   python apply-xp-migration.py
   ```

3. **Проверь результат:**
   Должно вывести:
   ```
   ✅ Миграция успешно применена!
   ✅ Колонки успешно добавлены:
      - level: integer (default: 1)
      - current_xp: integer (default: 0)
      - total_xp: integer (default: 0)
      - points: integer (default: 0)
   ```

### Вариант Б: Через локальное подключение к Render DB

1. **Получи DATABASE_URL:**
   - Зайди в Backend сервис на Render
   - Перейди в **"Environment"**
   - Скопируй значение `DATABASE_URL`

2. **Выполни локально:**
   ```bash
   # Установи переменную окружения
   export DATABASE_URL="твой_database_url_с_render"
   
   # Примени миграцию
   python apply-xp-migration.py
   ```

### Вариант В: Через psql (если есть доступ)

```bash
# Подключись к базе
psql "твой_database_url_с_render"

# Выполни SQL из файла
\i backend/migrations/add_xp_and_level.sql

# Проверь колонки
\d users
```

---

## 🔍 Шаг 3: Проверка

### Проверь что бэкенд работает:
```bash
curl https://lesnayakomanda.onrender.com/api/stats
```

Должен вернуть JSON с данными.

### Проверь что миграция применилась:
Зайди на сайт и открой профиль. Не должно быть ошибки 500.

---

## ❌ Если что-то пошло не так

### Ошибка: "column does not exist"
**Причина:** Миграция не применилась.
**Решение:** Повтори Шаг 2.

### Ошибка: "relation already exists"
**Причина:** Миграция уже применена.
**Решение:** Всё ок, можно игнорировать.

### Ошибка: "connection refused"
**Причина:** Неправильный DATABASE_URL.
**Решение:** Проверь переменную окружения на Render.

---

## 🔄 Автоматизация (Будущее)

Чтобы миграции применялись автоматически при деплое, можно:

1. Добавить в `backend/app/main.py` в функцию `init_db()`:
   ```python
   # Применить миграции при старте
   await apply_migrations()
   ```

2. Или использовать Alembic для управления миграциями:
   ```bash
   pip install alembic
   alembic init alembic
   alembic revision --autogenerate -m "add xp fields"
   alembic upgrade head
   ```

---

## 📝 Чек-лист деплоя

- [ ] Код запушен в main ветку
- [ ] Бэкенд задеплоен на Render (статус "Live")
- [ ] Миграция применена к базе данных
- [ ] Сайт работает без ошибок 500
- [ ] Профиль отображается корректно
- [ ] XP и поинты видны в профиле

---

**Последнее обновление:** 2026-03-03
