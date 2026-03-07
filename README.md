# 🌲 Лесная Команда

Веб-платформа для игрового сообщества с системой профилей, достижений, событий и интеграцией с Discord.

[![Deploy](https://github.com/your-username/lesnaya-komanda/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-username/lesnaya-komanda/actions/workflows/deploy.yml)
[![Tests](https://github.com/your-username/lesnaya-komanda/actions/workflows/test.yml/badge.svg)](https://github.com/your-username/lesnaya-komanda/actions/workflows/test.yml)

## 🚀 Быстрый старт

### Деплой за 5 минут

```bash
# Windows
.\deploy.ps1

# Linux/Mac
chmod +x deploy.sh && ./deploy.sh
```

### Локальная разработка

```bash
# С Docker
make dev-docker

# Без Docker
make dev
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev
```

📖 Подробнее: [QUICK-START.md](./QUICK-START.md)

---

## 📋 Возможности

### Для пользователей
- 🎮 **Профили игроков** - статистика, достижения, игровые аккаунты
- 🏆 **Система достижений** - 36 уникальных достижений
- 📅 **Календарь событий** - турниры, стримы, встречи
- 📰 **Новости** - актуальная информация о сообществе
- 🛍️ **Мерч** - магазин товаров сообщества
- 📺 **Стримеры** - список активных стримеров
- 🔐 **Discord OAuth** - вход через Discord

### Для администраторов
- ⚙️ **Админ-панель** - управление контентом
- ✏️ **Редактирование** - новости, события, достижения
- 👥 **Управление пользователями** - роли, статистика
- 📊 **Аналитика** - Google Analytics, Yandex Metrika

### Технические
- ⚡ **Высокая производительность** - Next.js 14, FastAPI
- 🔒 **Безопасность** - JWT, CORS, rate limiting
- 📱 **Адаптивный дизайн** - работает на всех устройствах
- 🌐 **SEO оптимизация** - meta tags, sitemap
- 🤖 **Discord бот** - интеграция с сервером

---

## 🏗️ Архитектура

```
┌─────────────────┐
│   Пользователь  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Frontend       │─────▶│  Backend     │
│  Next.js 14     │      │  FastAPI     │
│  (Vercel)       │      │  (Render)    │
└─────────────────┘      └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  Database    │
                         │  PostgreSQL  │
                         │  (Neon)      │
                         └──────────────┘
                                ▲
                                │
                         ┌──────┴───────┐
                         │  Discord Bot │
                         │  (Railway)   │
                         └──────────────┘
```

---

## 🛠️ Технологии

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Testing:** Vitest, Testing Library

### Backend
- **Framework:** FastAPI
- **Language:** Python 3.12
- **Database:** PostgreSQL (asyncpg)
- **Cache:** Redis
- **Auth:** JWT (python-jose)
- **Password:** bcrypt
- **Server:** Uvicorn

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render
- **Database:** Neon (PostgreSQL)
- **Bot Hosting:** Railway
- **CI/CD:** GitHub Actions
- **Monitoring:** Google Analytics, Yandex Metrika

---

## 📦 Структура проекта

```
lesnaya-komanda/
├── frontend/              # Next.js приложение
│   ├── app/              # App Router страницы
│   ├── components/       # React компоненты
│   ├── lib/              # Утилиты и API клиент
│   └── public/           # Статические файлы
├── backend/              # FastAPI приложение
│   ├── app/              # Исходный код
│   │   ├── routes/       # API эндпоинты
│   │   ├── services/     # Бизнес-логика
│   │   └── models/       # Модели данных
│   └── migrations/       # SQL миграции
├── bot/                  # Discord бот
│   ├── cogs/             # Команды бота
│   └── main.py           # Точка входа
├── .github/              # GitHub Actions
│   └── workflows/        # CI/CD пайплайны
└── docs/                 # Документация
```

---

## 🌐 URLs

### Production
- **Frontend:** https://lesnaya-komanda.vercel.app
- **Backend:** https://lesnayakomanda.onrender.com
- **API Docs:** https://lesnayakomanda.onrender.com/api/docs
- **Admin:** https://lesnaya-komanda.vercel.app/admin

### Дашборды
- **Render:** https://dashboard.render.com/
- **Vercel:** https://vercel.com/dashboard
- **Railway:** https://railway.app/dashboard
- **Neon:** https://console.neon.tech/

---

## 📚 Документация

### Деплой
- [QUICK-START.md](./QUICK-START.md) - Быстрый старт
- [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md) - Краткий гайд по деплою
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Полная документация по деплою
- [ENV-VARIABLES.md](./ENV-VARIABLES.md) - Переменные окружения

### Разработка
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Как контрибьютить
- [frontend/SEO-CHECKLIST.md](./frontend/SEO-CHECKLIST.md) - SEO чеклист

### Настройка
- [IMAGE-UPLOAD-SETUP.md](./IMAGE-UPLOAD-SETUP.md) - Загрузка изображений
- [ANALYTICS-SETUP.md](./ANALYTICS-SETUP.md) - Настройка аналитики
- [ERROR-BOUNDARIES-SETUP.md](./ERROR-BOUNDARIES-SETUP.md) - Обработка ошибок

---

## 🔧 Команды

```bash
# Разработка
make dev              # Запустить локально
make dev-docker       # Запустить в Docker
make install          # Установить зависимости

# Деплой
make deploy           # Задеплоить на production
make check            # Проверить деплой

# Тестирование
make test             # Запустить тесты
make lint             # Проверить код

# База данных
make db-migrate       # Применить миграции
make db-seed          # Заполнить тестовыми данными
make admin-create     # Создать админа

# Утилиты
make clean            # Очистить временные файлы
make status           # Показать статус сервисов
make urls             # Показать все URLs
make help             # Показать все команды
```

---

## 🔐 Переменные окружения

### Backend (Render)
```env
DATABASE_URL=postgresql://...
SECRET_KEY=<генерировать случайно>
ALLOWED_ORIGINS=https://lesnaya-komanda.vercel.app
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
FRONTEND_URL=https://lesnaya-komanda.vercel.app
BACKEND_URL=https://lesnayakomanda.onrender.com
ADMIN_USERNAME=LesnoyBOSS
ADMIN_PASSWORD=LesnoyBOSS909!
DEBUG=False
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com
NEXT_PUBLIC_GA_ID=G-3437T4EM9D
NEXT_PUBLIC_YM_ID=107194144
NEXT_PUBLIC_IMGBB_API_KEY=...
```

📖 Подробнее: [ENV-VARIABLES.md](./ENV-VARIABLES.md)

---

## 🧪 Тестирование

```bash
# Frontend тесты
cd frontend
npm test

# Backend проверка
cd backend
python -m py_compile app/*.py

# Проверка деплоя
make check
```

---

## 🚀 Деплой

### Автоматический (рекомендуется)

```bash
git push origin main
```

После пуша автоматически запустятся:
- ✅ GitHub Actions проверит код
- ✅ Vercel задеплоит frontend
- ✅ Render задеплоит backend
- ✅ Railway задеплоит бота

### С проверкой

```bash
# Windows
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

Скрипт автоматически проверит все сервисы после деплоя.

---

## 📊 Мониторинг

### Uptime мониторинг
Настроить на https://uptimerobot.com:
- Frontend: https://lesnaya-komanda.vercel.app
- Backend: https://lesnayakomanda.onrender.com/api/

### Логи
- **Frontend:** Vercel Dashboard → Logs
- **Backend:** Render Dashboard → Logs
- **Bot:** Railway Dashboard → Logs
- **Database:** Neon Dashboard → Monitoring

### Аналитика
- **Google Analytics:** https://analytics.google.com
- **Yandex Metrika:** https://metrika.yandex.ru

---

## 🐛 Troubleshooting

### Backend не запускается
```bash
# Проверить логи
https://dashboard.render.com/ → Logs

# Частые проблемы:
# - DATABASE_URL неправильный
# - SECRET_KEY слишком короткий
# - Зависимости не установились
```

### CORS ошибка
```bash
# Проверить ALLOWED_ORIGINS на Render
# Должен содержать: https://lesnaya-komanda.vercel.app
```

### Frontend не подключается к API
```bash
# Проверить NEXT_PUBLIC_API_URL на Vercel
# Должен быть: https://lesnayakomanda.onrender.com
```

📖 Подробнее: [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

---

## 💰 Стоимость

Все сервисы на бесплатных планах:
- **Neon:** 0.25 vCPU, 1GB storage
- **Vercel:** 100GB bandwidth
- **Render:** 750 часов/месяц
- **Railway:** $5 кредитов/месяц

**Итого: $0/месяц**

---

## 🤝 Контрибьюция

Мы приветствуем вклад в проект! См. [CONTRIBUTING.md](./CONTRIBUTING.md)

1. Fork репозиторий
2. Создать ветку: `git checkout -b feature/amazing-feature`
3. Закоммитить: `git commit -m 'Add amazing feature'`
4. Запушить: `git push origin feature/amazing-feature`
5. Открыть Pull Request

---

## 📝 Лицензия

MIT License - см. [LICENSE](./LICENSE)

---

## 👥 Команда

- **Разработка:** Лесная Команда
- **Discord:** [Присоединиться](https://discord.gg/lesnaya-komanda)
- **Сайт:** https://lesnaya-komanda.vercel.app

---

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) - React фреймворк
- [FastAPI](https://fastapi.tiangolo.com/) - Python веб-фреймворк
- [Vercel](https://vercel.com/) - Frontend хостинг
- [Render](https://render.com/) - Backend хостинг
- [Neon](https://neon.tech/) - PostgreSQL база данных
- [Railway](https://railway.app/) - Bot хостинг

---

**Последнее обновление:** 07.03.2026  
**Версия:** 1.0.0
