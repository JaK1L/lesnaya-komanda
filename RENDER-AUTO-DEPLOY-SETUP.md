# 🔧 Настройка автоматического деплоя на Render

## Проблема

Render не деплоит автоматически при push в GitHub.

## Причина

Автоматический деплой может быть отключен или неправильно настроен.

## Решение

### Вариант 1: Включить Auto-Deploy (Рекомендуется)

1. Зайти на https://dashboard.render.com
2. Открыть сервис `lesnayakomanda-backend`
3. Перейти в **Settings**
4. Найти раздел **Build & Deploy**
5. Убедиться что:
   - ✅ **Auto-Deploy**: `Yes` (Enabled)
   - ✅ **Branch**: `main`
   - ✅ **Build Command**: `cd backend && pip install -r requirements.txt`
   - ✅ **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

6. Если Auto-Deploy был выключен - включить его
7. Нажать **Save Changes**

### Вариант 2: Manual Deploy (Быстрое решение)

Если нужно задеплоить прямо сейчас:

1. Зайти на https://dashboard.render.com
2. Открыть сервис `lesnayakomanda-backend`
3. Нажать кнопку **"Manual Deploy"**
4. Выбрать **"Deploy latest commit"**
5. Дождаться завершения (3-5 минут)

### Вариант 3: Deploy Hook (Для CI/CD)

Если хотите деплоить через webhook:

1. Settings → Deploy Hook
2. Скопировать URL
3. Добавить в GitHub Actions или использовать вручную:

```bash
curl -X POST https://api.render.com/deploy/srv-xxxxx?key=xxxxx
```

## Проверка Auto-Deploy

После включения Auto-Deploy:

1. Сделать любой коммит:
```bash
git commit --allow-empty -m "test: trigger auto-deploy"
git push
```

2. Зайти на Render Dashboard
3. В разделе **Events** должен появиться новый деплой
4. Статус должен быть "Deploy in progress" → "Deploy succeeded"

## Почему Auto-Deploy может не работать

### 1. GitHub Integration не настроен

**Проверка**:
- Settings → GitHub → Repository должен быть подключен

**Решение**:
- Reconnect GitHub repository
- Дать Render доступ к репозиторию

### 2. Branch неправильный

**Проверка**:
- Settings → Build & Deploy → Branch = `main`

**Решение**:
- Изменить на правильную ветку
- Убедиться что пушите в эту ветку

### 3. Auto-Deploy отключен

**Проверка**:
- Settings → Build & Deploy → Auto-Deploy = `Yes`

**Решение**:
- Включить Auto-Deploy
- Save Changes

### 4. Build Command неправильный

**Проверка**:
- Settings → Build & Deploy → Build Command

**Должно быть**:
```bash
cd backend && pip install -r requirements.txt
```

### 5. Ошибка в коде

**Проверка**:
- Logs → Build Logs
- Искать ошибки Python

**Решение**:
- Исправить ошибки в коде
- Проверить локально: `python -m py_compile app/main.py`

## Текущая ситуация

**Проблема**: Endpoints возвращают 404
- ❌ `/api/game-stats/valorant/...` - 404
- ❌ `/api/game-stats/cs2/...` - 404
- ❌ `/api/game-stats/dota2/...` - 404

**Причина**: На production старая версия кода

**Решение**: Запустить Manual Deploy СЕЙЧАС

## Шаги для немедленного исправления

1. ✅ Зайти на https://dashboard.render.com
2. ✅ Открыть `lesnayakomanda-backend`
3. ✅ Нажать **"Manual Deploy"** → **"Deploy latest commit"**
4. ⏳ Дождаться 3-5 минут
5. ✅ Проверить endpoints:

```bash
cd backend
python check_production_endpoints.py
```

Ожидаемый результат после деплоя:
```
✅ 200 - /api/game-stats/valorant/CJlOH/ZVZV/profile
✅ 200 - /api/game-stats/valorant/CJlOH/ZVZV/mmr
✅ 200 - /api/game-stats/steam/76561198084749679
✅ 200 - /api/game-stats/cs2/76561198084749679 (или 404 если приватный)
✅ 200 - /api/game-stats/dota2/123456789/profile (или 404 если не существует)
```

## После успешного деплоя

1. ✅ Обновить страницу на lesnaya-komanda.vercel.app
2. ✅ Проверить что Valorant статистика загружается
3. ✅ Проверить логи на наличие ошибок
4. ✅ Убедиться что Auto-Deploy включен для будущих обновлений

---

## 🚨 ВАЖНО

**Без Manual Deploy новый код НЕ появится на production!**

Нужно обязательно зайти на Render и запустить деплой вручную.

После этого все заработает! ✅
