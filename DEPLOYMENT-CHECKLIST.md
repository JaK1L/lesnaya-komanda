# ✅ Чеклист для деплоя

Используйте этот чеклист для первичной настройки и проверки деплоя.

---

## 📋 Первичная настройка

### 1. Neon (База данных)
- [ ] Создан аккаунт на https://console.neon.tech/
- [ ] Создан проект `lesnaya-komanda`
- [ ] Выбран регион: Europe (Frankfurt)
- [ ] Скопирован `DATABASE_URL`
- [ ] Проверено подключение: `psql "DATABASE_URL"`

### 2. Render (Backend)
- [ ] Создан аккаунт на https://dashboard.render.com/
- [ ] Создан Web Service
- [ ] Подключен GitHub репозиторий
- [ ] Настроены параметры:
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - [ ] Instance Type: Free
- [ ] Добавлены переменные окружения (см. ниже)
- [ ] Первый деплой успешен
- [ ] Health check работает: `curl https://your-backend.onrender.com/api/`

### 3. Vercel (Frontend)
- [ ] Создан аккаунт на https://vercel.com/
- [ ] Импортирован проект из GitHub
- [ ] Настроены параметры:
  - [ ] Root Directory: `frontend`
  - [ ] Framework: Next.js
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`
- [ ] Добавлены переменные окружения (см. ниже)
- [ ] Первый деплой успешен
- [ ] Сайт открывается: https://your-project.vercel.app

### 4. Railway (Discord Bot)
- [ ] Создан аккаунт на https://railway.app/
- [ ] Создан проект из GitHub
- [ ] Настроены параметры:
  - [ ] Root Directory: `bot`
  - [ ] Start Command: `python main.py`
- [ ] Добавлены переменные окружения (см. ниже)
- [ ] Бот запущен
- [ ] Бот онлайн в Discord

### 5. Discord OAuth
- [ ] Создано приложение в https://discord.com/developers/applications
- [ ] Скопированы Client ID и Client Secret
- [ ] Добавлен Redirect URL: `https://your-backend.onrender.com/api/auth/discord/callback`
- [ ] Включены Intents:
  - [ ] Presence Intent
  - [ ] Server Members Intent
  - [ ] Message Content Intent
- [ ] Бот добавлен на сервер

---

## 🔐 Переменные окружения

### Render (Backend)
```env
✅ DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
✅ SECRET_KEY=<сгенерировать: python -c "import secrets; print(secrets.token_urlsafe(32))">
✅ ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
✅ DISCORD_CLIENT_ID=...
✅ DISCORD_CLIENT_SECRET=...
✅ FRONTEND_URL=https://your-frontend.vercel.app
✅ BACKEND_URL=https://your-backend.onrender.com
✅ ADMIN_USERNAME=LesnoyBOSS
✅ ADMIN_PASSWORD=LesnoyBOSS909!
✅ DEBUG=False
```

### Vercel (Frontend)
```env
✅ NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
✅ NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
✅ NEXT_PUBLIC_YM_ID=XXXXXXXX
✅ NEXT_PUBLIC_IMGBB_API_KEY=...
```

### Railway (Bot)
```env
✅ DISCORD_BOT_TOKEN=...
✅ DISCORD_GUILD_ID=236652227060563969
✅ DATABASE_URL=<тот же что и на Render>
✅ API_URL=https://your-backend.onrender.com
✅ WEBSITE_URL=https://your-frontend.vercel.app
```

---

## 🗄️ База данных

### Инициализация
- [ ] Подключение к БД работает
- [ ] Таблицы созданы автоматически при первом запуске backend
- [ ] Или применены миграции вручную:
  ```bash
  cd backend
  python apply_achievements_migration.py
  python apply_events_migration.py
  python apply_news_migration.py
  python apply_streamers_migration.py
  python apply_merch_migration.py
  ```

### Тестовые данные
- [ ] Заполнена БД тестовыми данными:
  ```bash
  cd backend
  python seed_database.py
  ```

### Админ
- [ ] Создан админ пользователь:
  ```bash
  cd backend
  python create_admin.py
  ```
- [ ] Или через SQL:
  ```sql
  UPDATE admin_users 
  SET 
      username = 'LesnoyBOSS',
      password_hash = '$2b$12$KLgqVoHH3ZkRanbKF5M0f.KrRP32hM4R4cCwN26Km4Uc4K0jfr5v.',
      role = 'admin'
  WHERE id = 1;
  ```

---

## 🧪 Проверка после деплоя

### Backend
- [ ] Health check: `curl https://your-backend.onrender.com/api/`
  - Ожидается: `{"status":"ok"}`
- [ ] API Docs: https://your-backend.onrender.com/api/docs
  - Swagger UI открывается
- [ ] Тест логина через Swagger:
  - POST `/api/token`
  - username: `LesnoyBOSS`
  - password: `LesnoyBOSS909!`
  - Возвращает токен

### Frontend
- [ ] Главная страница: https://your-frontend.vercel.app
  - Загружается без ошибок
- [ ] Навигация работает:
  - [ ] / (главная)
  - [ ] /profile (профиль)
  - [ ] /social (социальные сети)
  - [ ] /streams (стримы)
  - [ ] /admin (админка)
- [ ] API запросы проходят (DevTools → Network)
- [ ] Нет CORS ошибок в консоли

### Admin Panel
- [ ] Открывается: https://your-frontend.vercel.app/admin
- [ ] Логин работает:
  - Логин: `LesnoyBOSS`
  - Пароль: `LesnoyBOSS909!`
