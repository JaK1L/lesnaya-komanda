# 🔧 Ручное исправление Render

## Проблема
Render все еще использует старый кэш без `slowapi`, несмотря на то что зависимость добавлена.

## Решение: Очистить кэш и передеплоить вручную

### Шаг 1: Открой Render Dashboard
https://dashboard.render.com/

### Шаг 2: Найди сервис
Найди сервис `lesnayakomanda` (или как он называется у тебя)

### Шаг 3: Очисти кэш и передеплой

#### Вариант A: Manual Deploy с очисткой кэша
1. Нажми на сервис
2. Нажми **"Manual Deploy"** (справа вверху)
3. Выбери **"Clear build cache & deploy"**
4. Подтверди

#### Вариант B: Через Settings
1. Нажми на сервис
2. Settings → Build & Deploy
3. Scroll down → **"Clear Build Cache"**
4. Нажми кнопку
5. Вернись на главную страницу сервиса
6. Нажми **"Manual Deploy"** → **"Deploy latest commit"**

### Шаг 4: Дождись завершения деплоя
- Время: ~2-3 минуты
- Статус должен стать: **"Live"**

### Шаг 5: Проверь логи
1. На странице сервиса нажми **"Logs"**
2. Должно быть:
   ```
   Installing dependencies from requirements.txt
   Successfully installed slowapi-0.1.9
   Application startup complete
   ```
3. НЕ должно быть:
   ```
   ModuleNotFoundError: No module named 'slowapi'
   ```

### Шаг 6: Проверь API
```powershell
curl https://lesnayakomanda.onrender.com/api/
# Должен вернуть: {"status":"ok"}
```

---

## Альтернативное решение: Проверить настройки Render

### Проверь Build Command
1. Settings → Build & Deploy
2. **Build Command** должна быть:
   ```
   pip install -r requirements.txt
   ```

### Проверь Start Command
1. Settings → Build & Deploy
2. **Start Command** должна быть:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Проверь Root Directory
1. Settings → Build & Deploy
2. **Root Directory** должна быть:
   ```
   backend
   ```

### Проверь Branch
1. Settings → Build & Deploy
2. **Branch** должна быть:
   ```
   main
   ```

---

## Если все еще не работает

### Вариант 1: Пересоздать сервис
Иногда проще пересоздать сервис с нуля:

1. **Удали старый сервис:**
   - Dashboard → Сервис → Settings → Delete Web Service

2. **Создай новый:**
   - New + → Web Service
   - Connect GitHub repo
   - Настройки:
     - Name: `lesnayakomanda`
     - Region: `Frankfurt (EU Central)`
     - Branch: `main`
     - Root Directory: `backend`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Instance Type: `Free`

3. **Добавь переменные окружения:**
   ```env
   DATABASE_URL=postgresql://...
   SECRET_KEY=<твой ключ>
   ALLOWED_ORIGINS=http://localhost:3000,https://lesnaya-komanda.vercel.app
   DISCORD_CLIENT_ID=1329022035062079540
   DISCORD_CLIENT_SECRET=Gt6g_0gQ13R-7Y7FZp0k2Xo8aZFQ7U8B
   FRONTEND_URL=https://lesnaya-komanda.vercel.app
   BACKEND_URL=https://lesnayakomanda.onrender.com
   ADMIN_USERNAME=LesnoyBOSS
   ADMIN_PASSWORD=LesnoyBOSS909!
   DEBUG=False
   ```

4. **Deploy**

### Вариант 2: Проверить GitHub
Убедись что изменения действительно на GitHub:

1. Открой: https://github.com/JaK1L/lesnaya-komanda
2. Перейди в `backend/requirements.txt`
3. Проверь что там есть строка:
   ```
   slowapi==0.1.9
   ```

Если нет - значит изменения не запушились. Повтори:
```powershell
git add backend/requirements.txt
git commit -m "fix: Add slowapi dependency"
git push origin main
```

---

## Проверка после исправления

### 1. Backend Health Check
```powershell
curl https://lesnayakomanda.onrender.com/api/
# Ожидается: {"status":"ok"}
```

### 2. API Docs
Открой: https://lesnayakomanda.onrender.com/api/docs
- Должен открыться Swagger UI

### 3. Полная проверка
```powershell
.\check-deployment.sh
```

---

## Текущий статус

- ✅ `slowapi==0.1.9` добавлен в requirements.txt
- ✅ Изменения закоммичены (commit: 7fec23b)
- ✅ Изменения запушены в GitHub
- ✅ Пустой коммит для форсирования деплоя (commit: d768f01)
- ⏳ Ожидание деплоя на Render

---

## Контакты для поддержки

Если ничего не помогает:
1. Render Support: https://render.com/docs/support
2. GitHub Issues: https://github.com/JaK1L/lesnaya-komanda/issues

---

**Создано:** 07.03.2026  
**Статус:** Ожидание ручного вмешательства  
**Рекомендация:** Очистить кэш на Render вручную
