# 📊 Настройка мониторинга и аналитики

Руководство по настройке систем мониторинга для production окружения.

---

## 🎯 Обзор

Проект использует следующие системы мониторинга:

1. **Google Analytics** - веб-аналитика, поведение пользователей
2. **Yandex Metrika** - российская альтернатива GA, вебвизор
3. **Sentry** - отслеживание ошибок и производительности
4. **Web Vitals** - метрики производительности (LCP, FID, CLS)

---

## 1️⃣ Google Analytics

### Регистрация

1. Перейдите на https://analytics.google.com
2. Создайте аккаунт и ресурс
3. Выберите "Веб" → введите URL сайта
4. Скопируйте Measurement ID (формат: `G-XXXXXXXXXX`)

### Настройка

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

```tsx
// app/layout.tsx
import { GoogleAnalytics } from '../components/GoogleAnalytics'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  )
}
```

### Проверка

1. Откройте сайт в браузере
2. В GA перейдите в "Отчеты" → "Реал-тайм"
3. Должны появиться активные пользователи

---

## 2️⃣ Yandex Metrika

### Регистрация

1. Перейдите на https://metrika.yandex.ru
2. Нажмите "Добавить счетчик"
3. Введите URL сайта и настройки
4. Скопируйте ID счетчика (число, например: `12345678`)

### Настройка

```bash
# .env.local
NEXT_PUBLIC_YM_ID=12345678
```

```tsx
// app/layout.tsx
import { YandexMetrika } from '../components/YandexMetrika'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <YandexMetrika ymId={process.env.NEXT_PUBLIC_YM_ID!} />
      </body>
    </html>
  )
}
```

### Возможности

- **Вебвизор** - запись сессий пользователей
- **Карта кликов** - тепловая карта кликов
- **Карта скроллинга** - как далеко скроллят
- **Формы** - анализ заполнения форм

---

## 3️⃣ Sentry (Error Tracking)

### Регистрация

1. Перейдите на https://sentry.io
2. Создайте аккаунт и проект (Next.js)
3. Скопируйте DSN

### Установка

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Wizard автоматически создаст:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Обновит `next.config.js`

### Настройка

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx
```

### Использование

```tsx
// Автоматический отлов ошибок
import * as Sentry from '@sentry/nextjs'

// Ручная отправка ошибки
try {
  // код
} catch (error) {
  Sentry.captureException(error)
}

// Отправка сообщения
Sentry.captureMessage('Something went wrong', 'error')

// Установка пользователя
Sentry.setUser({ id: '123', username: 'user' })
```

### Интеграция с ErrorBoundary

```tsx
// components/ErrorBoundary.tsx
import * as Sentry from '@sentry/nextjs'

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  })
}
```

---

## 4️⃣ Web Vitals

### Автоматическое отслеживание

Web Vitals уже настроены и отправляются в GA автоматически.

### Метрики

- **LCP** (Largest Contentful Paint) - скорость загрузки контента
- **FID** (First Input Delay) - время до первого взаимодействия
- **CLS** (Cumulative Layout Shift) - стабильность макета
- **FCP** (First Contentful Paint) - первая отрисовка
- **TTFB** (Time to First Byte) - время до первого байта
- **INP** (Interaction to Next Paint) - отзывчивость

### Целевые значения

| Метрика | Хорошо | Требует улучшения | Плохо |
|---------|--------|-------------------|-------|
| LCP | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FID | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| TTFB | ≤ 800ms | 800ms - 1800ms | > 1800ms |
| INP | ≤ 200ms | 200ms - 500ms | > 500ms |

### Просмотр в GA

1. Откройте Google Analytics
2. Перейдите в "События"
3. Найдите события: `LCP`, `FID`, `CLS`, `FCP`, `TTFB`

---

## 5️⃣ Custom Events

### Отслеживание событий

```tsx
import { trackEvent, trackButtonClick, trackError } from '@/lib/analytics'

