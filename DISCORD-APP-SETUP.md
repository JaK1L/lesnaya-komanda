# 🔧 Настройка Discord приложения

## Проблема
Discord показывает "Неизвестное приложение" при попытке авторизации.

## Возможные причины

1. **Приложение не существует** - Client ID неправильный
2. **Приложение удалено** - нужно создать новое
3. **Приложение не верифицировано** - нужно добавить в whitelist
4. **Redirect URL неправильный** - нужно проверить настройки

---

## Решение 1: Проверить существующее приложение

### Шаг 1: Открой Discord Developer Portal
https://discord.com/developers/applications

### Шаг 2: Проверь список приложений
Найди приложение с Client ID: `1329022035062079540`

**Если приложения НЕТ в списке:**
- Значит оно было удалено или Client ID неправильный
- Переходи к **Решению 2** (создать новое)

**Если приложение ЕСТЬ:**
- Проверь настройки OAuth2
- Убедись что Redirect URLs правильные

---

## Решение 2: Создать новое приложение (рекомендуется)

### Шаг 1: Создай новое приложение

1. Открой: https://discord.com/developers/applications
2. Нажми **New Application**
3. Название: `Лесная Команда` (или любое)
4. Согласись с Terms of Service
5. Нажми **Create**

### Шаг 2: Настрой OAuth2

1. Слева: **OAuth2** → **General**

2. **Redirects** - добавь:
   ```
   http://localhost:8000/api/auth/discord/callback
   https://lesnayakomanda.onrender.com/api/auth/discord/callback
   ```

3. **Save Changes**

### Шаг 3: Скопируй учетные данные

1. **Client ID** - скопируй (например: `1234567890123456789`)
2. **Client Secret** - нажми **Reset Secret** → скопируй

### Шаг 4: Обнови переменные на Render

1. Открой: https://dashboard.render.com/
2. Сервис `lesnayakomanda` → **Environment**
3. Обнови:
   ```env
   DISCORD_CLIENT_ID=<новый Client ID>
   DISCORD_CLIENT_SECRET=<новый Client Secret>
   ```
4. **Save Changes**
5. Render автоматически перезапустится

### Шаг 5: Проверь

1. Дождись перезапуска Render (~2 минуты)
2. Открой: https://lesnaya-komanda.vercel.app
3. Нажми **ВОЙТИ**
4. Должна открыться страница авторизации Discord

---

## Решение 3: Добавить тестовых пользователей

Если приложение не верифицировано, можно добавить себя в whitelist:

### Шаг 1: OAuth2 → General

Scroll down до **Authorization Method**

### Шаг 2: Выбери метод

- **In-app Authorization** - для production (требует верификации)
- **None** - для тестирования (работает только для владельца)

### Шаг 3: Добавь тестовых пользователей

1. **OAuth2** → **OAuth2 URL Generator**
2. Внизу: **Add users to whitelist**
3. Добавь свой Discord ID
4. Save

---

## Решение 4: Проверить настройки приложения

### General Information

1. **Name:** Лесная Команда
2. **Description:** Игровое сообщество
3. **Icon:** Загрузи логотип (опционально)
4. **Tags:** Gaming, Community

### OAuth2 → General

**Client Information:**
- Client ID: `<твой ID>`
- Client Secret: `<твой Secret>`

**Redirects:**
```
http://localhost:8000/api/auth/discord/callback
https://lesnayakomanda.onrender.com/api/auth/discord/callback
```

**Default Authorization Link:**
- Authorization Method: **In-app Authorization**
- Scopes: `identify`, `email`
- Redirect URL: `https://lesnayakomanda.onrender.com/api/auth/discord/callback`

---

## Проверка через Swagger

1. Открой: https://lesnayakomanda.onrender.com/api/docs
2. Найди **GET /api/auth/discord**
3. **Try it out** → **Execute**
4. Скопируй URL из Response
5. Открой этот URL в браузере
6. Должна открыться страница Discord (не ошибка)

---

## Альтернатива: Временно отключить Discord OAuth

Если нужно срочно протестировать сайт без Discord авторизации:

### Вариант 1: Использовать админ-панель напрямую

1. Открой: https://lesnaya-komanda.vercel.app/admin
2. Войди с учетными данными:
   - Логин: `LesnoyBOSS`
   - Пароль: `LesnoyBOSS909!`

### Вариант 2: Создать тестового пользователя в БД

```sql
-- Подключись к Neon
-- https://console.neon.tech/ → SQL Editor

INSERT INTO users (discord_id, username, discriminator, avatar)
VALUES (123456789, 'TestUser', '0001', NULL);
```

---

## Частые ошибки

### "Неизвестное приложение"
- **Причина:** Client ID неправильный или приложение удалено
- **Решение:** Создать новое приложение

### "Invalid redirect_uri"
- **Причина:** Redirect URL не добавлен в Discord
- **Решение:** Добавить в OAuth2 → Redirects

### "Access denied"
- **Причина:** Пользователь не в whitelist
- **Решение:** Добавить в whitelist или верифицировать приложение

### "Invalid client"
- **Причина:** Client Secret неправильный
- **Решение:** Reset Secret и обновить на Render

---

## Рекомендация

**Создай новое приложение Discord** - это самый быстрый способ решить проблему.

1. Создай новое приложение (5 минут)
2. Настрой OAuth2
3. Обнови Client ID и Secret на Render
4. Проверь авторизацию

После этого все заработает!

---

**Создано:** 07.03.2026  
**Статус:** Требуется создание нового Discord приложения  
**Время:** ~5 минут
