# 🌲 Лесная Команда

> Платформа игрового сообщества с интеграцией Discord

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Discord.py](https://img.shields.io/badge/Discord.py-2.3-5865F2)](https://discordpy.readthedocs.io/)

## 📋 О проекте

**Лесная Команда** - это полнофункциональная веб-платформа для игрового сообщества с интеграцией Discord. Проект включает в себя сайт, API и Discord бота для управления сообществом.

### ✨ Основные возможности

- 👥 **Профили игроков** - персональные страницы с статистикой и достижениями
- 📊 **Рейтинговая система** - отслеживание активности и прогресса
- 🎮 **Discord интеграция** - синхронизация данных, статусы, активность
- 📰 **Новости и события** - информация о турнирах и мероприятиях
- 🎬 **Стримы** - список стримеров команды с live статусом
- 🌐 **Соцсети** - все каналы команды в одном месте
- 🤖 **Discord бот** - команды для взаимодействия с сайтом

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Discord Bot Token

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/JaK1L/lesnaya-komanda.git
cd lesnaya-komanda

# Установить зависимости frontend
cd frontend
npm install

# Установить зависимости backend
cd ../backend
pip install -r requirements.txt

# Установить зависимости бота
cd ../bot
pip install -r requirements.txt
```

### Настройка

1. **Frontend** - создать `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_YM_ID=XXXXXXXX
```

2. **Backend** - создать `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/lesnaya
SECRET_KEY=your-secret-key
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
ALLOWED_ORIGINS=http://localhost:3000
```

3. **Bot** - создать `.env`:
```env
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_GUILD_ID=your-guild-id
DATABASE_URL=postgresql://user:password@localhost:5432/lesnaya
API_URL=http://localhost:8000
WEBSITE_URL=http://localhost:3000
```

### Запуск

```bash
# Frontend (в папке frontend)
npm run dev
# Откроется на http://localhost:3000

# Backend (в папке backend)
python -m uvicorn app.main:app --reload
# Откроется на http://localhost:8000

# Bot (в папке bot)
python main.py
```

## 📁 Структура проекта

```
lesnaya-komanda/
├── frontend/              # Next.js приложение
│   ├── app/              # Страницы (App Router)
│   ├── components/       # React компоненты
│   ├── lib/              # Утилиты
│   └── hooks/            # Custom hooks
│
├── backend/              # FastAPI сервер
│   ├── app/
│   │   ├── routes/      # API эндпоинты
│   │   ├── services/    # Бизнес-логика
│   │   └── models/      # Pydantic модели
│   └── seed_data.sql    # Тестовые данные
│
└── bot/                  # Discord бот
    ├── cogs/            # Модули команд
    └── main.py          # Основной файл
```

## 🎯 Технологии

### Frontend
- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - Типизация
- **CSS Modules** - Стили
- **Framer Motion** - Анимации
- **Axios** - HTTP клиент

### Backend
- **FastAPI** - Python веб-фреймворк
- **PostgreSQL** - База данных
- **asyncpg** - Async PostgreSQL драйвер
- **Pydantic** - Валидация данных
- **JWT** - Аутентификация

### Bot
- **Discord.py** - Discord API
- **asyncpg** - База данных
- **aiohttp** - HTTP клиент

## 📚 Документация

- [API Documentation](http://localhost:8000/api/docs) - Swagger UI
- [Bot Commands](./bot/BOT-COMMANDS.md) - Команды Discord бота
- [Seed Data Guide](./backend/SEED_DATA_README.md) - Заполнение БД
- [Monitoring Setup](./MONITORING-SETUP.md) - Настройка аналитики
- [SEO Checklist](./frontend/SEO-CHECKLIST.md) - SEO оптимизация

## 🎮 Discord бот

### Основные команды

```
!помощь              # Список всех команд
!сайт                # Ссылка на сайт
!мойпрофиль          # Твой профиль
!новости             # Последние новости
!события             # Ближайшие события
!стримы              # Страница стримов
!профиль @user       # Профиль пользователя
!топ                 # Топ по активности
```

Полный список команд: [BOT-COMMANDS.md](./bot/BOT-COMMANDS.md)

## 🗄️ База данных

### Инициализация

```bash
# Создать базу данных
createdb lesnaya_komanda

# Применить миграции (выполняется автоматически при запуске backend)
# Или вручную через psql
psql -d lesnaya_komanda -f backend/init.sql
```

### Заполнение тестовыми данными

```bash
cd backend
python seed_database.py
```

Или через SQL:
```bash
psql -d lesnaya_komanda -f backend/seed_data.sql
```

## 🚀 Деплой

### Frontend (Vercel)

1. Подключить GitHub репозиторий к Vercel
2. Настроить переменные окружения
3. Деплой происходит автоматически при push

### Backend (Render/Railway)

1. Создать новый проект
2. Подключить GitHub
3. Добавить PostgreSQL
4. Настроить переменные окружения
5. Деплой автоматический

### Bot (Railway)

1. Создать новый проект
2. Подключить GitHub
3. Указать папку `bot` как root
4. Настроить переменные окружения
5. Деплой автоматический

Подробнее: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🧪 Тестирование

```bash
# Frontend тесты
cd frontend
npm test

# Backend тесты (если добавлены)
cd backend
pytest

# Проверка типов
npm run type-check
```

## 📊 Мониторинг

Проект поддерживает интеграцию с:
- **Google Analytics** - веб-аналитика
- **Yandex Metrika** - российская аналитика
- **Sentry** - отслеживание ошибок (опционально)

Настройка: [MONITORING-SETUP.md](./MONITORING-SETUP.md)

## 🤝 Участие в разработке

Мы приветствуем вклад в проект! 

1. Fork репозитория
2. Создать ветку: `git checkout -b feature/amazing-feature`
3. Commit изменений: `git commit -m 'Add amazing feature'`
4. Push в ветку: `git push origin feature/amazing-feature`
5. Открыть Pull Request

### Стандарты кода

- TypeScript strict mode
- ESLint + Prettier
- Тесты для новых фич
- Документация в коде

## 📝 Лицензия

MIT License - см. [LICENSE](./LICENSE)

## 👥 Команда

- **JaK1L** - Основатель и разработчик

## 🔗 Ссылки

- **Сайт**: https://lesnaya-komanda.vercel.app
- **Discord**: https://discord.gg/YgX4RQZ
- **GitHub**: https://github.com/JaK1L/lesnaya-komanda

## 📈 Статус проекта

- ✅ MVP готов
- ✅ Production Ready
- ✅ Все основные фичи реализованы
- 🔄 Активная разработка

## 🎯 Roadmap

- [x] Базовый функционал
- [x] Discord интеграция
- [x] Система профилей
- [x] Новости и события
- [x] Стримы и соцсети
- [ ] Админ-панель
- [ ] Расширенная система достижений
- [ ] Интеграция с игровыми API
- [ ] Мобильное приложение

## 💡 Особенности

### Производительность
- ⚡ Lighthouse Score: 95+
- 📦 Bundle size: < 200KB (gzipped)
- 🎨 Mobile-First дизайн
- ♿ WCAG 2.1 AA совместимость

### Безопасность
- 🔐 JWT аутентификация
- 🛡️ CORS настроен
- 🔒 HTTPS only
- 🚫 XSS защита

### SEO
- 📱 Responsive meta tags
- 🔍 Sitemap.xml
- 🤖 Robots.txt
- 📊 Structured data (JSON-LD)

## 🐛 Известные проблемы

Нет критичных проблем. Минорные улучшения отслеживаются в [Issues](https://github.com/JaK1L/lesnaya-komanda/issues).

## 📞 Поддержка

Если у вас есть вопросы или проблемы:
- Создайте [Issue](https://github.com/JaK1L/lesnaya-komanda/issues)
- Напишите в [Discord](https://discord.gg/YgX4RQZ)

---

**Сделано с 🌲 в лесу**

*Последнее обновление: 07.03.2026*