// Клик по кнопке
<Button onClick={() => {
  trackButtonClick('Login Button', 'Header')
  handleLogin()
}}>
  Войти
</Button>

// Пользовательское событие
trackEvent('profile_edit', {
  field: 'bio',
  length: bio.length,
})

// Ошибка
try {
  await api.call()
} catch (error) {
  trackError(error, 'API Call Failed')
}
```

### Автоматическое отслеживание страниц

```tsx
// app/layout.tsx
'use client'

import { usePageTracking } from '@/hooks/usePageTracking'

export default function RootLayout({ children }) {
  usePageTracking() // Автоматически отслеживает переходы
  
  return <html><body>{children}</body></html>
}
```

---

## 6️⃣ Dashboard и Alerts

### Google Analytics Dashboard

Создайте custom dashboard:
1. GA → "Отчеты" → "Библиотека"
2. "Создать" → "Информационная панель"
3. Добавьте виджеты:
   - Активные пользователи
   - Просмотры страниц
   - Показатель отказов
   - Средняя длительность сеанса
   - Web Vitals метрики

### Sentry Alerts

Настройте уведомления:
1. Sentry → "Alerts" → "Create Alert"
2. Условия:
   - Новая ошибка
   - Частота ошибок > X в минуту
   - Падение производительности
3. Канал уведомлений:
   - Email
   - Slack
   - Discord webhook

---

## 7️⃣ Privacy & GDPR

### Cookie Consent

Для соответствия GDPR добавьте cookie banner:

```bash
npm install react-cookie-consent
```

```tsx
// app/layout.tsx
import CookieConsent from 'react-cookie-consent'

<CookieConsent
  location="bottom"
  buttonText="Принять"
  declineButtonText="Отклонить"
  enableDeclineButton
  onAccept={() => {
    // Включить аналитику
  }}
  onDecline={() => {
    // Отключить аналитику
  }}
>
  Мы используем cookies для улучшения работы сайта.
</CookieConsent>
```

### Политика конфиденциальности

Создайте страницу `/privacy` с информацией:
- Какие данные собираются
- Как используются
- Как отключить tracking
- Контакты для запросов

---

## 8️⃣ Production Checklist

### Перед деплоем

- [ ] Добавлены все env переменные
- [ ] GA и YM ID настроены
- [ ] Sentry DSN добавлен
- [ ] Cookie consent работает
- [ ] Privacy policy создана
- [ ] Alerts настроены в Sentry
- [ ] Dashboard создан в GA

### После деплоя

- [ ] Проверить GA Real-time
- [ ] Проверить YM счетчик
- [ ] Проверить Sentry (отправить тестовую ошибку)
- [ ] Проверить Web Vitals в GA
- [ ] Настроить Google Search Console
- [ ] Настроить Yandex Webmaster

---

## 9️⃣ Полезные ссылки

### Документация
- [Google Analytics](https://support.google.com/analytics)
- [Yandex Metrika](https://yandex.ru/support/metrica/)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Web Vitals](https://web.dev/vitals/)

### Инструменты
- [GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger)
- [Sentry CLI](https://docs.sentry.io/product/cli/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 🆘 Troubleshooting

### GA не показывает данные

1. Проверьте GA_ID в .env
2. Откройте DevTools → Network → найдите запросы к `google-analytics.com`
3. Проверьте что скрипт загружается (не блокируется AdBlock)
4. Подождите 24-48 часов для первых данных

### Sentry не ловит ошибки

1. Проверьте SENTRY_DSN
2. Убедитесь что `NODE_ENV=production`
3. Проверьте что Sentry.init() вызывается
4. Отправьте тестовую ошибку: `Sentry.captureMessage('test')`

### Web Vitals не отправляются

1. Проверьте что GA настроен
2. Откройте DevTools → Console → ищите `[Web Vitals]`
3. Проверьте что `reportWebVitals` вызывается в layout

---

**Готово!** Мониторинг настроен и готов к production.
