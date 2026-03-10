# План редизайна по HTML макету

## Что нужно переделать:

### 1. Globals.css ✅
- Шрифт Manrope
- Новые CSS переменные
- Фон #1e1e1e

### 2. Navigation
- Sticky header с backdrop-filter
- Новые пункты меню: "Наша команда", "Стримы", "О нас", "Соц. сети", "Магазин"
- Кнопки "Регистрация" (фиолетовая) и "Войти" (прозрачная)
- Высота 74px, padding 0 132px

### 3. Hero Section
- Большой заголовок "Мы прокладываем миллион и тысячу новых путей"
- Подзаголовок
- Кнопка "Вступить в лес" со стрелкой
- Социальные кнопки (Twitch, Telegram, TikTok, YouTube)
- Фиолетовое свечение внизу

### 4. News Section
- Горизонтальный скролл
- Карточки 426px ширина
- Теги разных цветов (белый, красный, фиолетовый)
- Кнопки навигации слева/справа
- Fade эффект справа

### 5. Streamers Section
- Grid 3 колонки по 376px
- Карточки высотой 380px
- Кнопка "Смотреть полностью" внизу

### 6. Footer
- Минималистичный
- Логотип слева, копирайт справа
- Высота меньше

## Компоненты для обновления:
- [x] globals.css
- [ ] Navigation.tsx + Navigation.module.css
- [ ] HeroSection.tsx + HeroSection.module.css
- [ ] NewsSection.tsx + NewsSection.module.css
- [ ] StreamersSection.tsx + StreamersSection.module.css
- [ ] Footer.tsx + Footer.module.css
