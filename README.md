# 🌲 Лесная Команда

**Своя стая.** Не корпоративный портал, не маркетинг — просто геймеры, которые нашли друг друга в лесу.

Мы режемся в **CS2**, **Dota 2**, **Valorant** и во всё, что под руку попадётся. Без понтов, без пиджаков. Есть рейтинг, достижения, лидерборд и события — чтобы было видно, кто в стае самый зубастый 🐺

---

### Что тут есть

- **Сайт** — лендинг, игроки, статистика, события. Тёмная тема, лесная эстетика.
- **Discord** — бот синхронизирует участников сервера с базой, считает активность. Вход на сайт через Discord OAuth — один клик и ты в стае.
- **Ранги** — от 🌱 Ростка до 🐺 Старого Волка. Рейтинг считается по сообщениям, голосу и достижениям.

Технически: **Next.js** + **FastAPI** + **PostgreSQL**. Всё просто и по делу.

---

*Сделано с 🌲 в лесу.*

**MIT License**

---

## Discord ↔ сайт: что показываем

Сайт может отображать:
- **кто онлайн** (по presence)
- **кто во что играет** (по активности Discord)
- **топ по сообщениям** (из `activity_log`)
- **топ по голосу** (из `voice_sessions`)

Это работает так: **бот** пишет данные в PostgreSQL, **бэкенд** отдаёт их через API, **фронт** рисует на главной.

## Важное: Intents для бота

Чтобы на сайте работали **онлайн** и **во что играет**, включи privileged intents:

1. [Discord Developer Portal](https://discord.com/developers/applications) → твоё приложение → **Bot**
2. **Privileged Gateway Intents**:
   - **Presence Intent**
   - **Server Members Intent**
   - (опционально) **Message Content Intent** — если хочешь сохранять содержимое сообщений; для счётчика иногда хватает и без него, но лучше включить.

## API (FastAPI)

### Discord-статистика
- `GET /api/discord/overview` — онлайн + кто во что играет + топы
- `GET /api/discord/now-playing` — кто во что играет (список)
- `GET /api/discord/top/messages` — топ по сообщениям
- `GET /api/discord/top/voice` — топ по голосу

### OAuth вход через Discord
- `GET /api/auth/discord` — редирект на Discord OAuth
- `GET /api/auth/discord/callback` — callback OAuth

## Переменные окружения (prod)

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` = URL бэкенда на Render, например `https://<your-backend>.onrender.com`

### Backend (Render)
- `DATABASE_URL` = строка подключения Postgres (Neon/Supabase)
- `SECRET_KEY` = любой длинный секрет
- `ALLOWED_ORIGINS` = домены Vercel через запятую (без путей), например `https://your-app.vercel.app,https://your-app-git-main-xxx.vercel.app`
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- `FRONTEND_URL` = `https://your-app.vercel.app`
- `BACKEND_URL` = `https://<your-backend>.onrender.com`
