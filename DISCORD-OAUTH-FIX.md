# 🔧 Исправление Discord OAuth

## Проблема
При попытке войти через Discord показывается "Неизвестное приложение".

## Причина
В Discord Developer Portal не настроен правильный Redirect URL для production.

## Решение

### Шаг 1: Открой Discord Developer Portal
https://discord.com/developers/applications

### Шаг 2: Выбери приложение
Найди приложение с Client ID: `1329022035062079540`

### Шаг 3: Открой OAuth2
Слева в меню: **OAuth2** → **General**

### Шаг 4: Добавь Redirect URLs

В разделе **Redirects** добавь следующие URL (если их нет):

```
http://localhost:8000/api/auth/discord/callback
https://lesnayakomanda.onrender.com/api/auth/discord/callback
```

**Важно:**
- ✅ `https://lesnayakomanda.onrender.com/api/auth/discord/callback` (БЕЗ дефиса!)
- ❌ НЕ `https://lesnaya-komanda.onrender.com` (с дефисом)

### Шаг 5: Сохрани изменения
Нажми **Save Changes** внизу страницы

### Шаг 6: Проверь

1. Открой: https://lesnaya-komanda.vercel.app
2. Нажми кнопку **ВОЙТИ**
3. Должна открыться страница авторизации Discord (не ошибка)
4. Авторизуйся
5. Должен перенаправить обратно на сайт

---

## Проверка настроек

### В Discord Developer Portal должно быть:

**OAuth2 → General:**
- **Client ID:** `1329022035062079540`
- **Client Secret:** `Gt6g_0gQ13R-7Y7FZp0k2Xo8aZFQ7U8B`
- **Redirects:**
  - `http://localhost:8000/api/auth/discord/callback`
  - `https://lesnayakomanda.onrender.com/api/auth/discord/callback`

**OAuth2 → URL Generator:**
- **Scopes:** `identify`, `email`
- **Redirect URL:** `https://lesnayakomanda.onrender.com/api/auth/discord/callback`

---

## Если все еще не работает

### Вариант 1: Проверь переменные на Render

1. Открой: https://dashboard.render.com/
2. Сервис `lesnayakomanda` → Environment
3. Проверь:
   ```env
   DISCORD_CLIENT_ID=1329022035062079540
   DISCORD_CLIENT_SECRET=Gt6g_0gQ13R-7Y7FZp0k2Xo8aZFQ7U8B
   FRONTEND_URL=https://lesnaya-komanda.vercel.app
   BACKEND_URL=https://lesnayakomanda.onrender.com
   ```

### Вариант 2: Проверь логи Backend

1. Render Dashboard → Logs
2. Попробуй войти через Discord
3. Смотри что пишется в логах

### Вариант 3: Тест через Swagger

1. Открой: https://lesnayakomanda.onrender.com/api/docs
2. Найди `/api/auth/discord`
3. Try it out → Execute
4. Должен вернуть URL для авторизации

---

## Как работает Discord OAuth

1. **Пользователь нажимает "Войти"**
   - Frontend перенаправляет на: `https://lesnayakomanda.onrender.com/api/auth/discord`

2. **Backend генерирует URL Discord**
   - Перенаправляет на: `https://discord.com/oauth2/authorize?client_id=...`

3. **Пользователь авторизуется в Discord**
   - Discord перенаправляет на: `https://lesnayakomanda.onrender.com/api/auth/discord/callback`

4. **Backend получает код и создает токен**
   - Перенаправляет на: `https://lesnaya-komanda.vercel.app?token=...`

5. **Frontend сохраняет токен**
   - Пользователь авторизован

---

## Правильные URLs

### Backend (Render)
```
https://lesnayakomanda.onrender.com
```
**БЕЗ дефиса!**

### Frontend (Vercel)
```
https://lesnaya-komanda.vercel.app
```
**С дефисом!**

### Discord Redirect
```
https://lesnayakomanda.onrender.com/api/auth/discord/callback
```
**БЕЗ дефиса!**

---

## Проверка после исправления

1. **Открой сайт:**
   https://lesnaya-komanda.vercel.app

2. **Нажми "ВОЙТИ"**

3. **Должна открыться страница Discord:**
   - Название приложения
   - Запрос разрешений (identify, email)
   - Кнопка "Авторизовать"

4. **После авторизации:**
   - Перенаправление на сайт
   - Отображение профиля
   - Доступ к защищенным функциям

---

## Дополнительно: Настройка приложения Discord

### OAuth2 → General

**Application Information:**
- **Name:** Лесная Команда (или любое название)
- **Description:** Игровое сообщество
- **Icon:** Загрузи логотип

**Default Authorization Link:**
- **Authorization Method:** In-app Authorization
- **Scopes:** `identify`, `email`

**Bot:**
- Если используешь бота, настрой его отдельно
- Bot Permissions: зависит от функционала

---

**Создано:** 07.03.2026  
**Статус:** Требуется настройка Discord Developer Portal  
**Время:** ~2 минуты
