# 🔧 Быстрое исправление ошибки на главной странице

## Проблема

Сайт показывает ошибку: "Не удалось загрузить данные. Проверьте подключение к интернету."

## Причина

Frontend пытается подключиться к `http://localhost:8000`, но backend задеплоен на Render.

## Решение

### 1. Найти URL вашего backend на Render

1. Открыть [Render Dashboard](https://dashboard.render.com/)
2. Найти ваш backend сервис
3. Скопировать URL (например: `https://lesnaya-komanda-api.onrender.com`)

### 2. Обновить переменные в Vercel

1. Открыть [Vercel Dashboard](https://vercel.com/dashboard)
2. Выбрать проект `lesnaya-komanda`
3. Settings → Environment Variables
4. Найти `NEXT_PUBLIC_API_URL` и изменить на ваш Render URL:
   ```
   NEXT_PUBLIC_API_URL=https://ваш-backend.onrender.com
   ```
5. Сохранить

### 3. Redeploy frontend

1. В Vercel Dashboard → Deployments
2. Нажать на последний деплой → ⋯ → Redeploy
3. Подождать 1-2 минуты

### 4. Проверить

Открыть сайт - ошибка должна исчезнуть!

---

## Альтернатива: Запустить backend локально

Если хотите тестировать локально:

```bash
# 1. Запустить backend
cd backend
python -m uvicorn app.main:app --reload

# 2. В другом терминале запустить frontend
cd frontend
npm run dev

# 3. Открыть http://localhost:3000
```

---

## Проверка backend

Проверить что backend работает:

```bash
# Заменить URL на ваш
curl https://ваш-backend.onrender.com/api/

# Должен вернуть:
# {"status":"ok"}
```

Если не работает - проверить:
1. Backend запущен на Render
2. URL правильный
3. CORS настроен (ALLOWED_ORIGINS в backend)

---

**Последнее обновление:** 07.03.2026

