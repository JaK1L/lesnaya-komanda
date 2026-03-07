# ✅ ЗАДАЧА 15 ЗАВЕРШЕНА: Мониторинг и аналитика

**Дата:** 2026-03-07  
**Статус:** ✅ Выполнено (инфраструктура готова)  
**Время:** ~1 час

---

## 📋 Что было сделано

### 1. Analytics Infrastructure

**Файл:** `frontend/lib/analytics.ts`

Универсальная система отслеживания событий:
- `trackEvent()` - отправка событий
- `trackPageView()` - просмотры страниц
- `trackButtonClick()` - клики по кнопкам
- `trackError()` - ошибки
- `trackUserAction()` - пользовательские действия

Поддержка:
- Google Analytics (gtag)
- Yandex Metrika
- Console logging в dev режиме

### 2. Web Vitals Monitoring

**Файл:** `frontend/lib/webVitals.ts`

Отслеживание метрик производительности:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)
- INP (Interaction to Next Paint)

Функции:
- `reportWebVitals()` - отправка метрик
- `getMetricRating()` - оценка метрик (good/needs-improvement/poor)

### 3. Google Analytics Component

**Файл:** `frontend/components/GoogleAnalytics.tsx`

React компонент для GA:
- Загрузка gtag.js
- Инициализация GA
- Автоматическое отслеживание страниц
- Работает только в production

### 4. Yandex Metrika Component

**Файл:** `frontend/components/YandexMetrika.tsx`

React компонент для YM:
- Загрузка метрики
- Настройка вебвизора
- Карта кликов
- Отслеживание ссылок

### 5. Sentry Integration

**Файл:** `frontend/lib/sentry.ts`

Placeholder для Sentry:
- `captureError()` - отправка ошибок
- `captureMessage()` - отправка сообщений
- `setUserContext()` - установка пользователя
- `clearUserContext()` - очистка контекста

Готово к установке `@sentry/nextjs`.

### 6. Page Tracking Hook

**Файл:** `frontend/hooks/usePageTracking.ts`

React hook для автоматического отслеживания:
- Отслеживает изменения pathname
- Отслеживает query параметры
- Автоматически вызывает trackPageView()

### 7. Environment Variables

**Файл:** `.env.example`

Добавлены переменные:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_YM_ID=XXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx
SENTRY_AUTH_TOKEN=xxxxx
```

### 8. Setup Documentation

**Файл:** `MONITORING-SETUP.md`

Полное руководство по настройке:
- Google Analytics (регистрация, настройка, проверка)
- Yandex Metrika (счетчик, вебвизор, карты)
- Sentry (установка, интеграция, использование)
- Web Vitals (метрики, целевые значения)
- Custom Events (примеры использования)
- Dashboard и Alerts
- Privacy & GDPR
- Production Checklist
- Troubleshooting

---

## 🎯 Возможности

### Автоматическое отслеживание

✅ **Page Views** - каждый переход между страницами  
✅ **Web Vitals** - метрики производительности  
✅ **Errors** - через ErrorBoundary (после интеграции Sentry)  

### Ручное отслеживание

✅ **Button Clicks** - клики по кнопкам  
✅ **Form Submits** - отправка форм  
✅ **User Actions** - любые действия пользователя  
✅ **Custom Events** - произвольные события  

### Мониторинг

✅ **Real-time** - активные пользователи (GA, YM)  
✅ **Performance** - Web Vitals метрики  
✅ **Errors** - отслеживание ошибок (Sentry)  
✅ **User Behavior** - вебвизор, карты кликов (YM)  

---

## 📊 Интеграция

### Пример использования в компонентах

```tsx
// Отслеживание клика
import { trackButtonClick } from '@/lib/analytics'

<Button onClick={() => {
  trackButtonClick('Login', 'Header')
  handleLogin()
}}>
  Войти
</Button>

// Отслеживание события
import { trackEvent } from '@/lib/analytics'

const handleProfileEdit = async () => {
  await updateProfile(data)
  trackEvent('profile_edit', {
    fields_changed: ['bio', 'avatar'],
  })
}

// Отслеживание ошибки
import { trackError } from '@/lib/analytics'

