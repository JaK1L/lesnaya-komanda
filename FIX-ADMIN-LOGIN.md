# 🔧 Исправление логина админа

## Проблема
Не можешь войти в админ-панель на https://lesnaya-komanda.vercel.app/admin

## Причина
Админ в production БД имеет неправильный username или password_hash.

## Решение

### Вариант 1: Через Neon SQL Editor (БЫСТРО)

1. Открыть https://console.neon.tech/
2. Выбрать проект `lesnaya-komanda`
3. Перейти в **SQL Editor**
4. Выполнить команды из `backend/fix_admin.sql`:

```sql
-- Проверить текущего админа
SELECT id, username, role, created_at FROM admin_users;

-- Обновить админа
UPDATE admin_users 
SET 
    username = 'LesnoyBOSS',
    password_hash = '$2b$12$KLgqVoHH3ZkRanbKF5M0f.KrRP32hM4R4cCwN26Km4Uc4K0jfr5v.',
    role = 'admin'
WHERE id = 1;

-- Проверить результат
SELECT id, username, role FROM admin_users WHERE username = 'LesnoyBOSS';
```

5. Должен вернуть:
```
id | username   | role
1  | LesnoyBOSS | admin
```

### Вариант 2: Через Swagger (ПРОВЕРКА)

1. Открыть https://lesnayakomanda.onrender.com/api/docs
2. Найти POST `/api/token`
3. Нажать **Try it out**
4. Ввести:
   ```
   username: LesnoyBOSS
   password: LesnoyBOSS909!
   ```
5. Нажать **Execute**

**Если возвращает 200 OK с токеном** - админ настроен правильно, проблема в frontend.

**Если возвращает 401/422** - админ не настроен, выполни Вариант 1.

### Вариант 3: Redeploy Backend (если ничего не помогло)

Backend при старте автоматически создает/обновляет админа в `init_db()`.

1. Открыть https://dashboard.render.com/
2. Найти сервис `lesnayakomanda`
3. Нажать **Manual Deploy** → **Deploy latest commit**
4. Подождать 2-3 минуты
5. Проверить логи - должно быть:
   ```
   ✅ Админ обновлен: admin → LesnoyBOSS
   ```

---

## После исправления

1. Открыть https://lesnaya-komanda.vercel.app/admin
2. Открыть консоль браузера (F12)
3. Ввести:
   - Логин: `LesnoyBOSS`
   - Пароль: `LesnoyBOSS909!`
4. Нажать "Войти"

В консоли должно быть:
```
Attempting login with: {username: "LesnoyBOSS", api_url: "https://lesnayakomanda.onrender.com"}
Login response status: 200
Login successful, token received: yes
```

---

## Если все еще не работает

### Проверка 1: CORS
```bash
curl -X OPTIONS https://lesnayakomanda.onrender.com/api/token \
  -H "Origin: https://lesnaya-komanda.vercel.app" \
  -v
```

Должен вернуть:
```
< access-control-allow-origin: https://lesnaya-komanda.vercel.app
< access-control-allow-credentials: true
```

### Проверка 2: API работает
```bash
curl https://lesnayakomanda.onrender.com/api/
```

Должен вернуть:
```json
{"message":"Лесная Команда API active","status":"ok"}
```

### Проверка 3: Логин работает
```bash
curl -X POST https://lesnayakomanda.onrender.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=LesnoyBOSS&password=LesnoyBOSS909!"
```

Должен вернуть:
```json
{"access_token":"eyJ...","token_type":"bearer"}
```

---

## Учетные данные

**Username:** `LesnoyBOSS`  
**Password:** `LesnoyBOSS909!`  
**Hash:** `$2b$12$KLgqVoHH3ZkRanbKF5M0f.KrRP32hM4R4cCwN26Km4Uc4K0jfr5v.`

---

**Дата:** 07.03.2026  
**Статус:** Ожидает исправления в Neon
