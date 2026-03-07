# 🔴 СРОЧНО: Исправление CORS ошибки

## Статус: Почти готово! Осталось 1 действие

### ✅ Что уже сделано:

1. **Миграция достижений применена**
   - Создано 36 типов достижений
   - Таблицы `achievement_types` и `user_achievements` работают
   - Проверено: `python backend/check_achievements.py`

2. **Код исправлен**
   - Эндпоинты теперь используют `discord_id` вместо `user_id`
   - Файлы: `backend/app/routes/achievements.py`, `backend/app/routes/game_stats.py`
   - Коммит: `fix: Use discord_id instead of user_id in achievements and game stats endpoints`

3. **Код задеплоен**
   - Запушен на GitHub
   - Render автоматически задеплоил новую версию

### 🔧 ЧТО НУЖНО СДЕЛАТЬ ПРЯМО СЕЙЧАС:

**Обновить переменную окружения `ALLOWED_ORIGINS` на Render:**

1. Открой https://dashboard.render.com
2. Выбери сервис **lesnayakomanda**
3. Перейди в **Environment**
4. Найди `ALLOWED_ORIGINS`
5. Измени на: `http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app`
6. Нажми **Save Changes**
7. Дождись перезапуска (1-2 минуты)

### 📊 Текущие ошибки (исчезнут после обновления ALLOWED_ORIGINS):

```
❌ Access to fetch at 'https://lesnayakomanda.onrender.com/api/achievements/types' 
   from origin 'https://lesnaya-komanda.vercel.app' has been blocked by CORS policy
```

### ✅ После обновления переменной:

Все заработает:
- Достижения будут загружаться
- Игровая статистика будет отображаться
- CORS ошибки исчезнут

### 📝 Проверка:

После перезапуска Render:
1. Открой логи Render
2. Найди: `🌐 CORS: Разрешенные origins: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://lesnaya-komanda.vercel.app']`
3. Открой https://lesnaya-komanda.vercel.app/profile
4. Проверь консоль браузера - не должно быть CORS ошибок

---

**ВАЖНО:** Без обновления `ALLOWED_ORIGINS` на Render сайт не будет работать!

