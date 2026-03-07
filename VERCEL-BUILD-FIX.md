# ✅ Исправление сборки Vercel

## Проблема
ESLint не был установлен при первом деплое на Vercel.

## Решение
ESLint уже добавлен в `package.json` в devDependencies:
```json
"devDependencies": {
  "eslint": "^10.0.3",
  ...
}
```

## Что было сделано
1. ✅ ESLint установлен локально: `npm install --save-dev eslint`
2. ✅ Изменения закоммичены и запушены
3. ✅ Vercel автоматически перезапустит деплой

## Проверка

### Через 2-3 минуты:

1. **Открой Vercel Dashboard:**
   https://vercel.com/dashboard

2. **Найди проект `lesnaya-komanda`**

3. **Проверь последний деплой:**
   - Должен быть статус: ✅ Ready
   - Build logs должны показывать: "✓ Linting and checking validity of types"

4. **Проверь сайт:**
   https://lesnaya-komanda.vercel.app

## Если все еще ошибка

### Вариант 1: Redeploy вручную
1. Открой https://vercel.com/dashboard
2. Найди проект
3. Deployments → последний деплой → ⋯ → Redeploy

### Вариант 2: Очистить кэш
1. Settings → General
2. Scroll down → Clear Build Cache
3. Redeploy

### Вариант 3: Проверить переменные окружения
1. Settings → Environment Variables
2. Убедись что `NEXT_PUBLIC_API_URL` установлен
3. Если изменил - Redeploy

## Автоматическая проверка

Через 3 минуты запусти:
```powershell
.\check-deployment.sh
```

Или вручную:
```powershell
curl https://lesnaya-komanda.vercel.app
# Должен вернуть HTML страницы
```

## Статус

- ✅ ESLint установлен
- ✅ Код закоммичен
- ✅ Код запушен
- ⏳ Vercel деплоит (2-3 минуты)

## Следующие шаги

1. Дождись завершения деплоя (~3 минуты)
2. Проверь сайт: https://lesnaya-komanda.vercel.app
3. Проверь админку: https://lesnaya-komanda.vercel.app/admin
4. Запусти полную проверку: `.\check-deployment.sh`

---

**Создано:** 07.03.2026  
**Статус:** ⏳ Деплой в процессе  
**Ожидаемое время:** ~3 минуты
