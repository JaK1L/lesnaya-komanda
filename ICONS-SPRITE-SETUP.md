# Настройка иконок (CSS Sprite)

## Что сделано

Создана система иконок на основе CSS Sprite - один файл со всеми иконками, из которого показываются нужные части.

## Установка

1. **Сохрани изображение со всеми иконками:**
   - Сохрани PNG файл с иконками как `frontend/public/icons-sprite.png`
   - Убедись что файл находится именно в папке `public`

2. **Файлы созданы:**
   - `frontend/components/ui/Icon/Icon.tsx` - компонент иконки
   - `frontend/components/ui/Icon/Icon.module.css` - стили со спрайтами
   - `frontend/components/ui/Icon/index.ts` - экспорты

## Использование

### Базовое использование

```tsx
import { Icon } from '@/components/ui/Icon'

// Простая иконка
<Icon name="home" />

// С размером
<Icon name="discord" size="large" />

// С кастомным классом
<Icon name="trophy" size="small" className="my-icon" />
```

### Доступные иконки

**Навигация:**
- `home`, `team`, `streams`, `games`, `news`, `contact`

**Соцсети:**
- `twitch`, `youtube`, `discord`, `telegram`, `vk`, `instagram`

**Игры:**
- `dota2`, `cs2`, `trophy`, `tournament`

**Функционал:**
- `statistics`, `rating`, `settings`, `donate`, `profile`
- `favorite`, `notification`, `search`, `calendar`, `chat`
- `like`, `fire`, `applause`, `hype`

**Декор:**
- `tree`, `leaf`, `bonus1`, `bonus2`, `laugh`, `shock`

### Размеры

- `small` - 32x32px
- `medium` - 48x48px (по умолчанию)
- `large` - 64x64px
- `xlarge` - 80x80px

## Примеры использования

### В навигации

```tsx
<nav>
  <a href="/">
    <Icon name="home" size="medium" />
    <span>Главная</span>
  </a>
  <a href="/streams">
    <Icon name="streams" size="medium" />
    <span>Стримы</span>
  </a>
</nav>
```

### В футере (соцсети)

```tsx
<footer>
  <a href="https://discord.gg/..." target="_blank">
    <Icon name="discord" size="large" />
  </a>
  <a href="https://t.me/..." target="_blank">
    <Icon name="telegram" size="large" />
  </a>
  <a href="https://twitch.tv/..." target="_blank">
    <Icon name="twitch" size="large" />
  </a>
</footer>
```

### В кнопках

```tsx
<button>
  <Icon name="fire" size="small" />
  Популярное
</button>

<button>
  <Icon name="trophy" size="small" />
  Турниры
</button>
```

## Настройка позиций (если нужно)

Если иконки отображаются неправильно, нужно подстроить позиции в `Icon.module.css`:

1. Открой `frontend/components/ui/Icon/Icon.module.css`
2. Найди нужную иконку, например `.home { background-position: 0 0; }`
3. Измени значения `background-position` по формуле:
   - X = -(номер колонки * 100px)
   - Y = -(номер ряда * 100px)

Например, иконка во 2-й колонке, 3-м ряду:
```css
.myIcon { background-position: -100px -200px; }
```

## Оптимизация

Для лучшей производительности:
1. Сожми PNG файл через https://tinypng.com/
2. Конвертируй в WebP для современных браузеров
3. Используй lazy loading для иконок вне viewport

## Коммит

```bash
# Сначала добавь файл icons-sprite.png в public
# Затем:
git add .
git commit -m "feat: добавлена система иконок на CSS Sprite"
git push
```
