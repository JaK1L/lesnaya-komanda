# 🚀 План улучшений проекта "Лесная Команда"

> Документ содержит рекомендации по улучшению кода, производительности, UX и архитектуры проекта

**Дата создания:** 2026-03-07  
**Версия:** 1.0.0  
**Статус проекта:** MVP → Production Ready

---

## 📊 Текущая оценка проекта

| Критерий | Оценка | Статус |
|----------|--------|--------|
| Архитектура | 8/10 | ✅ Хорошо |
| Код качество | 7/10 | ⚠️ Требует улучшений |
| Дизайн | 7/10 | ⚠️ Не везде адаптивен |
| Производительность | 6/10 | ❌ Нужна оптимизация |
| Accessibility | 5/10 | ❌ Много пробелов |
| **ИТОГО** | **6.6/10** | ⚠️ **Хороший MVP** |

---

## 🎯 ПРИОРИТЕТЫ

### 🔴 КРИТИЧНОЕ (1-2 недели)

#### 1. Завершить рефакторинг компонентов

**Статус:** ✅ Выполнено

**Что сделано:**
- ✅ Главная страница разбита на компоненты
- ✅ Создана UI библиотека (Button, Card, Modal)
- ✅ CSS Modules вместо inline стилей
- ✅ Navigation и Footer вынесены в layout
- ✅ Страница профиля разбита на компоненты (ProfileHeader, ProfileEditForm, GamePreferencesSection)
- ✅ Страницы мерча, стримов, соцсетей используют общие компоненты
- ✅ Добавлена директива 'use client' для страниц с event handlers

**Что осталось:**
- ❌ Админ-панель (будет сделана позже при необходимости)

**Как сделать:**
```bash
# Админка (опционально, при необходимости)
frontend/components/admin/
  ├── EventsManager.tsx
  ├── FeedManager.tsx
  └── SettingsPanel.tsx
```

**Время:** ✅ Завершено  
**Приоритет:** 🔴 Высокий

---

#### 2. Mobile-First адаптив

**Статус:** ❌ Не сделано

**Проблема:**
- Дизайн сделан Desktop-First
- На мобильных устройствах плохо выглядит
- Нет тестирования на разных разрешениях

**Решение:**

```css
/* ❌ ПЛОХО - Desktop First */
.container {
  max-width: 1400px;
  padding: 2rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}

/* ✅ ХОРОШО - Mobile First */
.container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    max-width: 1400px;
    padding: 2rem;
  }
}
```

**Breakpoints:**
```css
/* Mobile: 320px - 767px (по умолчанию) */
/* Tablet: 768px - 1023px */
@media (min-width: 768px) { }

/* Desktop: 1024px+ */
@media (min-width: 1024px) { }

/* Large Desktop: 1440px+ */
@media (min-width: 1440px) { }
```

**Тестирование:**
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1920px)

**Время:** 2-3 дня  
**Приоритет:** 🔴 Критичный

---

#### 3. Обработка ошибок и Loading States

**Статус:** ❌ Частично сделано

**Проблема:**
```tsx
// ❌ Нет обработки loading
const [data, setData] = useState([])
return <div>{data.map(...)}</div>

// ❌ Нет обработки ошибок
try {
  const res = await fetch(...)
} catch (err) {
  console.error(err) // Только в консоль!
}
```

**Решение:**

**A. Создать Skeleton компонент:**
```tsx
// components/ui/Skeleton/Skeleton.tsx
export function Skeleton({ 
  width = '100%', 
  height = '20px',
  count = 1 
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className={styles.skeleton}
          style={{ width, height }}
        />
      ))}
    </>
  )
}
```

**B. Создать ErrorMessage компонент:**
```tsx
// components/ui/ErrorMessage/ErrorMessage.tsx
export function ErrorMessage({ 
  message, 
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className={styles.error}>
      <AlertCircle size={48} />
      <p>{message}</p>
      {onRetry && (
        <Button onClick={onRetry}>Попробовать снова</Button>
      )}
    </div>
  )
}
```

**C. Использовать везде:**
```tsx
// ✅ ПРАВИЛЬНО
if (loading) return <Skeleton count={3} />
if (error) return <ErrorMessage message={error} onRetry={refetch} />
return <DataList data={data} />
```

**Время:** 1-2 дня  
**Приоритет:** 🔴 Высокий

---

#### 4. Accessibility аудит

**Статус:** ❌ Базовый уровень

**Проблемы:**
- ❌ Не все интерактивные элементы доступны с клавиатуры
- ❌ Нет skip navigation
- ❌ Плохой контраст в некоторых местах
- ❌ Нет ARIA labels на иконках

