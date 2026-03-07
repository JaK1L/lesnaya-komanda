# 🔧 Исправление API URL на Frontend

## Проблема
Frontend показывает бесконечную загрузку, потому что не может подключиться к backend API.

## Причина
Неправильный URL в переменных окружения Vercel.

## Решение

### Шаг 1: Открой Vercel Dashboard
https://vercel.com/dashboard

### Шаг 2: Найди проект
Найди проект `lesnaya-komanda`

### Шаг 3: Открой Settings
Settings → Environment Variables

### Шаг 4: Проверь NEXT_PUBLIC_API_URL

**Должно быть:**
```
NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com
```

**НЕ должно быть:**
```
NEXT_PUBLIC_API_URL=https://lesnaya-komanda.onrender.com  ❌ (с дефисом)
```

### Шаг 5: Исправь если неправильно

1. Нажми на переменную `NEXT_PUBLIC_API_URL`
2. Измени значение на: `https://lesnayakomanda.onrender.com`
3. Сохрани

### Шаг 6: Redeploy

1. Deployments → последний деплой
2. ⋯ (три точки) → **Redeploy**
3. Дождись завершения (~1-2 минуты)

### Шаг 7: Проверь

Открой: https://lesnaya-komanda.vercel.app

Должны загрузиться:
- ✅ Новости
- ✅ События
- ✅ Лента

---

## Альтернативное решение: Через CLI

Если есть Vercel CLI:

```bash
# Установить переменную
vercel env add NEXT_PUBLIC_API_URL production

# Ввести значение
https://lesnayakomanda.onrender.com

# Redeploy
vercel --prod
```

---

## Проверка Backend

Backend работает правильно:

```powershell
# Health check
curl https://lesnayakomanda.onrender.com/api/
# Возвращает: {"status":"active"}

# Новости
curl https://lesnayakomanda.onrender.com/api/news
# Возвращает: массив новостей

# События
curl https://lesnayakomanda.onrender.com/api/events
# Возвращает: массив событий
```

---

## Правильные URLs

### Backend (Render)
```
https://lesnayakomanda.onrender.com
```
**Без дефиса!** (lesnayakomanda, не lesnaya-komanda)

### Frontend (Vercel)
```
https://lesnaya-komanda.vercel.app
```
**С дефисом!** (lesnaya-komanda)

---

## Все переменные окружения Vercel

Проверь что все правильно:

```env
NEXT_PUBLIC_API_URL=https://lesnayakomanda.onrender.com
NEXT_PUBLIC_GA_ID=G-3437T4EM9D
NEXT_PUBLIC_YM_ID=107194144
NEXT_PUBLIC_IMGBB_API_KEY=c026403294c4af46bc1d0a7e3faf582e
```

---

## После исправления

1. **Redeploy на Vercel** (~1-2 минуты)
2. **Открой сайт:** https://lesnaya-komanda.vercel.app
3. **Проверь что загружаются:**
   - Новости
   - События
   - Лента

---

**Создано:** 07.03.2026  
**Статус:** Требуется ручное исправление на Vercel  
**Время:** ~2 минуты
