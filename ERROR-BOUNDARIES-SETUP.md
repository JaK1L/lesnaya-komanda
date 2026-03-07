# 🛡️ Error Boundaries - Обработка ошибок

## Реализовано

### 1. Компоненты Error Boundaries

#### ErrorBoundary (Root Level)
**Файл:** `frontend/components/ErrorBoundary.tsx`

Глобальный error boundary, обернут вокруг всего приложения в `layout.tsx`. Ловит критичные ошибки, которые могут сломать всё приложение.

**Особенности:**
- Полноэкранный UI с иконкой ошибки
- Кнопки "Попробовать снова" и "Перезагрузить страницу"
- Детали ошибки в dev режиме
- Готов к интеграции с Sentry

#### PageErrorBoundary (Page Level)
**Файл:** `frontend/components/PageErrorBoundary.tsx`

Error boundary для отдельных страниц. Показывает дружелюбный UI с возможностью вернуться на главную.

**Особенности:**
- Название страницы в сообщении об ошибке
- Кнопки "Попробовать снова" и "На главную"
- Детали ошибки в dev режиме
- Логирование с контекстом страницы

**Использование:**
```tsx
<PageErrorBoundary pageName="Профиль">
  <YourPageContent />
</PageErrorBoundary>
```

#### SectionErrorBoundary (Section Level)
**Файл:** `frontend/components/SectionErrorBoundary.tsx`

Легковесный error boundary для отдельных секций. Не ломает всю страницу, только проблемную секцию.

**Особенности:**
- Компактный UI
- Название секции в сообщении
- Кнопка "Попробовать снова"
- Не блокирует остальной контент

**Использование:**
```tsx
<SectionErrorBoundary sectionName="Новости">
  <NewsSection />
</SectionErrorBoundary>
```

### 2. Защищенные страницы

#### Главная страница (`/`)
**Файл:** `frontend/app/page.tsx`

- ✅ Обернута в `PageErrorBoundary`
- ✅ Каждая секция обернута в `SectionErrorBoundary`:
  - Hero секция
  - Новости
  - События
  - Лента активности
  - Discord статистика

**Результат:** Если одна секция сломается, остальные продолжат работать.

#### Страница профиля (`/profile`)
**Файл:** `frontend/app/profile/page.tsx`

- ✅ Обернута в `PageErrorBoundary`
- ✅ Секции обернуты в `SectionErrorBoundary`:
  - Заголовок профиля
  - Форма редактирования
  - Активность
  - Игры

#### Админ-панель (`/admin`)
**Файл:** `frontend/app/admin/page.tsx`

- ✅ Обернута в `PageErrorBoundary`
- ✅ Отдельные error boundaries для входа и главной страницы

### 3. Стили

**Файл:** `frontend/components/ErrorBoundary.module.css`

- Адаптивный дизайн (mobile-first)
- Анимация иконки (shake effect)
- Стили для кнопок (primary/secondary)
- Детали ошибки в dev режиме (collapsible)

## Архитектура

```
┌─────────────────────────────────────┐
│   ErrorBoundary (Root)              │  ← Ловит всё
│   ┌─────────────────────────────┐   │
│   │  PageErrorBoundary          │   │  ← Ловит ошибки страницы
│   │  ┌─────────────────────┐    │   │
│   │  │ SectionErrorBoundary│    │   │  ← Ловит ошибки секции
│   │  │  <NewsSection />    │    │   │
│   │  └─────────────────────┘    │   │
│   │  ┌─────────────────────┐    │   │
│   │  │ SectionErrorBoundary│    │   │
│   │  │  <EventsSection />  │    │   │
│   │  └─────────────────────┘    │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Преимущества

### 1. Graceful Degradation
Если одна секция сломается, остальные продолжат работать. Пользователь увидит частично рабочую страницу вместо белого экрана.

### 2. Лучший UX
- Понятные сообщения об ошибках
- Возможность повторить попытку
- Возможность вернуться на главную
- Не теряется весь контекст

### 3. Debugging
- Детали ошибки в dev режиме
- Логирование с контекстом (страница/секция)
- Готовность к интеграции с Sentry

### 4. Безопасность
- Приложение не падает полностью
- Пользователь не видит stack traces в production
- Ошибки логируются для разработчиков

## Интеграция с Sentry (будущее)

В каждом error boundary есть место для интеграции с Sentry:

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Отправка в Sentry
  Sentry.captureException(error, { 
    contexts: { 
      react: { componentStack: errorInfo.componentStack },
      page: { name: this.props.pageName }
    } 
  })
}
```

## Тестирование

### Как протестировать error boundary:

1. Создать компонент, который бросает ошибку:
```tsx
const BrokenComponent = () => {
  throw new Error('Test error')
  return <div>This will never render</div>
}
```

2. Обернуть в error boundary:
```tsx
<SectionErrorBoundary sectionName="Test">
  <BrokenComponent />
</SectionErrorBoundary>
```

3. Проверить, что:
   - Ошибка поймана
   - Показан fallback UI
   - Остальной контент работает
   - Кнопка "Попробовать снова" работает

## Следующие шаги

Из списка критичных улучшений:
1. ✅ Переменные окружения - ГОТОВО
2. ✅ Error boundaries - ГОТОВО
3. ⏳ Loading states - скелетоны вместо "Загрузка..."
4. ⏳ Валидация форм - клиентская валидация в админке

## Рекомендации

### Когда использовать PageErrorBoundary:
- Вокруг всей страницы
- Когда ошибка должна показать "страница не работает"
- Когда нужна кнопка "На главную"

### Когда использовать SectionErrorBoundary:
- Вокруг независимых секций
- Когда ошибка не должна ломать всю страницу
- Вокруг компонентов, которые загружают данные

### Когда НЕ использовать:
- Вокруг каждого маленького компонента (overhead)
- Для обработки ожидаемых ошибок (используй try/catch)
- Для валидации форм (используй обычную валидацию)

## Дата
07.03.2026
