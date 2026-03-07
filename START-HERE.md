# 🎯 НАЧНИ ЗДЕСЬ

Привет! Это твоя отправная точка для деплоя проекта "Лесная Команда".

---

## ⚡ Что делать прямо сейчас

### Вариант 1: Автоматический деплой (5 минут)

Если у тебя уже настроены Render, Vercel и Railway:

```powershell
# Просто запусти этот скрипт
.\deploy.ps1
```

Скрипт сделает все сам и выдаст отчет.

### Вариант 2: Первый раз деплоишь (30 минут)

Если это первый деплой, следуй пошаговой инструкции:

📖 **[DEPLOY-NOW.md](./DEPLOY-NOW.md)** - Открой этот файл и следуй инструкциям

---

## 📚 Какую документацию читать

### Ты новичок в деплое?
1. **[DEPLOY-NOW.md](./DEPLOY-NOW.md)** - Пошаговая инструкция (30 минут)
2. **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** - Чеклист для проверки

### Ты опытный разработчик?
1. **[QUICK-START.md](./QUICK-START.md)** - Быстрый старт (5 минут)
2. **[CHEATSHEET.md](./CHEATSHEET.md)** - Шпаргалка с командами

### Нужна полная документация?
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Полная документация
2. **[ENV-VARIABLES.md](./ENV-VARIABLES.md)** - Все переменные окружения

### Возникла проблема?
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** → Troubleshooting
2. **[FIX-CORS-RENDER.md](./FIX-CORS-RENDER.md)** - CORS ошибки

---

## 🎯 Твой план действий

### Шаг 1: Проверь что у тебя есть

- [ ] Аккаунт на GitHub
- [ ] Репозиторий `lesnaya-komanda` на GitHub
- [ ] Код запушен в main ветку

### Шаг 2: Создай аккаунты (если еще нет)

- [ ] Neon: https://console.neon.tech/ (база данных)
- [ ] Render: https://dashboard.render.com/ (backend)
- [ ] Vercel: https://vercel.com/ (frontend)
- [ ] Railway: https://railway.app/ (Discord bot)

Все можно создать через GitHub OAuth - быстро и просто.

### Шаг 3: Следуй инструкции

Открой **[DEPLOY-NOW.md](./DEPLOY-NOW.md)** и следуй пошагово.

Там все расписано:
- Что нажимать
- Какие значения вводить
- Как проверить что все работает

### Шаг 4: Проверь результат

После деплоя запусти:
```powershell
.\check-deployment.sh
```

Или проверь вручную:
- Frontend: https://lesnaya-komanda.vercel.app
- Backend: https://lesnayakomanda.onrender.com/api/
- Admin: https://lesnaya-komanda.vercel.app/admin

---

## 🚀 Быстрые команды

```powershell
# Деплой
.\deploy.ps1

# Проверка
.\check-deployment.sh

# Локальная разработка
make dev

# Все команды
make help
```

---

## 🌐 Важные ссылки

### Production URLs
- Frontend: https://lesnaya-komanda.vercel.app
- Backend: https://lesnayakomanda.onrender.com
- API Docs: https://lesnayakomanda.onrender.com/api/docs
- Admin: https://lesnaya-komanda.vercel.app/admin

### Дашборды
- Render: https://dashboard.render.com/
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
- Neon: https://console.neon.tech/
- Discord: https://discord.com/developers/applications

---

## 🔐 Учетные данные

### Админ-панель
```
Логин: LesnoyBOSS
Пароль: LesnoyBOSS909!
```

### Discord OAuth
```
Client ID: 1329022035062079540
Client Secret: Gt6g_0gQ13R-7Y7FZp0k2Xo8aZFQ7U8B
```

### Discord Guild
```
Guild ID: 236652227060563969
```

---

## 📋 Чеклист первого деплоя

### Подготовка
- [ ] Код на GitHub
- [ ] Аккаунты созданы (Neon, Render, Vercel, Railway)
- [ ] Discord приложение создано

### Neon (База данных)
- [ ] Проект создан
- [ ] DATABASE_URL скопирован

