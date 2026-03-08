# 🚀 Запуск проекта локально

## Frontend (Next.js)

### 1. Перейди в папку frontend
```bash
cd frontend
```

### 2. Установи зависимости (если еще не установлены)
```bash
npm install
```

### 3. Создай .env.local файл
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com
```

### 4. Запусти dev сервер
```bash
npm run dev
```

### 5. Открой в браузере
```
http://localhost:3000
```

Админка будет доступна по адресу:
```
http://localhost:3000/admin/achievements
```

## Backend (FastAPI)

Если нужен локальный backend:

### 1. Перейди в папку backend
```bash
cd backend
```

### 2. Создай виртуальное окружение
```bash
python -m venv venv
```

### 3. Активируй виртуальное окружение
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 4. Установи зависимости
```bash
pip install -r requirements.txt
```

### 5. Запусти сервер
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Открой в браузере
```
http://localhost:8000/api/docs
```

## Полный стек локально

Если хочешь запустить и frontend и backend локально:

### Terminal 1 - Backend
```bash
cd backend
venv\Scripts\activate  # Windows
python -m uvicorn app.main:app --reload
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Обнови .env.local
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Теперь:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

## Быстрый старт (только frontend)

Самый простой способ - запустить только frontend, он будет использовать production backend:

```bash
cd frontend
npm install
npm run dev
```

Открой http://localhost:3000/admin/achievements

Логин: `LesnoyBOSS`
Пароль: `LesnoyBOSS909!`

## Проверка что все работает

После запуска проверь:

1. **Frontend загрузился**
   - Открой http://localhost:3000
   - Должна загрузиться главная страница

2. **Админка доступна**
   - Открой http://localhost:3000/admin
   - Введи логин/пароль

3. **Страница достижений**
   - Открой http://localhost:3000/admin/achievements
   - Должна быть кнопка "🎁 Выдать"

4. **Консоль без ошибок**
   - F12 → Console
   - Не должно быть красных ошибок

## Troubleshooting

### Ошибка "Module not found"
```bash
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```

### Ошибка "Port 3000 already in use"
```bash
# Убей процесс на порту 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Ошибка "Cannot find module 'next'"
```bash
cd frontend
npm install next react react-dom
```

### Frontend не подключается к backend
Проверь `.env.local`:
```bash
# Для production backend
NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com

# Для локального backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Горячие клавиши

- `Ctrl+C` - остановить сервер
- `Ctrl+F5` - обновить страницу с очисткой кэша
- `F12` - открыть DevTools

---

**Готово!** Теперь ты можешь разрабатывать локально и видеть изменения мгновенно! 🚀