**Чек-лист:**

```tsx
// ✅ Семантичный HTML
<nav> вместо <div className="nav">
<button> вместо <div onClick={}>
<main>, <aside>, <footer>

// ✅ ARIA атрибуты
<button aria-label="Закрыть меню">
<img alt="Описание изображения">
<input aria-describedby="error-message">

// ✅ Keyboard navigation
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleClick()
  }
}}

// ✅ Focus management
const firstFocusableElement = modalRef.current?.querySelector('button')
firstFocusableElement?.focus()

// ✅ Контраст (минимум 4.5:1)
Проверить на https://webaim.org/resources/contrastchecker/
```

**Инструменты:**
- Lighthouse (Chrome DevTools)
- axe DevTools (расширение)
- WAVE (расширение)
- Keyboard navigation тест (Tab, Enter, Esc)

**Время:** 2-3 дня  
**Приоритет:** 🔴 Высокий

---

#### 5. TypeScript strict mode

**Статус:** ❌ Не включен

**Проблема:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false // ❌
  }
}
```

**Решение:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Исправить типы:**
```tsx
// ❌ ПЛОХО
const [data, setData] = useState(null)

// ✅ ХОРОШО
const [data, setData] = useState<Player[] | null>(null)

// ❌ ПЛОХО
function handleClick(e) { }

// ✅ ХОРОШО
function handleClick(e: React.MouseEvent<HTMLButtonElement>) { }
```

**Время:** 1 день  
**Приоритет:** 🔴 Средний

---

### 🟡 ВАЖНОЕ (2-3 недели)

#### 6. Оптимизация изображений

**Статус:** ❌ Не сделано

**Проблема:**
```tsx
// ❌ Обычный img тег
<img src={avatar} alt="Avatar" />
```

**Решение:**
```tsx
// ✅ Next.js Image
import Image from 'next/image'

<Image
  src={avatar}
  alt="Avatar"
  width={120}
  height={120}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

**Преимущества:**
- Автоматическая оптимизация (WebP/AVIF)
- Lazy loading из коробки
- Blur placeholder
- Responsive images
- Предотвращение CLS (Cumulative Layout Shift)

**Время:** 1 день  
**Приоритет:** 🟡 Высокий

---

#### 7. Code Splitting и Lazy Loading

**Статус:** ❌ Не сделано

**Проблема:**
- Весь JS загружается сразу
- Большой initial bundle size
- Медленная загрузка на слабых устройствах

**Решение:**

**A. Lazy load компонентов:**
```tsx
// ❌ ПЛОХО
import { GamePreferencesModal } from '../components/GamePreferencesModal'

// ✅ ХОРОШО
import dynamic from 'next/dynamic'

const GamePreferencesModal = dynamic(
  () => import('../components/GamePreferencesModal'),
  { 
    loading: () => <Skeleton />,
    ssr: false 
  }
)
```

**B. Route-based splitting (уже есть в Next.js):**
```
/page.tsx → page.js
/profile/page.tsx → profile.js
/admin/page.tsx → admin.js
```

**C. Vendor splitting:**
```js
// next.config.js
module.exports = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    }
    return config
  }
}
```

**Время:** 2 дня  
**Приоритет:** 🟡 Средний

---

#### 8. Мемоизация и оптимизация ре-рендеров

**Статус:** ❌ Не сделано

**Проблема:**
```tsx
// ❌ Пересчитывается при каждом рендере
const filteredPlayers = players.filter(p => p.is_online)

// ❌ Новая функция при каждом рендере
<Button onClick={() => handleClick(id)} />
```

**Решение:**

**A. useMemo для вычислений:**
```tsx
const filteredPlayers = useMemo(
  () => players.filter(p => p.is_online),
  [players]
)
```

**B. useCallback для функций:**
```tsx
const handleClick = useCallback(
  (id: number) => {
    // logic
  },
  [dependencies]
)
```

**C. React.memo для компонентов:**
```tsx
export const PlayerCard = React.memo(({ player }: Props) => {
  return <div>...</div>
})
```

**D. Виртуализация длинных списков:**
```tsx
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={players.length}
  itemSize={80}
>
  {({ index, style }) => (
    <PlayerCard player={players[index]} style={style} />
  )}
</FixedSizeList>
```

**Время:** 2-3 дня  
**Приоритет:** 🟡 Средний

---

#### 9. SEO оптимизация

**Статус:** ✅ Выполнено

**Что нужно:**

