# Полный редизайн сайта - Март 2025

## Обзор
Выполнен полный редизайн сайта в современном минималистичном стиле, вдохновленном примером StreamTeam.

## Ключевые изменения

### Цветовая палитра
- **Фон**: `#0b0e14` (глубокий темный) вместо `#0f0f0f`
- **Карточки**: `#141b2b` вместо `#1b1b1b`
- **Границы**: `#2a354f` вместо `#2a2a2a`
- **Акцент**: `#9147ff` (фиолетовый - сохранен)
- **Текст**: `#e9edf5` (основной), `#b7c3e6` (вторичный), `#8192c2` (приглушенный)

### Типографика
- **Заголовки H1**: Градиентный эффект `linear-gradient(145deg, #ffffff 0%, #c0d0ff 100%)`
- **Заголовки H2**: Левая граница 6px с фиолетовым акцентом
- **Шрифт**: Inter (400, 500, 600, 700)
- **Размеры**: Адаптивные через `clamp()`

### Компоненты

#### Navigation
- Полупрозрачный фон с `backdrop-filter: blur(10px)`
- Градиентный логотип
- Sticky позиционирование
- Улучшенная мобильная версия

#### HeroSection
- Радиальный градиент фона
- Крупные заголовки с градиентом
- Округлые кнопки (40px border-radius)
- Убран блок "Сейчас в эфире"

#### NewsSection
- Карточки с border-radius 28px
- Дата публикации и кнопка "Читать далее"
- Hover эффект с фиолетовой подсветкой
- 3 новости на главной

#### EventsSection
- Аналогичный дизайн карточек
- Фиолетовые акценты
- Улучшенные статусы событий

#### StreamersSection
- Округлые карточки стримеров
- Градиентные placeholder аватары
- Hover эффект с подъемом

#### Footer
- Минималистичный дизайн
- Приглушенные цвета
- Адаптивная верстка

### Spacing
- Секции: `70px` padding (было `60px`)
- Карточки: `28px` padding (было `24px`)
- Gaps: `28px` (было `24px`)

### Border Radius
- Карточки: `28px` (было `12px`)
- Кнопки: `40px` (было не определено)
- Инпуты: `40px` для единообразия

### Shadows
- Hover карточек: `0 25px 35px -12px rgba(145, 71, 255, 0.3)`
- Кнопки: `0 8px 20px rgba(145, 71, 255, 0.4)`

### Анимации
- Transform на hover: `translateY(-6px)` (было `-2px`)
- Transition: `all 0.3s ease`
- Градиентная полоска сверху карточек

## Адаптивность
- Mobile First подход
- Breakpoint: `768px`
- Адаптивные размеры через `clamp()`
- Гибкие grid layouts

## Файлы изменены
- `frontend/app/globals.css` - полностью переписан
- `frontend/components/layout/Navigation.module.css` - новый дизайн
- `frontend/components/layout/Footer.module.css` - обновлен
- `frontend/components/home/HeroSection.tsx` - упрощен
- `frontend/components/home/HeroSection.module.css` - новый стиль
- `frontend/components/home/NewsSection.module.css` - обновлен
- `frontend/components/home/EventsSection.module.css` - обновлен
- `frontend/components/home/EventCard.module.css` - полностью переписан
- `frontend/components/home/StreamersSection.module.css` - новый дизайн

## Результат
Сайт теперь имеет современный, чистый и профессиональный вид с единым стилем всех компонентов.