try {
  await api.call()
} catch (error) {
  trackError(error, 'API Call')
  showError()
}
```

### Интеграция в layout.tsx

```tsx
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { YandexMetrika } from '@/components/YandexMetrika'
import { usePageTracking } from '@/hooks/usePageTracking'

export default function RootLayout({ children }) {
  usePageTracking() // Автоматическое отслеживание
  
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
        <YandexMetrika ymId={process.env.NEXT_PUBLIC_YM_ID!} />
      </body>
    </html>
  )
}
```

---

## 🔧 Установка для Production

### 1. Google Analytics

```bash
# 1. Создать аккаунт на https://analytics.google.com
# 2. Получить Measurement ID (G-XXXXXXXXXX)
# 3. Добавить в .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 2. Yandex Metrika

```bash
# 1. Создать счетчик на https://metrika.yandex.ru
# 2. Получить ID счетчика (число)
# 3. Добавить в .env.local
NEXT_PUBLIC_YM_ID=12345678
```

### 3. Sentry

```bash
# 1. Установить пакет
npm install @sentry/nextjs

# 2. Запустить wizard
npx @sentry/wizard@latest -i nextjs

# 3. Добавить DSN в .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

---

## 📈 Метрики и KPI

### Основные метрики

**Traffic:**
- Уникальные посетители
- Просмотры страниц
- Показатель отказов
- Средняя длительность сеанса

**Performance:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- FCP < 1.8s

**Engagement:**
- Клики по кнопкам
- Заполнение форм
- Время на странице
- Глубина просмотра

**Errors:**
- Количество ошибок
- Типы ошибок
- Affected users
- Error rate

### Dashboards

**Google Analytics:**
- Real-time пользователи
- Traffic sources
- Popular pages
- User flow
- Web Vitals

**Yandex Metrika:**
- Вебвизор (записи сессий)
- Карта кликов
- Карта скроллинга
- Анализ форм

**Sentry:**
- Error frequency
- Affected users
- Stack traces
- Performance issues

---

## 🎓 Best Practices

### 1. Privacy First

- Получать согласие на cookies (GDPR)
- Анонимизировать IP адреса
- Не отслеживать PII (Personal Identifiable Information)
- Предоставлять opt-out

### 2. Performance

- Загружать скрипты асинхронно (`strategy="afterInteractive"`)
- Не блокировать рендеринг
- Использовать только в production
- Минимизировать количество событий

### 3. Data Quality

- Использовать понятные названия событий
- Добавлять контекст к событиям
- Валидировать данные перед отправкой
- Не дублировать события

### 4. Security

- Не отправлять чувствительные данные
- Использовать environment variables
- Не логировать токены и пароли
- Проверять CORS настройки

---

## 🆘 Troubleshooting

### GA не показывает данные

**Проблема:** Real-time пустой  
**Решение:**
1. Проверить GA_ID в .env
2. Открыть DevTools → Network → искать `google-analytics.com`
3. Отключить AdBlock
4. Подождать 24-48 часов

### Sentry не ловит ошибки

**Проблема:** Ошибки не появляются в Sentry  
**Решение:**
1. Проверить SENTRY_DSN
2. Убедиться что `NODE_ENV=production`
3. Проверить что Sentry.init() вызывается
4. Отправить тестовую ошибку

### Web Vitals не отправляются

**Проблема:** Метрики не видны в GA  
**Решение:**
1. Проверить что GA настроен
2. Открыть Console → искать `[Web Vitals]`
3. Проверить что reportWebVitals вызывается
4. Подождать несколько часов для накопления данных

---

## ✅ Итог

Инфраструктура мониторинга и аналитики полностью готова:

- ✅ Google Analytics - готов к подключению
- ✅ Yandex Metrika - готов к подключению
- ✅ Sentry - placeholder готов, нужна установка
- ✅ Web Vitals - автоматическое отслеживание
- ✅ Custom Events - API готов
- ✅ Page Tracking - автоматическое
- ✅ Documentation - полное руководство

Для активации нужно:
1. Создать аккаунты в GA и YM
2. Добавить ID в .env.local
3. Установить Sentry (опционально)
4. Задеплоить на production

**Следующая задача:** Завершить рефакторинг компонентов (задача 1)
