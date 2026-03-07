# ⏳ Loading States - Skeleton Loaders

## Реализовано

### 1. Базовые компоненты Skeleton

#### Skeleton (Base Component)
**Файл:** `frontend/components/ui/Skeleton/Skeleton.tsx`

Универсальный компонент скелетона с анимацией shimmer.

**Варианты:**
- `text` - для текста (высота 1rem, скругление 4px)
- `circular` - для аватаров (круглый)
- `rectangular` - для блоков (скругление 8px)

**Использование:**
```tsx
<Skeleton width="200px" height="20px" />
<Skeleton variant="circular" width={48} height={48} />
<Skeleton variant="text" />
```

#### Preset компоненты:

**SkeletonText** - несколько строк текста
```tsx
<SkeletonText lines={3} />
```

**SkeletonCard** - карточка с изображением и текстом
```tsx
<SkeletonCard />
```

**SkeletonAvatar** - круглый аватар
```tsx
<SkeletonAvatar size={48} />
```

**SkeletonButton** - кнопка
```tsx
<SkeletonButton width="120px" />
```

### 2. Специализированные скелетоны

#### NewsSkeleton
**Файл:** `frontend/components/skeletons/NewsSkeleton.tsx`

Скелетон для секции новостей. Показывает 3 карточки новостей с изображениями.

**Особенности:**
- Адаптивная сетка (1 колонка на mobile, 2 на tablet, 3 на desktop)
- Изображение + заголовок + дата + текст

#### EventsSkeleton
**Файл:** `frontend/components/skeletons/EventsSkeleton.tsx`

Скелетон для секции событий. Показывает 3 карточки событий.

**Особенности:**
- Адаптивная сетка
- Заголовок + описание + кнопка

#### FeedSkeleton
**Файл:** `frontend/components/skeletons/FeedSkeleton.tsx`

Скелетон для ленты активности. Показывает 4 записи.

**Особенности:**
- Аватар + имя + дата + текст
- Вертикальный список

#### AdminTableSkeleton
**Файл:** `frontend/components/skeletons/AdminTableSkeleton.tsx`

Скелетон для админ-панели. Показывает таблицу с записями.

**Особенности:**
- Настраиваемое количество строк
- Контент + кнопки действий

### 3. Обновленные компоненты

#### Главная страница

**NewsSection** (`frontend/components/home/NewsSection.tsx`)
- ✅ Заменен "Загрузка новостей..." на `<NewsSkeleton />`
- ✅ Показывает заголовок секции во время загрузки

**EventsSection** (`frontend/components/home/EventsSection.tsx`)
- ✅ Заменен "Загрузка событий..." на `<EventsSkeleton />`
- ✅ Показывает заголовок секции во время загрузки

**FeedSection** (`frontend/components/home/FeedSection.tsx`)
- ✅ Заменен "Загрузка ленты..." на `<FeedSkeleton />`
- ✅ Показывает заголовок секции во время загрузки

#### Админ-панель

**News Page** (`frontend/app/admin/news/page.tsx`)
- ✅ Заменен "Загрузка..." на `<AdminTableSkeleton rows={5} />`
- ✅ Показывает header во время загрузки

**Streamers Page** (`frontend/app/admin/streamers/page.tsx`)
- ✅ Заменен "Загрузка..." на `<AdminTableSkeleton rows={5} />`
- ✅ Показывает header во время загрузки

**Merch Page** (`frontend/app/admin/merch/page.tsx`)
- ✅ Заменен "Загрузка..." на `<AdminTableSkeleton rows={5} />`
- ✅ Показывает header во время загрузки

### 4. Анимация

**Shimmer Effect:**
```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- Плавная анимация градиента
- Длительность: 1.5s
- Infinite loop

**Accessibility:**
- `aria-busy="true"` - указывает что контент загружается
- `aria-live="polite"` - для screen readers
- `prefers-reduced-motion` - отключает анимацию для пользователей с настройкой

## Преимущества

### 1. Лучший UX
- Пользователь видит структуру контента до загрузки
- Нет резких переходов от "Загрузка..." к контенту
- Воспринимается как более быстрая загрузка

### 2. Профессиональный вид
- Современный подход (используется в Facebook, LinkedIn, YouTube)
- Плавная анимация shimmer
- Адаптивный дизайн

### 3. Accessibility
- Screen readers знают что контент загружается
- Поддержка prefers-reduced-motion
- Семантически правильная разметка

### 4. Переиспользуемость
- Базовые компоненты можно комбинировать
- Специализированные скелетоны для разных секций
- Легко добавить новые варианты

## Архитектура

```
Skeleton (Base)
├── SkeletonText
├── SkeletonCard
├── SkeletonAvatar
└── SkeletonButton

Specialized Skeletons
├── NewsSkeleton (uses Skeleton + SkeletonText)
├── EventsSkeleton (uses Skeleton + SkeletonText)
├── FeedSkeleton (uses SkeletonAvatar + SkeletonText)
└── AdminTableSkeleton (uses Skeleton + SkeletonText)
```

## Примеры использования

### Простой скелетон
```tsx
import { Skeleton } from '@/components/ui/Skeleton'

function MyComponent() {
  const [loading, setLoading] = useState(true)
  
  if (loading) {
    return <Skeleton width="100%" height="200px" />
  }
  
  return <div>Content</div>
}
```

### Скелетон с текстом
```tsx
import { SkeletonText } from '@/components/ui/Skeleton'

if (loading) {
  return (
    <div>
      <Skeleton variant="text" height="2rem" width="60%" />
      <SkeletonText lines={3} />
    </div>
  )
}
```

### Специализированный скелетон
```tsx
import { NewsSkeleton } from '@/components/skeletons'

if (loading) {
  return (
    <section>
      <h2>Новости</h2>
      <NewsSkeleton />
    </section>
  )
}
```

## Кастомизация

### Цвета
Скелетоны используют CSS переменные:
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray) 0%,
    var(--gray-light) 50%,
    var(--gray) 100%
  );
}
```

Можно переопределить в теме:
```css
:root {
  --gray: #1a1a1a;
  --gray-light: #2a2a2a;
}
```

### Скорость анимации
```css
.skeleton {
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Быстрее */
.skeleton.fast {
  animation-duration: 1s;
}

/* Медленнее */
.skeleton.slow {
  animation-duration: 2s;
}
```

## Следующие шаги

Из списка критичных улучшений:
1. ✅ Переменные окружения - ГОТОВО
2. ✅ Error boundaries - ГОТОВО
3. ✅ Loading states - ГОТОВО
4. ⏳ Валидация форм - клиентская валидация в админке

## Рекомендации

### Когда использовать скелетоны:
- Загрузка данных с API (списки, карточки)
- Первоначальная загрузка страницы
- Lazy loading компонентов
- Infinite scroll

### Когда НЕ использовать:
- Очень быстрые операции (<200ms)
- Формы (используй disabled state)
- Кнопки (используй loading spinner)
- Модальные окна (используй overlay loader)

### Best Practices:
1. Скелетон должен повторять структуру реального контента
2. Используй правильные размеры (не слишком большие/маленькие)
3. Показывай заголовки секций во время загрузки
4. Не показывай скелетон для повторных загрузок (используй stale-while-revalidate)

## Дата
07.03.2026