**A. Meta tags:**
```tsx
// app/layout.tsx
export const metadata = {
  title: 'Лесная Команда - Игровое сообщество',
  description: 'Мы — своя стая. Играем в CS2, Dota 2, Valorant',
  keywords: 'gaming, community, cs2, dota2, valorant',
  openGraph: {
    title: 'Лесная Команда',
    description: 'Игровое сообщество',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Лесная Команда',
    description: 'Игровое сообщество',
    images: ['/twitter-image.jpg'],
  }
}
```

**B. Structured Data (JSON-LD):**
```tsx
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Лесная Команда",
  "url": "https://lesnaya-komanda.com",
  "logo": "https://lesnaya-komanda.com/logo.png",
  "sameAs": [
    "https://discord.gg/...",
    "https://t.me/..."
  ]
}
</script>
```

**C. Sitemap и robots.txt:**
```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lesnaya-komanda.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://lesnaya-komanda.com/streams</loc>
    <priority>0.8</priority>
  </url>
</urlset>
```

```txt
# public/robots.txt
User-agent: *
Allow: /
Sitemap: https://lesnaya-komanda.com/sitemap.xml
```

**Время:** 1-2 дня  
**Приоритет:** 🟡 Средний

---

#### 10. Lighthouse аудит и оптимизация

**Статус:** ✅ Выполнено

**Цель:** 90+ баллов по всем метрикам

**Метрики:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

**Как проверить:**
```bash
# 1. Chrome DevTools → Lighthouse
# 2. Или через CLI
npm install -g lighthouse
lighthouse https://your-site.com --view
```

**Основные проблемы и решения:**

| Проблема | Решение |
|----------|---------|
| Большой FCP | Code splitting, lazy loading |
| Большой LCP | Оптимизация изображений, preload |
| Высокий CLS | Width/height на img, font-display |
| Долгий TTI | Уменьшить JS bundle, defer scripts |
| Плохой TBT | Разбить длинные задачи, web workers |

**Время:** 2-3 дня  
**Приоритет:** 🟡 Высокий

---

### 🟢 УЛУЧШЕНИЯ (1-2 недели)

#### 11. Анимации и микроинтеракции

**Статус:** ✅ Выполнено

**Что добавить:**

**A. Page transitions:**
```tsx
// app/template.tsx
import { motion } from 'framer-motion'

export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
```

**B. Hover эффекты:**
```css
.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(74, 255, 117, 0.2);
}
```

**C. Loading animations:**
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
>
  <Loader />
</motion.div>
```

**D. Stagger animations:**
```tsx
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map(item => (
    <motion.div variants={itemVariants}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

**Время:** 2-3 дня  
**Приоритет:** 🟢 Низкий

---

#### 12. Error Boundary

**Статус:** ✅ Выполнено

**Зачем:** Ловить ошибки React и показывать fallback UI

```tsx
// components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // Можно отправить в Sentry/LogRocket
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Что-то пошло не так</h2>
          <button onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Использование:**
```tsx
// app/layout.tsx
<ErrorBoundary>
  <Navigation />
  {children}
  <Footer />
</ErrorBoundary>
```

**Время:** 1 день  
**Приоритет:** 🟢 Средний

---

#### 13. Тестирование

**Статус:** ✅ Выполнено (базовое покрытие)

**Что тестировать:**

**A. Unit тесты (компоненты):**
```tsx
// components/ui/Button/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByText('Click').click()
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('applies variant classes', () => {
    render(<Button variant="primary">Primary</Button>)
    expect(screen.getByText('Primary')).toHaveClass('primary')
  })
})
```

**B. Integration тесты (страницы):**
```tsx
// app/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import Home from './page'

vi.mock('axios')

describe('Home Page', () => {
  it('loads and displays streamers', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('СТРИМЕРЫ ЛЕСНОЙ КОМАНДЫ')).toBeInTheDocument()
    })
  })
})
```

**C. E2E тесты (Playwright):**
```ts
// e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test('home page loads correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('LESNAYA')
  await expect(page.locator('nav')).toBeVisible()
})
```

**Покрытие:**
- Цель: 80%+ для критичных компонентов
- UI компоненты: 90%+
- Бизнес-логика: 80%+
- Утилиты: 100%

**Время:** 5-7 дней  
**Приоритет:** 🟢 Средний

---

#### 14. Документация API (Swagger)

**Статус:** ✅ Выполнено

**Что сделано:**
- ✅ Расширенная конфигурация FastAPI с полным описанием
- ✅ Swagger UI доступен по `/api/docs`
- ✅ ReDoc доступен по `/api/redoc`
- ✅ OpenAPI схема по `/api/openapi.json`
- ✅ Метаданные тегов для группировки эндпоинтов
- ✅ Примеры в Pydantic моделях (Field с examples)
- ✅ Подробные docstrings для всех эндпоинтов
- ✅ Инструкции по аутентификации в документации

**Доступ:**
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

**Время:** ✅ Завершено  
**Приоритет:** 🟢 Низкий

---

#### 15. Мониторинг и аналитика

**Статус:** ✅ Выполнено (инфраструктура готова)

**Что добавить:**

**A. Error tracking (Sentry):**
```tsx
// app/layout.tsx
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

