# 📊 Настройка аналитики

**Дата:** 07.03.2026  
**Статус:** ID получены, нужно добавить в Vercel

---

## ✅ Полученные ID

- **Google Analytics**: `G-3437T4EM9D`
- **Yandex Metrika**: `107194144`

---

## 🔧 Что уже сделано

1. ✅ ID добавлены в `frontend/.env.local` (для локальной разработки)
2. ✅ ID добавлены в `.env.example` (для документации)
3. ✅ Компоненты GoogleAnalytics и YandexMetrika созданы
4. ✅ Компоненты интегрированы в layout.tsx

---

## 🚀 Добавить в Vercel (Production)

### Способ 1: Через Dashboard (рекомендуется)

1. Открыть [Vercel Dashboard](https://vercel.com/dashboard)
2. Выбрать проект `lesnaya-komanda`
3. Settings → Environment Variables
4. Добавить переменные:

```bash
# Нажать "Add New"
Name: NEXT_PUBLIC_GA_ID
Value: G-3437T4EM9D
Environment: Production, Preview, Development
✓ Save

# Нажать "Add New"
Name: NEXT_PUBLIC_YM_ID
Value: 107194144
Environment: Production, Preview, Development
✓ Save
```

5. Redeploy проект:
   - Deployments → Latest → ⋯ → Redeploy

### Способ 2: Через CLI

```bash
# Установить Vercel CLI (если еще не установлен)
npm i -g vercel

# Войти
vercel login

# Добавить переменные
vercel env add NEXT_PUBLIC_GA_ID
# Ввести: G-3437T4EM9D
# Выбрать: Production, Preview, Development

vercel env add NEXT_PUBLIC_YM_ID
# Ввести: 107194144
# Выбрать: Production, Preview, Development

# Redeploy
vercel --prod
```

---

## ✅ Проверка работы

### 1. Локально

```bash
# Запустить frontend
cd frontend
npm run dev

# Открыть http://localhost:3000
# Открыть DevTools → Console
# Не должно быть ошибок от GA/YM
```

### 2. В Production

После redeploy в Vercel:

**Google Analytics:**
1. Открыть [Google Analytics](https://analytics.google.com)
2. Перейти в Reports → Realtime
3. Открыть ваш сайт в новой вкладке
4. Должен появиться активный пользователь

**Yandex Metrika:**
1. Открыть [Yandex Metrika](https://metrika.yandex.ru)
2. Выбрать счетчик 107194144
3. Перейти в "Посетители онлайн"
4. Открыть ваш сайт в новой вкладке
5. Должен появиться активный посетитель

### 3. Проверка кода

```bash
# Проверить что переменные загружены
# В браузере на production сайте:
# DevTools → Console → вставить:

console.log('GA ID:', process.env.NEXT_PUBLIC_GA_ID)
console.log('YM ID:', process.env.NEXT_PUBLIC_YM_ID)

# Должно вывести:
# GA ID: G-3437T4EM9D
# YM ID: 107194144
```

### 4. Проверка скриптов

```bash
# DevTools → Network → фильтр "gtag" или "metrika"
# Должны быть запросы к:
# - googletagmanager.com/gtag/js?id=G-3437T4EM9D
# - mc.yandex.ru/metrika/tag.js
```

---

## 📊 Что будет отслеживаться

### Google Analytics

- **Просмотры страниц**: автоматически
- **События**: можно добавить кастомные
- **Пользователи**: уникальные посетители
- **Сессии**: длительность визитов
- **География**: откуда заходят
- **Устройства**: desktop/mobile/tablet
- **Браузеры**: Chrome, Firefox, Safari и т.д.

### Yandex Metrika

- **Просмотры страниц**: автоматически
- **Карта кликов**: где кликают пользователи
- **Вебвизор**: запись сессий пользователей
- **Карта скроллинга**: до куда скроллят
- **Формы**: анализ заполнения форм
- **Цели**: можно настроить конверсии

---

## 🎯 Настройка целей (опционально)

### Google Analytics

1. Admin → Data Streams → Web → Enhanced measurement
2. Включить:
   - ✅ Page views
   - ✅ Scrolls
   - ✅ Outbound clicks
   - ✅ Site search
   - ✅ Video engagement
   - ✅ File downloads

### Yandex Metrika

1. Настройки → Цели → Добавить цель
2. Примеры целей:
   - Посещение страницы профиля: URL содержит `/profile`
   - Клик на Discord: Клик по элементу с классом `.discord-link`
   - Просмотр стримов: URL содержит `/streams`

---

## 🔒 Конфиденциальность

### GDPR / Cookie Consent

Если у вас есть пользователи из ЕС, нужно добавить cookie consent:

```typescript
// components/CookieConsent.tsx
'use client'

import { useState, useEffect } from 'react'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="cookie-consent">
      <p>
        Мы используем cookies для аналитики и улучшения сайта.
      </p>
      <button onClick={accept}>Принять</button>
    </div>
  )
}
```

Добавить в `layout.tsx`:
```typescript
import { CookieConsent } from '../components/CookieConsent'

// В body:
<CookieConsent />
```

---

## 📈 Полезные отчеты

### Google Analytics

**Популярные страницы:**
- Reports → Engagement → Pages and screens

**Источники трафика:**
- Reports → Acquisition → Traffic acquisition

**Поведение пользователей:**
- Reports → Engagement → Events

### Yandex Metrika

**Популярные страницы:**
- Отчеты → Стандартные отчеты → Содержание → Страницы

**Источники:**
- Отчеты → Стандартные отчеты → Источники → Сводка

**Вебвизор:**
- Вебвизор → Записи визитов

---

## 🚨 Troubleshooting

### Analytics не работает

**Проверить:**
1. Переменные окружения добавлены в Vercel
2. Проект redeploy после добавления переменных
3. ID правильные (без опечаток)
4. Нет блокировщиков рекламы (AdBlock, uBlock)
5. Нет ошибок в Console

**Если не работает локально:**
```bash
# Проверить .env.local
cat frontend/.env.local

# Должно быть:
# NEXT_PUBLIC_GA_ID=G-3437T4EM9D
# NEXT_PUBLIC_YM_ID=107194144

# Перезапустить dev server
npm run dev
```

**Если не работает в production:**
```bash
# Проверить переменные в Vercel
vercel env ls

# Должны быть NEXT_PUBLIC_GA_ID и NEXT_PUBLIC_YM_ID

# Если нет - добавить и redeploy
```

### Данные не появляются

- Google Analytics: данные могут появиться с задержкой до 24 часов
- Yandex Metrika: данные в реальном времени в "Посетители онлайн"

### AdBlock блокирует

Это нормально. Пользователи с AdBlock не будут отслеживаться.
Обычно это 20-30% пользователей.

---

## 📝 Следующие шаги

После настройки аналитики:

1. ✅ Подождать 24 часа для накопления данных
2. ✅ Проверить отчеты в GA и YM
3. ✅ Настроить цели и конверсии
4. ✅ Настроить алерты (опционально)
5. ✅ Добавить кастомные события (опционально)

---

## 🎉 Готово!

После выполнения этих шагов у вас будет:
- ✅ Полная аналитика посещений
- ✅ Отслеживание поведения пользователей
- ✅ Данные для принятия решений
- ✅ Понимание аудитории

---

**Последнее обновление:** 07.03.2026