### Render (Backend)
- [ ] Web Service создан
- [ ] GitHub подключен
- [ ] Переменные окружения добавлены
- [ ] Первый деплой успешен
- [ ] Health check работает

### Vercel (Frontend)
- [ ] Проект импортирован
- [ ] Переменные окружения добавлены
- [ ] Первый деплой успешен
- [ ] Сайт открывается

### Railway (Bot)
- [ ] Проект создан
- [ ] Переменные окружения добавлены
- [ ] Бот запущен
- [ ] Бот онлайн в Discord

### Проверка
- [ ] Backend отвечает
- [ ] Frontend загружается
- [ ] Admin логин работает
- [ ] Bot отвечает на команды
- [ ] CORS настроен правильно

---

## 🐛 Частые проблемы

### Backend не запускается
```
Проблема: Render показывает ошибку при деплое
Решение: Проверь логи → https://dashboard.render.com/ → Logs
Частые причины:
- DATABASE_URL неправильный
- SECRET_KEY слишком короткий
- Зависимости не установились
```

### CORS ошибка
```
Проблема: Frontend не может подключиться к Backend
Решение: Проверь ALLOWED_ORIGINS на Render
Должен содержать: https://lesnaya-komanda.vercel.app
```

### Frontend не подключается
```
Проблема: API запросы не проходят
Решение: Проверь NEXT_PUBLIC_API_URL на Vercel
Должен быть: https://lesnayakomanda.onrender.com
```

### Bot не отвечает
```
Проблема: Бот оффлайн в Discord
Решение: Проверь логи → https://railway.app/dashboard → Logs
Частые причины:
- DISCORD_BOT_TOKEN неправильный
- Bot не добавлен на сервер
- Intents не включены
```

---

## 💡 Полезные советы

### Совет 1: Используй скрипты
Не делай все вручную - используй автоматические скрипты:
```powershell
.\deploy.ps1           # Деплой
.\check-deployment.sh  # Проверка
```

### Совет 2: Проверяй логи
Если что-то не работает - первым делом смотри логи:
- Render: https://dashboard.render.com/ → Logs
- Vercel: https://vercel.com/dashboard → Logs
- Railway: https://railway.app/dashboard → Logs

### Совет 3: Используй чеклист
Следуй чеклисту чтобы ничего не забыть:
📖 **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)**

### Совет 4: Держи шпаргалку под рукой
Сохрани в закладки:
📖 **[CHEATSHEET.md](./CHEATSHEET.md)**

---

## 📞 Нужна помощь?

### Документация
1. **[DOCS-INDEX.md](./DOCS-INDEX.md)** - Индекс всей документации
2. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Полная документация
3. **[TROUBLESHOOTING]** - Раздел в DEPLOYMENT.md

### Проверка
```powershell
# Автоматическая диагностика
.\check-deployment.sh
```

### Поддержка
- GitHub Issues: https://github.com/your-username/lesnaya-komanda/issues
- Discord сервер: Лесная Команда

---

## 🎉 Готов начать?

### Если это первый раз:
👉 Открой **[DEPLOY-NOW.md](./DEPLOY-NOW.md)** и следуй инструкциям

### Если уже настроено:
👉 Запусти `.\deploy.ps1`

### Если нужна справка:
👉 Открой **[CHEATSHEET.md](./CHEATSHEET.md)**

---

## ⏱️ Сколько времени займет?

- **Первый деплой:** ~30 минут
- **Последующие деплои:** ~2 минуты (автоматически)
- **Проверка:** ~3 минуты

---

## 💰 Сколько стоит?

**$0/месяц** - все на бесплатных планах!

- Neon: 0.25 vCPU, 1GB storage
- Vercel: 100GB bandwidth
- Render: 750 часов/месяц
- Railway: $5 кредитов/месяц

---

## ✅ Следующие шаги после деплоя

1. Заполни БД тестовыми данными
2. Настрой мониторинг (UptimeRobot)
3. Проверь аналитику (GA, YM)
4. Объяви о запуске в Discord
5. Пригласи пользователей

---

**Удачи с деплоем! 🚀**

Если возникнут вопросы - вся документация в папке проекта.

---

**Создано:** 07.03.2026  
**Версия:** 1.0.0
