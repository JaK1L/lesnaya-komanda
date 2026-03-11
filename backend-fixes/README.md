# Фикс трёх ошибок

## Что делать по шагам

### Шаг 1 — CORS в FastAPI (ОБЯЗАТЕЛЬНО)

Замени содержимое `backend/app/main.py` на файл из этого архива.
Ключевое изменение:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lesnaya-komanda.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
```

Затем в Render → Environment Variables добавь:
```
ALLOWED_ORIGINS=https://lesnaya-komanda.vercel.app
```

---

### Шаг 2 — Роут /api/streamers (если не существует)

Если у тебя нет файла `backend/app/routes/streamers.py` — скопируй его из архива.
Убедись что он подключён в `main.py`:
```python
app.include_router(streamers.router, prefix="/api/streamers")
```

---

### Шаг 3 — Перенести fetch на сервер (устраняет CORS навсегда)

Замени `frontend/app/page.tsx` на файл из архива.

Суть: вместо того чтобы браузер делал запросы к Render напрямую,
запросы делает Vercel-сервер (Next.js SSR/ISR). Браузер получает
готовый HTML — CORS вообще не возникает.

```
Браузер → Vercel (Next.js) → Render (FastAPI)
                ↑
         CORS не нужен здесь, т.к. сервер-сервер
```

---

### Шаг 4 — Переменная окружения на Vercel

В Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL = https://lesnayakomanda.onrender.com
```

Убедись что URL без trailing slash.

---

### Шаг 5 — Проблема холодного старта Render

Бесплатный Render засыпает после 15 мин неактивности.
Если перенёс fetch на сервер (шаг 3) — это уже менее критично,
т.к. Vercel будет кэшировать ответ (revalidate: 300).

Но если хочешь совсем убрать проблему — настрой пинг:
- Используй cron-job.org (бесплатно)
- Каждые 14 минут пингуй: `https://lesnayakomanda.onrender.com/health`

---

## Итоговая схема после фикса

```
Пользователь
    ↓
Vercel (Next.js SSR)
    ↓  fetch на сервере, кэш 5 мин
Render (FastAPI) ← CORS настроен на случай прямых запросов
    ↓
Neon PostgreSQL
```
