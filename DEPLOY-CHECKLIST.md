# 🚀 Чеклист для деплоя

## Проблема
Админ-панель не работает из-за неправильной CORS конфигурации на backend.

## Решение

### ✅ Шаг 1: Обновить Render (Backend)

1. Открыть https://dashboard.render.com/
2. Найти сервис `lesnayakomanda` (или как называется ваш backend)
3. Перейти в **Environment**
4. Найти или добавить переменные:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://lesnaya-komanda.vercel.app
FRONTEND_URL=https://lesnaya-komanda.vercel.app
BACKEND_URL=https://lesnayakomanda.onrender.com
```

5. Нажать **Save Changes**
6. Render автоматически перезапустит сервис (подождать 2-3 минуты)

---

### ✅ Шаг 2: Redeploy Vercel (Frontend)

1. Открыть https://vercel.com/dashboard
2. Выбрать проект `lesnaya-komanda`
3. Перейти в **Deployments**
4. Найти последний деплой
5. Нажать **⋯** (три точки) → **Redeploy**
6. Подождать 1-2 минуты

---

### ✅ Шаг 3: Проверить работу

1. Открыть https://lesnaya-komanda.vercel.app/admin
2. Открыть консоль браузера (F12)
3. Ввести логин и пароль:
   - **Логин:** `LesnoyBOSS`
   - **Пароль:** `LesnoyBOSS909!`
4. Нажать "Войти"

#### Что должно быть в консоли:
```
Attempting login with: {username: "LesnoyBOSS", api_url: "https://lesnayakomanda.onrender.com"}
Login response status: 200
Login successful, token received: yes
```

#### Если видите ошибку CORS:
```
Access to fetch at 'https://lesnayakomanda.onrender.com/api/token' from origin 'https://lesnaya-komanda.vercel.app' has been blocked by CORS policy
```
→ Значит Render еще не перезапустился, подождите еще минуту.

---

### ✅ Шаг 4: Проверить редактирование

После успешного входа:

1. **Новости** → нажать ✏️ на любой новости → изменить текст → Сохранить
2. **События** → нажать ✏️ на любом событии → изменить дату → Сохранить
3. **Лента** → нажать ✏️ на любой записи → изменить заголовок → Сохранить

---

## 🐛 Если что-то не работает

### Проблема: "Неверный логин или пароль"

**Проверка 1:** API работает?
```bash
curl https://lesnayakomanda.onrender.com/api/
```
Должен вернуть: `{"status":"ok"}`

**Проверка 2:** Логин работает через Swagger?
1. Открыть https://lesnayakomanda.onrender.com/api/docs
2. POST `/api/token` → Try it out
3. Ввести:
   ```
   username: LesnoyBOSS
   password: LesnoyBOSS909!
   ```
4. Execute

Должен вернуть токен.

---

### Проблема: CORS ошибка

**Проверка:** CORS настроен?
```bash
curl -X OPTIONS https://lesnayakomanda.onrender.com/api/token \
  -H "Origin: https://lesnaya-komanda.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Должен вернуть:
```
< access-control-allow-origin: https://lesnaya-komanda.vercel.app
< access-control-allow-credentials: true
```

Если нет → проверить что переменные на Render сохранены и сервис перезапущен.

---

### Проблема: Бесконечная загрузка

**Причина:** Frontend не может подключиться к backend.

**Решение:**
1. Проверить что `NEXT_PUBLIC_API_URL` в Vercel = `https://lesnayakomanda.onrender.com`
2. Проверить что backend запущен на Render
3. Проверить что CORS настроен (см. выше)

---

## 📞 Контакты для помощи

Если ничего не помогло:
1. Скопировать ошибку из консоли браузера (F12)
2. Скопировать ошибку из логов Render (Logs tab)
3. Написать в Discord или создать issue на GitHub

---

**Последнее обновление:** 07.03.2026
