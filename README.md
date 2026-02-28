# 🌲 Лесная Команда

Игровое сообщество для CS2, Dota 2, Valorant и других игр.

## 🚀 Быстрый старт

### Требования

- **Python 3.11 или 3.12** (для backend). **Не используйте Python 3.14** — у pydantic пока нет готовых сборок под него.
- **Node.js 18+** (для frontend)
- **PostgreSQL** (локальная база данных)

### Установка

1. **Установите зависимости:**
   ```bash
   install-dependencies.bat
   ```

2. **Настройте базу данных:**
   - Установите PostgreSQL локально
   - Создайте базу данных `lesnaya`
   - Запустите `init.sql` для инициализации таблиц

3. **Настройте окружение:**
   - Создайте `.env` файл в папке `backend` на основе `.env.example`
   - Создайте `.env.local` файл в папке `frontend`

### Запуск

1. **Запустите backend:**
   ```bash
   start-backend.bat
   ```
   Сервер запустится на `http://localhost:8000`

2. **Запустите frontend:**
   ```bash
   start-frontend.bat
   ```
   Приложение запустится на `http://localhost:3000`

3. **Опционально — Discord-бот** (синхронизирует участников сервера с БД и пишет активность):
   - В корне проекта создайте `.env` с `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DATABASE_URL` (как в `backend/.env`).
   - Запуск: `cd bot`, `pip install -r requirements.txt`, `python main.py`.

### Связка сайта и Discord

- **Один источник правды:** бот и бэкенд используют одну БД. Участники Discord синхронизируются в таблицу `users`, сайт показывает их в блоке «Игроки» и в лидерборде.
- **Вход на сайт через Discord:** в навбаре кнопка «Войти через Discord» ведёт на OAuth. После авторизации в Discord пользователь возвращается на сайт с JWT и считается авторизованным.
- **Настройка OAuth:** в [Discord Developer Portal](https://discord.com/developers/applications) создайте приложение (или используйте то же, что для бота). В OAuth2 укажите Redirect URL: `http://localhost:8000/api/auth/discord/callback`. В `backend/.env` пропишите `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, при необходимости `FRONTEND_URL` и `BACKEND_URL`.

## 📁 Структура проекта

```
lesnaya-komanda/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── config.py     # Конфигурация
│   │   ├── database.py   # Работа с БД
│   │   ├── auth.py       # Аутентификация
│   │   ├── models.py     # Pydantic модели
│   │   ├── main.py       # Главный файл
│   │   ├── routes/       # Маршруты
│   │   └── services/     # Бизнес логика
│   └── requirements.txt
├── frontend/             # Next.js frontend
│   ├── app/             # Страницы
│   ├── components/      # Компоненты
│   └── package.json
├── bot/                 # Discord бот
├── init.sql            # Инициализация БД
├── start-backend.bat   # Запуск backend
├── start-frontend.bat  # Запуск frontend
└── install-dependencies.bat # Установка зависимостей
```

## 🔧 API Endpoints

### Пользователи
- `GET /api/players` - Список игроков
- `GET /api/players/{discord_id}` - Профиль игрока
- `GET /api/leaderboard` - Таблица лидеров
- `GET /api/achievements` - Достижения

### Аутентификация
- `POST /api/token` - Получение JWT токена (логин/пароль)
- `GET /api/auth/discord` - Редирект на вход через Discord
- `GET /api/auth/discord/callback` - Callback OAuth (внутренний)
- `POST /api/register` - Регистрация (только админы)
- `GET /api/me` - Информация о пользователе

### Статистика
- `GET /api/stats` - Сводка для главной (участники, достижения, онлайн)
- `GET /api/stats/activity` - Статистика активности
- `GET /api/stats/games` - Статистика по играм
- `POST /api/update-rating` - Пересчёт рейтингов (только для администраторов, Bearer token)

## ⚠️ Если backend не запускается

- **Ошибка `No module named 'pydantic_settings'` или падение при сборке pydantic-core:** у тебя, скорее всего, Python 3.14. Для backend нужен **Python 3.11 или 3.12** (у pydantic нет готовых сборок под 3.14).
  1. Установи Python 3.12 с [python.org](https://www.python.org/downloads/) (или оставь 3.14, но добавь 3.12).
  2. Пересоздай venv с 3.12:
     ```bat
     cd backend
     rmdir /s /q venv
     py -3.12 -m venv venv
     venv\Scripts\activate
     pip install -r requirements.txt
     ```
  3. Запускай снова `start-backend.bat`.

- **Ошибка подключения к БД:** проверь, что PostgreSQL запущен, база `lesnaya` создана, в `backend\.env` верные `DATABASE_URL` и `SECRET_KEY`.

## 🛠️ Разработка

### Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

## 📝 TODO

- [x] Discord бот (синхронизация участников и активности)
- [x] Вход на сайт через Discord OAuth
- [ ] Реализовать систему новостей
- [ ] Добавить календарь событий
- [ ] Интеграция с игровыми API
- [ ] Админ панель

## 🤝 Участие

Приветствуются pull request'ы и issues!

## 📄 Лицензия

MIT License