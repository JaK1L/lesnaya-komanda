# Настройка API ключей для игровой статистики

## ⚠️ ВАЖНО: Текущие API ключи не работают!

### Проблема
- Tracker.gg API ключ `c2254171-1ce5-46e9-a283-21b0282406ff` возвращает **401 Unauthorized**
- Henrik Dev API теперь требует авторизацию (раньше работал без ключа)
- Без валидных ключей Valorant и CS2 статистика недоступна

## Решение

### 1. Tracker.gg API (для CS2 и Valorant)

**Получение нового ключа:**
1. Зайдите на https://tracker.gg/developers
2. Зарегистрируйтесь или войдите
3. Создайте новое приложение
4. Получите API ключ
5. Добавьте в конфигурацию:

**backend/.env:**
```env
TRACKER_API_KEY=ваш_новый_ключ
```

**.env (корень):**
```env
TRACKER_API_KEY=ваш_новый_ключ
```

**render.yaml:**
```yaml
- key: TRACKER_API_KEY
  value: ваш_новый_ключ
```

### 2. Henrik Dev API (для Valorant)

**Получение ключа:**
1. Присоединитесь к Discord: https://discord.gg/X3GaVkX2YN
2. Запросите API ключ в соответствующем канале
3. Добавьте в конфигурацию:

**backend/.env:**
```env
HENRIK_API_KEY=ваш_ключ
```

**.env (корень):**
```env
HENRIK_API_KEY=ваш_ключ
```

**render.yaml:**
```yaml
- key: HENRIK_API_KEY
  value: ваш_ключ
```

### 3. Steam Web API (для Steam профилей)

**Текущий ключ:** `2B3F8147466380EE76E0985131D2632C` ✅ Работает

Если нужен новый:
1. https://steamcommunity.com/dev/apikey
2. Войдите через Steam
3. Зарегистрируйте домен
4. Получите ключ

### 4. OpenDota API (для Dota 2)

✅ **Работает без ключа**

OpenDota API бесплатный и не требует авторизации.

## Текущий статус API

| Игра | API | Статус | Требуется |
|------|-----|--------|-----------|
| Dota 2 | OpenDota | ✅ Работает | Ничего |
| Steam | Steam Web API | ✅ Работает | Ничего |
| CS2 | Tracker.gg | ❌ Не работает | Новый API ключ |
| Valorant | Henrik Dev | ❌ Не работает | API ключ |

## Тестирование API

После добавления ключей запустите тесты:

```bash
cd backend

# Тест Tracker.gg API
python test_tracker_cs2.py

# Тест Henrik API
python test_henrik_api.py

# Тест всех API
python test_tracker_api.py
```

## Примечание

**Riot Games** не предоставляет персональные API ключи для Valorant. Доступны только:
- Henrik Dev API (неофициальный, требует ключ)
- Tracker.gg API (требует ключ)
- Официальный Riot API (только для production приложений с одобрением)

## Что работает сейчас

- ✅ Dota 2: Полная статистика (профиль + игровые данные)
- ✅ Steam: Профили пользователей
- ❌ CS2: Недоступно (нужен валидный Tracker.gg ключ)
- ❌ Valorant: Недоступно (нужен Henrik API ключ)
