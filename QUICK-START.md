# ⚡ Быстрый старт

## 🚀 Деплой за 5 минут

### Автоматический деплой (рекомендуется)

```bash
# Windows (PowerShell)
.\deploy.ps1

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

Скрипт автоматически:
- Запушит код в GitHub
- Дождется деплоя
- Проверит все сервисы
- Выдаст отчет

---

## 💻 Локальная разработка

### Вариант 1: Docker (проще)

```bash
# Запустить все сервисы
make dev-docker

# Или вручную
docker-compose up -d
```

Откроется:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### Вариант 2: Без Docker

```bash
# 1. Установить зависимости
make install

# 2. Запустить БД и Redis
make dev

# 3. В отдельном терминале - Backend
cd backend
uvicorn app.main:app --reload

# 4. В еще одном терминале - Frontend
cd frontend
npm run dev
```

---

## 🔧 Первичная настройка

### 1. Клонировать репозиторий

```bash
git clone https://github.com/your-username/lesnaya-komanda.git
cd lesnaya-komanda
```

### 2. Настроить переменные окружения

```bash
# Backend
cp backend/.env.example backend/.env
# Отредактировать backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
# Отредактировать frontend/.env.local
```

### 3. Запустить локально

```bash
make dev
```

---

## 🌐 Production деплой

### Первый раз

1. **Neon (База данных)**
   - Зайти на https://console.neon.tech/
   - Создать проект
   - Скопировать DATABASE_URL

2. **Render (Backend)**
   - Зайти на https://dashboard.render.com/
   - New → Web Service
   - Подключить GitHub
   - Добавить переменные окружения (см. ENV-VARIABLES.md)

3. **Vercel (Frontend)**
   - Зайти на https://vercel.com/dashboard
   - Import Project
   - Подключить GitHub
   - Добавить переменные окружения

4. **Railway (Bot)**
   - Зайти на https://railway.app/dashboard
   - New Project
   - Deploy from GitHub
   - Добавить переменные окружения

### Последующие деплои

```bash
# Просто запушить в main
git push origin main

# Или использовать скрипт
make deploy
```

---

## 📝 Полезные команды

```bash
make help          # Показать все команды
make dev           # Запустить локально
make deploy        # Задеплоить
make check         # Проверить деплой
make test          # Запустить тесты
make clean         # Очистить временные файлы
make urls          # Показать все URLs
```

---

## 🔍 Проверка деплоя

```bash
# Автоматическая проверка
make check

# Или вручную
curl https://lesnayakomanda.onrender.com/api/
curl https://lesnaya-komanda.vercel.app
```

---

## 📚 Документация

- [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md) - Быстрый гайд по деплою
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Полная документация
- [ENV-VARIABLES.md](./ENV-VARIABLES.md) - Переменные окружения
- [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md) - Чеклист

---

## 🆘 Помощь

### Backend не запускается
```bash
# Проверить логи
https://dashboard.render.com/ → Logs
```

### Frontend не подключается к API
```bash
# Проверить NEXT_PUBLIC_API_URL
https://vercel.com/dashboard → Settings → Environment Variables
```

### CORS ошибка
```bash
# Проверить ALLOWED_ORIGINS на Render
# Должен содержать: https://lesnaya-komanda.vercel.app
```

---

## 🌐 URLs

### Production
- Frontend: https://lesnaya-komanda.vercel.app
- Backend: https://lesnayakomanda.onrender.com
- API Docs: https://lesnayakomanda.onrender.com/api/docs
- Admin: https://lesnaya-komanda.vercel.app/admin

### Local
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### Дашборды
- Render: https://dashboard.render.com/
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
- Neon: https://console.neon.tech/

---

**Последнее обновление:** 07.03.2026
