# Настройка API ключей для игровой статистики

Для работы игровой статистики необходимо настроить API ключи для различных сервисов.

## Tracker.gg API (CS2/CS:GO)

✅ **Уже настроен**

API ключ: `c2254171-1ce5-46e9-a283-21b0282406ff`

Используется для получения статистики CS2/CS:GO.

## Steam Web API (опционально)

**Статус:** Не настроен

**Для чего:** Получение профилей Steam и резервный источник статистики CS2

**Как получить:**
1. Перейдите на https://steamcommunity.com/dev/apikey
2. Войдите через Steam
3. Заполните форму (Domain Name можно указать любой, например: `lesnaya-komanda.vercel.app`)
4. Скопируйте полученный ключ

**Где добавить:**
- `backend/.env`: `STEAM_API_KEY=ваш_ключ`
- `.env`: `STEAM_API_KEY=ваш_ключ`
- `render.yaml`: добавить в `envVars`

## Henrik Dev API (Valorant)

**Статус:** Не требуется

Henrik Dev API работает без ключа, но с ограничениями по количеству запросов.

**Опционально:** Можно получить ключ для увеличения лимитов на https://discord.gg/X3GaVkX2YN

## OpenDota API (Dota 2)

**Статус:** Не требуется

✅ OpenDota API работает без ключа

## Текущая конфигурация

### Работает:
- ✅ Dota 2 (OpenDota API - без ключа)
- ✅ CS2 (Tracker.gg API - с ключом)

### Требует настройки:
- ⚠️ Steam профили (нужен Steam API ключ)
- ⚠️ Valorant (работает, но может быть нестабильно без ключа)

## Инструкция по добавлению Steam API ключа

1. Получите ключ на https://steamcommunity.com/dev/apikey

2. Добавьте в `backend/.env`:
```env
STEAM_API_KEY=ваш_steam_api_ключ
```

3. Добавьте в `.env` (корень проекта):
```env
STEAM_API_KEY=ваш_steam_api_ключ
```

4. Добавьте в `render.yaml` для продакшена:
```yaml
- key: STEAM_API_KEY
  value: ваш_steam_api_ключ
```

5. Перезапустите backend:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

## Проверка работы API

Запустите тестовый скрипт:
```bash
cd backend
python test_tracker_api.py
```

Скрипт покажет, какие API работают, а какие требуют настройки.
