# 🚀 Инструкция по деплою на Render

## Проблема

Valorant API возвращает 404 на production, потому что новый код еще не задеплоился.

## Решение

### Шаг 1: Зайти на Render Dashboard

1. Открыть https://dashboard.render.com
2. Войти в аккаунт
3. Найти сервис `lesnayakomanda-backend`

### Шаг 2: Проверить статус деплоя

В разделе "Events" проверить:
- ✅ Последний деплой успешен (Deploy succeeded)
- ⏳ Деплой в процессе (Deploy in progress)
- ❌ Деплой завершился с ошибкой (Deploy failed)

### Шаг 3: Запустить Manual Deploy

Если автоматический деплой не запустился:

1. Нажать кнопку **"Manual Deploy"** → **"Deploy latest commit"**
2. Дождаться завершения деплоя (обычно 3-5 минут)
3. Проверить логи на наличие ошибок

### Шаг 4: Проверить Environment Variables

Убедиться, что все переменные окружения установлены:

```
✅ DATABASE_URL
✅ SECRET_KEY
✅ STEAM_API_KEY=2B3F8147466380EE76E0985131D2632C
✅ HENRIK_API_KEY=HDEV-596140d5-102e-4faa-a2af-3cf68bc94b82
✅ TRACKER_API_KEY=057f6380-58d8-4ed7-afcb-8a54c510c7c1
✅ ALLOWED_ORIGINS (включает vercel.app)
✅ FRONTEND_URL
✅ BACKEND_URL
```

### Шаг 5: Проверить логи

В разделе "Logs" проверить:
- Нет ли ошибок при запуске
- Загрузились ли новые API ключи
- Нет ли ошибок импорта модулей

### Шаг 6: Протестировать API

После успешного деплоя запустить тест:

```bash
cd backend
python test_production_valorant.py
```

Ожидаемый результат:
```
✅ Backend работает
✅ Valorant Profile API работает!
✅ Valorant MMR API работает!
```

## Частые проблемы

### 1. Деплой завершается с ошибкой

**Причина**: Ошибка в коде или зависимостях

**Решение**:
- Проверить логи деплоя
- Убедиться, что все зависимости в `requirements.txt`
- Проверить синтаксис Python кода

### 2. API возвращает 500

**Причина**: Ошибка в runtime (отсутствуют env vars, ошибка в коде)

**Решение**:
- Проверить логи приложения
- Убедиться, что все env vars установлены
- Проверить подключение к базе данных

### 3. API возвращает 404

**Причина**: Старая версия кода на production

**Решение**:
- Запустить Manual Deploy
- Проверить, что последний коммит задеплоился

### 4. HENRIK_API_KEY не работает

**Причина**: Ключ не загрузился или неправильно установлен

**Решение**:
- Проверить Environment Variables на Render
- Убедиться, что нет лишних пробелов
- Перезапустить сервис после изменения env vars

## Автоматический деплой

Render автоматически деплоит при push в main ветку, если:
- ✅ Настроен GitHub integration
- ✅ Auto-Deploy включен в настройках сервиса
- ✅ Нет ошибок в коде

Если автоматический деплой не работает:
1. Settings → Build & Deploy → Auto-Deploy: **Enabled**
2. Settings → Build & Deploy → Branch: **main**

## Проверка после деплоя

### 1. Health Check
```bash
curl https://lesnayakomanda.onrender.com/health
```
Ожидается: `{"status":"ok"}`

### 2. Valorant Profile
```bash
curl https://lesnayakomanda.onrender.com/api/game-stats/valorant/CJlOH/ZVZV/profile
```
Ожидается: JSON с данными профиля

### 3. Valorant MMR
```bash
curl https://lesnayakomanda.onrender.com/api/game-stats/valorant/CJlOH/ZVZV/mmr
```
Ожидается: JSON с данными MMR

## Время деплоя

- **Build time**: 2-3 минуты
- **Deploy time**: 1-2 минуты
- **Total**: 3-5 минут

После деплоя может потребоваться 1-2 минуты для прогрева сервиса (cold start).

## Контакты поддержки

Если проблемы не решаются:
1. Проверить статус Render: https://status.render.com
2. Обратиться в поддержку Render
3. Проверить GitHub Actions (если настроены)

---

## Быстрый чеклист

- [ ] Зайти на dashboard.render.com
- [ ] Открыть lesnayakomanda-backend
- [ ] Проверить статус последнего деплоя
- [ ] Если нужно - запустить Manual Deploy
- [ ] Проверить Environment Variables
- [ ] Дождаться завершения деплоя
- [ ] Проверить логи на ошибки
- [ ] Протестировать API
- [ ] Обновить страницу на frontend

**После выполнения всех шагов Valorant API должен заработать!** ✅
