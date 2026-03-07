# ✅ ИСПРАВЛЕНИЕ CORS ОШИБКИ - ФИНАЛЬНАЯ ИНСТРУКЦИЯ

## 🔴 Текущие проблемы
1. **CORS ошибка** - блокируются запросы с Vercel к Render
2. **500 Internal Server Error** - сервер падает (ИСПРАВЛЕНО ✅)

## ✅ Что уже исправлено

### 1. Миграция достижений применена
- ✅ Таблица `achievement_types` создана (36 достижений)
- ✅ Таблица `user_achievements` создана
- ✅ Эндпоинты используют `discord_id` вместо `user_id`

### 2. Код обновлен и задеплоен
- ✅ Коммит: `fix: Use discord_id instead of user_id in achievements and game stats endpoints`
- ✅ Запушен на GitHub
- ✅ Render автоматически задеплоил

## 🔧 ЧТО НУЖНО СДЕЛАТЬ ВРУЧНУЮ

### ⚠️ КРИТИЧНО: Обновить ALLOWED_ORIGINS на Render

**Это единственное что осталось сделать!**

1. Зайди на https://dashboard.render.com
2. Выбери сервис **lesnayakomanda** (backend)
3. Перейди в раздел **Environment**
4. Найди переменную `ALLOWED_ORIGINS`
5. **ИЗМЕНИ** значение на:
   ```
   http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app
   ```
6. Нажми **Save Changes**
7. Дождись автоматического перезапуска (1-2 минуты)

### 📋 Проверка после перезапуска

1. Открой логи Render
2. Найди строку:
   ```
   🌐 CORS: Разрешенные origins: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://lesnaya-komanda.vercel.app']
   ```
3. Если видишь эту строку - все правильно!

### ✅ Проверка работы сайта

Открой https://lesnaya-komanda.vercel.app/profile

Должно работать:
- ✅ Нет CORS ошибок в консоли
- ✅ Достижения загружаются
- ✅ Игровая статистика загружается
- ✅ Все API запросы проходят

## Что было исправлено в коде

### 1. Исправлены эндпоинты для работы с discord_id

**До:**
```python
@router.get("/user/{user_id}")
async def get_user_achievements(user_id: int, ...):
    # Использовал user_id напрямую
```

**После:**
```python
@router.get("/user/{discord_id}")
async def get_user_achievements(discord_id: int, ...):
    # Получаем user_id по discord_id
    user = await db.fetchrow("SELECT id FROM users WHERE discord_id = $1", discord_id)
    if not user:
        return []
    user_id = user['id']
```

### 2. Обновлены эндпоинты:
- `/api/achievements/user/{discord_id}` - теперь принимает discord_id
- `/api/achievements/user/{discord_id}/stats` - теперь принимает discord_id
- `/api/game-stats/user/{discord_id}/stats` - теперь принимает discord_id

## Коммит
```
fix: Use discord_id instead of user_id in achievements and game stats endpoints
```

## Важно

После обновления переменных окружения на Render, все должно заработать!

