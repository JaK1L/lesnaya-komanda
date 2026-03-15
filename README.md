# 🌲 Lesnaya Komanda - Стримерское объединение

Веб-платформа для стримерского сообщества с интеграцией Discord, системой достижений и профилями игроков.

## 🚀 Быстрый старт

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📚 Документация

Вся техническая документация находится в папке [`docs/`](./docs/)

## 🛠 Технологии

**Backend:**
- FastAPI (Python)
- PostgreSQL (Neon)
- JWT Authentication
- Discord OAuth

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Framer Motion
- CSS Modules

## 🔑 Основные возможности

- ✅ Регистрация через Email/Password
- ✅ Вход через Discord OAuth
- ✅ Уникальные User Tags (username#0001)
- ✅ Профили пользователей
- ✅ Система достижений
- ✅ Игровые аккаунты (CS2, Valorant, Dota 2)
- ✅ Новости и события
- ✅ Админ-панель

## 📝 Лицензия

Частный проект

## 👥 Команда

Lesnaya Komanda Team

## 🔎 Аудит проекта

Текущая оценка и обзор архитектуры: `PROJECT_REVIEW.md`.
