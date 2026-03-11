# Дизайн-система Лесная Команда

Полная дизайн-система основанная на макетах из Figma/Pencil.

## 📦 Установка

Дизайн-система автоматически подключается через `globals.css`:

```tsx
import '../app/globals.css'
```

## 🎨 Цветовая палитра

### Primary Colors
- `--color-primary`: #9147ff (Основной фиолетовый)
- `--color-primary-hover`: #c379ff (Hover состояние)
- `--color-primary-dim`: rgba(145, 71, 255, 0.05) (Приглушенный)

### Background
- `--color-bg`: #1e1e1e (Основной фон)
- `--color-bg-elevated`: #1f1f1f (Поднятый фон)
- `--color-bg-card`: rgba(255, 255, 255, 0.03) (Фон карточек)

### White Variations
- `--color-white`: #ffffff
- `--color-white-80`: rgba(255, 255, 255, 0.8)
- `--color-white-64`: rgba(255, 255, 255, 0.64)
- `--color-white-26`: rgba(255, 255, 255, 0.26)

## 🔘 Кнопки

### Импорт
```tsx
import { Button, IconButton } from '@/components/ui'
```

### Варианты

#### Primary Button
```tsx
<Button variant="primary" size="lg">
  Войти
</Button>
```

#### Secondary Button
```tsx
<Button variant="secondary" size="md">
  Отмена
</Button>
```

#### Ghost Button
```tsx
<Button variant="ghost" size="sm">
  Закрыть
</Button>
```

### С иконками
```tsx
<Button 
  variant="primary" 
  icon={<ArrowRight />}
  iconPosition="right"
>
  Продолжить
</Button>
```

### Icon Button
```tsx
<IconButton 
  icon={<Close />}
  variant="secondary"
  aria-label="Закрыть"
/>
```

### Размеры
- `lg`: 48px высота, 20px шрифт
- `md`: 40px высота, 16px шрифт
- `sm`: 32px высота, 14px шрифт

## 🃏 Карточки

### Импорт
```tsx
import { 
  Card, 
  CardImage, 
  CardContent, 
  CardTitle, 
  CardDescription 
} from '@/components/ui'
```

### Использование
```tsx
<Card>
  <CardImage src="/image.jpg" alt="Описание" />
  <CardContent>
    <CardTitle>Заголовок</CardTitle>
    <CardDescription>
      Описание карточки с дополнительной информацией
    </CardDescription>
  </CardContent>
</Card>
```

## 📝 Инпуты

### Импорт
```tsx
import { Input, Textarea } from '@/components/ui'
```

### Input
```tsx
<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  error="Неверный email"
/>
```

### Textarea
```tsx
<Textarea
  label="Описание"
  placeholder="Расскажите о себе..."
  rows={4}
/>
```

## 🏷️ Badges

### Импорт
```tsx
import { Badge } from '@/components/ui'
```

### Варианты
```tsx
<Badge variant="primary">Новое</Badge>
<Badge variant="success">Активен</Badge>
<Badge variant="error">Ошибка</Badge>
```

## 📐 Spacing

Используйте CSS переменные для отступов:

```css
.element {
  padding: var(--spacing-lg); /* 16px */
  margin: var(--spacing-xl); /* 20px */
  gap: var(--spacing-md); /* 12px */
}
```

### Доступные значения
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 12px
- `--spacing-lg`: 16px
- `--spacing-xl`: 20px
- `--spacing-2xl`: 24px
- `--spacing-3xl`: 32px
- `--spacing-4xl`: 48px

## 🔤 Типографика

### Font Family
```css
font-family: var(--font-family); /* Manrope */
```

### Font Weights
- `--font-weight-regular`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

### Font Sizes
- `--font-size-xs`: 12px
- `--font-size-sm`: 14px
- `--font-size-base`: 16px
- `--font-size-lg`: 18px
- `--font-size-xl`: 20px
- `--font-size-2xl`: 24px
- `--font-size-3xl`: 30px
- `--font-size-4xl`: 36px

## 🎭 Border Radius

```css
border-radius: var(--radius-md); /* 8px */
```

### Доступные значения
- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-xl`: 16px
- `--radius-2xl`: 20px
- `--radius-full`: 9999px

## ✨ Effects

### Blur
```css
backdrop-filter: blur(var(--blur-lg)); /* 26.25px */
```

### Transitions
```css
transition: all var(--transition-base); /* 200ms ease */
```

## 🛠️ Utility Classes

### Text Colors
```tsx
<p className="text-primary">Фиолетовый текст</p>
<p className="text-white">Белый текст</p>
<p className="text-muted">Приглушенный текст</p>
```

### Backgrounds
```tsx
<div className="bg-elevated">Поднятый фон</div>
```

### Borders
```tsx
<div className="border-accent">Акцентная граница</div>
```

## 📱 Адаптивность

Все компоненты адаптивны и корректно работают на мобильных устройствах.

## 🎯 Примеры использования

### Форма входа
```tsx
<form>
  <Input
    label="Email"
    type="email"
    placeholder="your@email.com"
  />
  <Input
    label="Пароль"
    type="password"
    placeholder="••••••••"
  />
  <Button variant="primary" size="lg" type="submit">
    Войти
  </Button>
</form>
```

### Карточка новости
```tsx
<Card>
  <CardImage src="/news.jpg" alt="Новость" />
  <CardContent>
    <Badge variant="primary">Новое</Badge>
    <CardTitle>Заголовок новости</CardTitle>
    <CardDescription>
      Краткое описание новости...
    </CardDescription>
    <Button variant="secondary">
      Читать далее
    </Button>
  </CardContent>
</Card>
```

## 🔗 Связанные файлы

- `frontend/styles/design-system.css` - CSS переменные и базовые стили
- `frontend/components/ui/` - React компоненты
- `frontend/app/globals.css` - Глобальные стили
