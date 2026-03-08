# Как использовать render.yaml

## Что это?

`render.yaml` - это файл конфигурации для автоматического деплоя на Render.com. Он описывает все настройки вашего сервиса: команды запуска, переменные окружения, регион и т.д.

## Способы использования

### Способ 1: Автоматический деплой (рекомендуется)

Render автоматически обнаружит `render.yaml` в корне репозитория и применит настройки.

#### Шаги:

1. **Файл уже в репозитории** ✅
   - `render.yaml` уже закоммичен и запушен в main ветку

2. **Зайди на Render.com**
   - https://dashboard.render.com/

3. **Создай новый сервис (если ещё не создан)**
   - Нажми **New +** → **Blueprint**
   - Выбери свой GitHub репозиторий `lesnaya-komanda`
   - Render автоматически найдёт `render.yaml`
   - Нажми **Apply**

4. **Если сервис уже существует - обнови его**
   - Зайди в свой существующий сервис
   - Перейди в **Settings** → **Build & Deploy**
   - Нажми **Manual Deploy** → **Deploy latest commit**
   - Render применит настройки из `render.yaml`

5. **Добавь секретные переменные вручную**
   
   Render не может автоматически добавить секретные переменные (с `sync: false`). Добавь их вручную:
   
   - Перейди в **Environment**
   - Добавь эти переменные:
     - `DATABASE_URL` = твоя PostgreSQL строка подключения
     - `SECRET_KEY` = lesNaYaKoMANDaTheBESTinTheWORLD322
     - `DISCORD_BOT_TOKEN` = твой Discord bot token
     - `DISCORD_CLIENT_SECRET` = твой Discord client secret
     - `ADMIN_USERNAME` = LKBOSS322
     - `ADMIN_PASSWORD` = LKTEAMPASSWORD3228
   
   - Нажми **Save Changes**

6. **Render перезапустит сервис**
   - Подожди 2-5 минут
   - Проверь логи: **Logs** (слева в меню)
   - Убедись что сервис запустился без ошибок

---

### Способ 2: Обновление существующего сервиса

Если у тебя уже есть сервис на Render:

1. **Render автоматически обнаружит изменения**
   - При следующем пуше в GitHub
   - Render увидит `render.yaml` и применит настройки

2. **Или запусти деплой вручную**
   - Зайди в свой сервис на Render
   - Нажми **Manual Deploy** → **Deploy latest commit**

3. **Проверь что настройки применились**
   - Перейди в **Environment**
   - Убедись что все переменные из `render.yaml` добавлены
   - Добавь секретные переменные (см. выше)

---

## Что делает render.yaml?

Наш `render.yaml` настраивает:

### 1. Тип сервиса
```yaml
type: web
```
Веб-сервис (API)

### 2. Команды
```yaml
buildCommand: "cd backend && pip install -r requirements.txt"
startCommand: "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```
- **buildCommand** - устанавливает зависимости
- **startCommand** - запускает FastAPI сервер

### 3. Health Check
```yaml
healthCheckPath: /health
```
Render будет проверять `/health` эндпоинт чтобы убедиться что сервис работает

### 4. Переменные окружения
```yaml
envVars:
  - key: ALLOWED_ORIGINS
    value: http://localhost:3000,...
```
Все несекретные переменные автоматически добавляются

### 5. Секретные переменные
```yaml
  - key: DATABASE_URL
    sync: false
```
`sync: false` означает что эту переменную нужно добавить вручную

---

## Проверка после деплоя

### 1. Проверь логи
```
Dashboard → твой сервис → Logs
```

Должно быть:
```
✅ Подключение к базе данных установлено
INFO:     Uvicorn running on http://0.0.0.0:10000
🌐 CORS origins для middleware: [...]
```

### 2. Проверь переменные окружения
```
Dashboard → твой сервис → Environment
```

Убедись что все переменные добавлены, особенно:
- `ALLOWED_ORIGINS` содержит `https://lesnaya-komanda.vercel.app`
- `DATABASE_URL` правильный
- `SECRET_KEY` установлен

### 3. Проверь health check
Открой в браузере:
```
https://lesnayakomanda.onrender.com/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "service": "Лесная Команда API",
  "version": "1.0.0"
}
```

### 4. Проверь CORS
Открой:
```
https://lesnaya-komanda.vercel.app/admin/events
```

Ошибок CORS быть не должно!

---

## Troubleshooting

### Проблема: Сервис не запускается

**Решение:**
1. Проверь логи на Render
2. Убедись что все секретные переменные добавлены
3. Проверь что `DATABASE_URL` правильный

### Проблема: CORS ошибки остались

**Решение:**
1. Проверь что `ALLOWED_ORIGINS` содержит `https://lesnaya-komanda.vercel.app`
2. Убедись что сервис перезапустился после изменения переменных
3. Очисти кэш браузера (Ctrl+Shift+R)

### Проблема: 500 Internal Server Error

**Решение:**
1. Проверь логи - там будет точная ошибка
2. Обычно это проблема с базой данных или отсутствующей переменной
3. Убедись что `DATABASE_URL` правильный и база доступна

---

## Автоматический деплой при пуше

После настройки `render.yaml`:

1. **Каждый пуш в main** → автоматический деплой
2. **Render пересобирает** → устанавливает зависимости
3. **Render перезапускает** → применяет новый код
4. **Проверяет health check** → `/health` должен вернуть 200

Это занимает 2-5 минут.

---

## Полезные ссылки

- Render Dashboard: https://dashboard.render.com/
- Render Docs: https://render.com/docs/yaml-spec
- Твой бэкенд: https://lesnayakomanda.onrender.com
- Твой фронтенд: https://lesnaya-komanda.vercel.app

---

## Быстрый чеклист

- [ ] `render.yaml` в корне репозитория ✅
- [ ] Запушен в GitHub ✅
- [ ] Создан Blueprint на Render (или обновлён существующий сервис)
- [ ] Добавлены секретные переменные вручную
- [ ] Сервис запустился без ошибок (проверь логи)
- [ ] Health check работает: `/health` возвращает 200
- [ ] CORS работает: нет ошибок на фронтенде
- [ ] Админка работает: можно создавать события

Готово! 🎉
