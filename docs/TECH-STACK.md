# 🛠 Технологический стек проекта Lesnaya Komanda

## 📋 Оглавление
- [Frontend](#frontend)
- [Backend](#backend)
- [База данных](#база-данных)
- [Инфраструктура](#инфраструктура)
- [Внешние API](#внешние-api)
- [DevOps](#devops)

---

## Frontend

### Основной стек
- **Next.js 14.2.0** - React фреймворк с App Router
- **React 18.2.0** - UI библиотека
- **TypeScript 5.9.3** - Типизация

### UI/UX
- **CSS Modules** - Изолированные стили компонентов
- **Framer Motion 10.18.0** - Анимации и transitions
- **Lucide React 0.292.0** - Иконки
- **Manrope** - Основной шрифт (Google Fonts)

### HTTP клиент
- **Axios 1.6.2** - Запросы к API

### Тестирование
- **Vitest 4.0.18** - Unit тесты
- **@testing-library/react 16.3.2** - Тестирование компонентов
- **@testing-library/jest-dom 6.9.1** - DOM матчеры
- **jsdom 28.1.0** - DOM окружение для тестов
- **fast-check 4.5.3** - Property-based тестирование

### Dev Tools
- **ESLint 10.0.3** - Линтер
- **Autoprefixer 10.4.27** - CSS префиксы
- **PostCSS 8.5.6** - CSS обработка

---

## Backend

### Основной стек
- **FastAPI 0.104.1** - Асинхронный веб-фреймворк
- **Python 3.11+** - Язык программирования
- **Uvicorn 0.24.0** - ASGI сервер

### База данных
- **asyncpg 0.29.0** - Асинхронный PostgreSQL драйвер
- **psycopg2-binary 2.9.9** - PostgreSQL адаптер

### Валидация и настройки
- **Pydantic 2.5.0** - Валидация данных
- **pydantic-settings 2.1.0** - Управление настройками
- **python-dotenv 1.0.0** - Переменные окружения

### Аутентификация и безопасность
- **python-jose[cryptography] 3.3.0** - JWT токены
- **passlib[bcrypt] 1.7.4** - Хеширование паролей
- **bcrypt 4.1.2** - Криптография

### HTTP клиенты
- **httpx 0.25.1** - Асинхронные HTTP запросы
- **aiohttp 3.9.1** - Альтернативный HTTP клиент

### Фоновые задачи
- **Celery 5.3.4** - Очередь задач
- **Redis 5.0.1** - Брокер сообщений и кэш

### Файлы
- **aiofiles 23.2.1** - Асинхронная работа с файлами
- **python-multipart 0.0.6** - Загрузка файлов

---

## База данных

### Production
- **Neon PostgreSQL** - Serverless PostgreSQL
  - Автоматическое масштабирование
  - Встроенные бэкапы
  - Connection pooling

### Development
- **PostgreSQL 15** - Локальная разработка (Docker)

### Кэширование
- **Redis 7** - In-memory кэш
  - Сессии пользователей
  - Rate limiting
  - Кэш API запросов

---

## Инфраструктура

### Контейнеризация
- **Docker** - Контейнеры приложений
- **Docker Compose** - Оркестрация для разработки

### Хостинг

#### Production
- **Vercel** - Frontend (Next.js)
  - Автоматический CI/CD
  - Edge функции
  - Глобальный CDN
  
- **Render** - Backend (FastAPI)
  - Автоматический деплой из GitHub
  - Managed PostgreSQL (Neon)
  - Environment variables

#### Bot
- **Railway** или **Render** - Discord Bot
  - 24/7 uptime
  - Автоматические рестарты

---

## Внешние API

### Аутентификация
- **Discord OAuth 2.0**
  - Client ID: настроен
  - Client Secret: настроен
  - Scopes: identify, email, guilds

### Стриминг
- **Twitch API**
  - Client ID: `dq2bb5a60krg0kpvdkszicummue69m`
  - Client Secret: настроен
  - Получение статуса стрима
  - Информация о зрителях
  - Данные о игре

### Игровые API (планируется)
- **Steam API** - CS2, Dota 2 статистика
- **Riot Games API** - Valorant статистика

---

## DevOps

### Version Control
- **Git** - Система контроля версий
- **GitHub** - Хостинг репозитория
  - GitHub Actions (CI/CD)
  - Pull Requests
  - Issues tracking

### CI/CD
- **Vercel** - Автоматический деплой frontend
- **Render** - Автоматический деплой backend
- **GitHub Actions** - Тесты и проверки

### Мониторинг (планируется)
- **Sentry** - Error tracking
- **Vercel Analytics** - Frontend метрики
- **Render Metrics** - Backend метрики

---

## Архитектура проекта

```
lesnaya-komanda/
├── frontend/              # Next.js приложение
│   ├── app/              # App Router страницы
│   ├── components/       # React компоненты
│   ├── lib/             # Утилиты
│   └── public/          # Статические файлы
│
├── backend/              # FastAPI приложение
│   ├── app/
│   │   ├── routes/      # API эндпоинты
│   │   ├── services/    # Бизнес-логика
│   │   ├── models/      # Pydantic модели
│   │   ├── auth.py      # Аутентификация
│   │   ├── database.py  # БД подключение
│   │   └── main.py      # Точка входа
│   └── migrations/      # SQL миграции
│
├── bot/                  # Discord бот
│   ├── cogs/            # Команды бота
│   └── main.py          # Точка входа
│
├── docs/                 # Документация
└── docker-compose.yml    # Локальная разработка
```

---

## Переменные окружения

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://...
NEON_DATABASE_URL=postgresql://...

# Security
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000

# Discord OAuth
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_REDIRECT_URI=http://localhost:8000/api/auth/discord/callback

# Twitch API
TWITCH_CLIENT_ID=dq2bb5a60krg0kpvdkszicummue69m
TWITCH_CLIENT_SECRET=your-secret

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Redis
REDIS_URL=redis://localhost:6379/0
```

---

## Команды для разработки

### Frontend
```bash
npm run dev          # Запуск dev сервера
npm run build        # Production сборка
npm run start        # Запуск production
npm run test         # Запуск тестов
npm run test:watch   # Тесты в watch режиме
```

### Backend
```bash
uvicorn app.main:app --reload  # Dev сервер
python -m pytest               # Тесты
python setup_admin.py          # Создать админа
```

### Docker
```bash
docker-compose up -d           # Запуск всех сервисов
docker-compose down            # Остановка
docker-compose logs -f backend # Логи backend
```

---

## Производительность

### Frontend
- **Server-Side Rendering (SSR)** - Быстрая первая загрузка
- **Static Generation** - Кэширование статических страниц
- **Image Optimization** - Автоматическая оптимизация изображений
- **Code Splitting** - Ленивая загрузка компонентов
- **CSS Modules** - Минимальный CSS bundle

### Backend
- **Async/Await** - Неблокирующие операции
- **Connection Pooling** - Переиспользование БД соединений
- **Redis Caching** - Кэширование частых запросов
- **Rate Limiting** - Защита от перегрузки

---

## Безопасность

### Frontend
- **HTTPS Only** - Все запросы через HTTPS
- **XSS Protection** - React автоматически экранирует
- **CSRF Tokens** - Защита от CSRF атак
- **Content Security Policy** - Ограничение источников контента

### Backend
- **JWT Authentication** - Безопасные токены
- **Password Hashing** - Bcrypt с солью
- **Rate Limiting** - Защита от брутфорса
- **CORS** - Контроль доступа
- **SQL Injection Protection** - Параметризованные запросы
- **Input Validation** - Pydantic валидация

---

## Масштабируемость

### Текущая архитектура
- **Serverless Frontend** - Автоматическое масштабирование (Vercel)
- **Managed Backend** - Вертикальное масштабирование (Render)
- **Serverless Database** - Автоматическое масштабирование (Neon)

### Будущие улучшения
- **CDN** - Кэширование статики
- **Load Balancer** - Распределение нагрузки
- **Microservices** - Разделение на сервисы
- **Message Queue** - Асинхронная обработка задач

---

## Обновлено
Последнее обновление: 2025-03-11
