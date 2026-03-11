# План применения нового дизайна из lesnaya-komanda-components

## Что нужно сделать:

### 1. ✅ CSS переменные
- [x] Обновлены в `frontend/app/globals.css`
- [x] Добавлены все токены из `variables.css`

### 2. Header/Navigation
- [ ] Обновить `frontend/components/layout/Navigation.tsx`
- [ ] Обновить `frontend/components/layout/Navigation.module.css`
- [ ] Применить дизайн из `lesnaya-komanda-components/components/Header/`

### 3. HeroSection
- [ ] Обновить `frontend/components/home/HeroSection.tsx`
- [ ] Обновить `frontend/components/home/HeroSection.module.css`
- [ ] Применить дизайн из `lesnaya-komanda-components/components/HeroSection/`

### 4. NewsSection
- [ ] Обновить `frontend/components/home/NewsSection.tsx`
- [ ] Обновить `frontend/components/home/NewsSection.module.css`
- [ ] Применить дизайн из `lesnaya-komanda-components/components/NewsSection/`

### 5. StreamersSection
- [ ] Обновить `frontend/components/home/StreamersSection.tsx`
- [ ] Обновить `frontend/components/home/StreamersSection.module.css`
- [ ] Применить дизайн из `lesnaya-komanda-components/components/StreamersSection/`

## Ключевые изменения:

### Navigation
- Sticky header с backdrop-filter: blur(25px)
- Высота 74px
- Padding: 0 132px
- Кнопки: Регистрация (фиолетовая) + Войти (прозрачная)

### HeroSection
- Min-height: 600px
- Заголовок: 60px, font-weight: 500
- Подзаголовок: 20px, max-width: 501px
- Кнопка "Вступить в лес": min-width 240px, font-size 20px
- Социальные кнопки: 48x48px, gap 16px
- Glow эффект внизу

### NewsSection
- Заголовок: "Новости" + подзаголовок "Отборные новости для наших последователей"
- Горизонтальный скролл
- Карточки: 426px ширина, padding 20px
- Изображение: 200px высота
- Теги внизу карточек
- Fade эффект справа
- Кнопки навигации: 48x48px, left: -60px, right: 0

### StreamersSection
- Grid: 3 колонки по 376px
- Карточки: height 380px, padding 20px
- Изображение: 200px высота
- Hover эффект: background rgba(255,255,255,0.06)
- Кнопка "Смотреть полностью" внизу

## Responsive breakpoints:
- Desktop: 1100px+
- Tablet: 768px - 1100px
- Mobile: < 768px