- [ ] Разделы доступны:
  - [ ] Новости
  - [ ] События
  - [ ] Лента
  - [ ] Достижения
  - [ ] Мерч
  - [ ] Стримеры
  - [ ] Пользователи
- [ ] Редактирование работает:
  - [ ] Можно изменить новость
  - [ ] Можно изменить событие
  - [ ] Изменения сохраняются

### Discord Bot
- [ ] Бот онлайн в Discord
- [ ] Команды работают:
  - [ ] `!помощь` - показывает список команд
  - [ ] `!сайт` - возвращает ссылку на сайт
  - [ ] `!профиль` - показывает профиль
- [ ] Подключение к БД работает
- [ ] API запросы проходят

### CORS
- [ ] CORS настроен правильно:
  ```bash
  curl -X OPTIONS https://your-backend.onrender.com/api/token \
    -H "Origin: https://your-frontend.vercel.app" \
    -H "Access-Control-Request-Method: POST" \
    -v
  ```
  - Ожидается: `access-control-allow-origin: https://your-frontend.vercel.app`

### SSL
- [ ] SSL сертификат валиден
- [ ] HTTPS работает на всех сервисах
- [ ] Редирект с HTTP на HTTPS работает

---

## 🌐 Домен (опционально)

### Настройка
- [ ] Куплен домен
- [ ] DNS настроен для Frontend (Vercel):
  ```
  A     @    76.76.21.21
  CNAME www  cname.vercel-dns.com
  ```
- [ ] DNS настроен для Backend (Render):
  ```
  CNAME api  your-backend.onrender.com
  ```
- [ ] Домен добавлен в Vercel
- [ ] Домен добавлен в Render
- [ ] SSL сертификаты выпущены автоматически

### Обновление переменных
- [ ] Backend `ALLOWED_ORIGINS` обновлен на домен
- [ ] Backend `FRONTEND_URL` обновлен на домен
- [ ] Frontend `NEXT_PUBLIC_API_URL` обновлен на api.домен
- [ ] Discord OAuth Redirect обновлен на api.домен
- [ ] Bot `API_URL` и `WEBSITE_URL` обновлены

---

## 📊 Мониторинг

### Uptime мониторинг
- [ ] Настроен на https://uptimerobot.com
- [ ] Мониторится Frontend
- [ ] Мониторится Backend
- [ ] Настроены алерты (Email/Telegram)

### Аналитика
- [ ] Google Analytics настроен
  - [ ] Создан аккаунт
  - [ ] Создан ресурс
  - [ ] GA_ID добавлен в Vercel
  - [ ] Трекинг работает
- [ ] Yandex Metrika настроена
  - [ ] Создан счетчик
  - [ ] YM_ID добавлен в Vercel
  - [ ] Трекинг работает

### Логи
- [ ] Проверены логи Render (нет ошибок)
- [ ] Проверены логи Vercel (нет ошибок)
- [ ] Проверены логи Railway (бот работает)
- [ ] Проверены логи Neon (БД работает)

---

## 🚀 CI/CD

### GitHub Actions
- [ ] Workflow `deploy.yml` настроен
- [ ] Workflow `test.yml` настроен
- [ ] Автоматический деплой работает при push в main
- [ ] Тесты запускаются при PR

### Автоматизация
- [ ] Скрипт `deploy.sh` работает
- [ ] Скрипт `deploy.ps1` работает (Windows)
- [ ] Скрипт `check-deployment.sh` работает
- [ ] Makefile команды работают

---

## 📝 Документация

### Обновлена
- [ ] README.md
- [ ] DEPLOYMENT.md
- [ ] ENV-VARIABLES.md
- [ ] QUICK-START.md

### Проверена
- [ ] Все ссылки работают
- [ ] Все команды актуальны
- [ ] Все URLs правильные

---

## 🔒 Безопасность

### Проверка
- [ ] Все SECRET_KEY уникальные и длинные (32+ символов)
- [ ] DATABASE_URL не в публичном репозитории
- [ ] CORS настроен только для нужных доменов
- [ ] HTTPS принудительный везде
- [ ] Discord Bot Token в секрете
- [ ] Rate limiting настроен в backend
- [ ] SQL injection защита (параметризованные запросы)
- [ ] XSS защита (React экранирует по умолчанию)

### Регулярные проверки
- [ ] Настроено обновление зависимостей
- [ ] Настроен мониторинг логов
- [ ] Настроены бэкапы БД (Neon делает автоматически)

---

## ✅ Финальная проверка

### Функциональность
- [ ] Все страницы загружаются
- [ ] Все API эндпоинты работают
- [ ] Админка полностью функциональна
- [ ] Discord бот отвечает на команды
- [ ] Аналитика собирает данные

### Производительность
- [ ] Backend отвечает < 2 секунд
- [ ] Frontend загружается < 3 секунд
- [ ] Нет memory leaks
- [ ] Нет N+1 запросов

### UX
- [ ] Мобильная версия работает
- [ ] Все анимации плавные
- [ ] Нет битых ссылок
- [ ] Все изображения загружаются
- [ ] Формы валидируются

---

## 🎉 Готово к production!

Если все пункты отмечены ✅, ваш проект готов к production!

### Следующие шаги:
1. Объявить о запуске в Discord
2. Пригласить пользователей
3. Мониторить логи первые дни
4. Собирать фидбек
5. Планировать следующие фичи

---

**Дата проверки:** _____________  
**Проверил:** _____________  
**Статус:** ⬜ Готов / ⬜ Требуется доработка

---

**Последнее обновление:** 07.03.2026