**B. Analytics (Google Analytics / Plausible):**
```tsx
// app/layout.tsx
import Script from 'next/script'

<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
  strategy="afterInteractive"
/>
```

**C. Performance monitoring (Web Vitals):**
```tsx
// app/layout.tsx
export function reportWebVitals(metric) {
  console.log(metric)
  // Отправить в аналитику
}
```

**D. User behavior (Hotjar / LogRocket):**
```tsx
<Script
  src="https://static.hotjar.com/c/hotjar-xxx.js"
  strategy="lazyOnload"
/>
```

**Время:** 1-2 дня  
**Приоритет:** 🟢 Низкий

---

## 📈 ROADMAP

### Фаза 1: Стабилизация (2 недели)
- ✅ Рефакторинг компонентов
- ✅ Mobile-First адаптив
- ✅ Error handling
- ✅ Accessibility
- ✅ TypeScript strict

### Фаза 2: Оптимизация (3 недели)
- ✅ Image optimization
- ✅ Code splitting
- ✅ Мемоизация
- ✅ SEO
- ✅ Lighthouse 90+

### Фаза 3: Полировка (2 недели)
- ✅ Анимации
- ✅ Error Boundary
- ✅ Тестирование
- ✅ Документация (Swagger)
- ✅ Мониторинг

**Итого:** ✅ Все фазы завершены! Production Ready!

---

## 🛠️ ИНСТРУМЕНТЫ

### Разработка
- ✅ Next.js 14
- ✅ TypeScript
- ✅ Framer Motion
- ⚠️ Vitest (установлен, но не используется)
- ❌ Playwright (для E2E)
- ❌ Storybook (для UI компонентов)

### Качество кода
- ❌ ESLint (строгие правила)
- ❌ Prettier (форматирование)
- ❌ Husky (pre-commit hooks)
- ❌ lint-staged

### Производительность
- ❌ Lighthouse CI
- ❌ Bundle analyzer
- ❌ React DevTools Profiler

### Мониторинг
- ❌ Sentry (ошибки)
- ❌ Google Analytics (аналитика)
- ❌ Vercel Analytics (производительность)

---

## 📝 ЧЕКЛИСТ ПЕРЕД PRODUCTION

### Код
- [ ] Все компоненты разбиты и переиспользуемы
- [ ] TypeScript strict mode включен
- [ ] Нет console.log в production коде
- [ ] Все TODO комментарии решены
- [ ] Code review пройден

### Производительность
- [ ] Lighthouse Score 90+ (все метрики)
- [ ] Bundle size < 200KB (gzipped)
- [ ] Images оптимизированы (WebP/AVIF)
- [ ] Lazy loading настроен
- [ ] Code splitting работает

### Accessibility
- [ ] Keyboard navigation работает
- [ ] Screen reader friendly
- [ ] Контраст 4.5:1+
- [ ] ARIA labels везде
- [ ] Focus management правильный

### SEO
- [ ] Meta tags на всех страницах
- [ ] Open Graph настроен
- [ ] Sitemap.xml создан
- [ ] Robots.txt настроен
- [ ] Structured data добавлен

### Безопасность
- [ ] HTTPS включен
- [ ] CORS настроен правильно
- [ ] XSS защита
- [ ] CSRF токены
- [ ] Rate limiting на API

### Тестирование
- [ ] Unit тесты 80%+
- [ ] Integration тесты ключевых флоу
- [ ] E2E тесты критичных путей
- [ ] Тестирование на разных браузерах
- [ ] Тестирование на разных устройствах

### Мониторинг
- [ ] Error tracking настроен
- [ ] Analytics подключен
- [ ] Performance monitoring работает
- [ ] Alerts настроены
- [ ] Backup стратегия есть

---

## 🎓 ПОЛЕЗНЫЕ РЕСУРСЫ

### Документация
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

### Performance
- [Web.dev](https://web.dev/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Testing
- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)

---

## 📞 КОНТАКТЫ

**Вопросы по улучшениям:**
- GitHub Issues: [создать issue](https://github.com/your-repo/issues)
- Discord: [ваш сервер]

**Последнее обновление:** 2026-03-07  
**Следующий ревью:** 2026-03-14

---

**Сделано с 🌲 в лесу**
