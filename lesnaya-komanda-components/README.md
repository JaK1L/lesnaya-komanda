# Лесная команда — Frontend компоненты

Компоненты сверстаны по дизайну из Figma под стек проекта:
**Next.js 14 + TypeScript + CSS Modules + Framer Motion**

---

## 📁 Структура файлов

```
components/
  Header/
    Header.tsx              ← Sticky header с навигацией и кнопками
    Header.module.css
  HeroSection/
    HeroSection.tsx         ← Hero с тэглайном, CTA и соц. кнопками
    HeroSection.module.css
  NewsSection/
    NewsSection.tsx         ← Горизонтальный скролл новостей
    NewsSection.module.css
  StreamersSection/
    StreamersSection.tsx    ← 3-колоночная сетка стримеров
    StreamersSection.module.css

styles/
  variables.css             ← CSS-переменные (цвета, типографика, отступы)

types/
  index.ts                  ← TypeScript интерфейсы

page.tsx                    ← Точка входа — Next.js страница
```

---

## 🚀 Интеграция в проект

### 1. Скопируй файлы
```
components/   → frontend/components/
styles/       → frontend/styles/
types/        → frontend/types/   (или слей с существующими)
page.tsx      → frontend/app/page.tsx
```

### 2. Подключи CSS переменные
В `frontend/app/globals.css` (или `layout.tsx`) добавь:
```css
@import '../styles/variables.css';
```

### 3. Убедись что шрифт Manrope подключён
В `frontend/app/layout.tsx`:
```tsx
import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-manrope',
  display: 'swap',
});
```

### 4. Подключи Framer Motion (уже есть в стеке ✅)
```bash
npm install framer-motion   # уже установлен
```

### 5. Замени placeholder данные на API
Компоненты принимают props:
- `<NewsSection articles={articles} />` — массив `NewsArticle[]`
- `<StreamersSection streamers={streamers} />` — массив `Streamer[]`

Пример получения данных:
```tsx
// app/page.tsx
async function getArticles(): Promise<NewsArticle[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/news`);
  return res.json();
}

export default async function HomePage() {
  const articles = await getArticles();
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <NewsSection articles={articles} />
        <StreamersSection />
      </main>
    </>
  );
}
```

### 6. Скачай иконки из Figma
В коде есть `figma.com/api/mcp/asset/...` ссылки — они живут **7 дней**.
Скачай их и положи в `/public/`:
```
public/
  images/
    logo.svg
    news/img1.jpg, img2.jpg ...
    streamers/streamer1.jpg ...
  icons/
    twitch.svg, telegram.svg, tiktok.svg, youtube.svg
    arrow-right.svg, arrow-forward.svg, arrow-back.svg
```

Потом замени `<img src={...}>` на `<Image src="/images/..." />` из `next/image`.

---

## 🎨 Цвета из дизайна

| Переменная              | Значение                    |
|-------------------------|-----------------------------|
| `--color-bg`            | `#1e1e1e`                   |
| `--color-purple`        | `#9147ff` (Twitch purple)   |
| `--color-red`           | `#ff4347`                   |
| `--color-white-64`      | `rgba(255,255,255,0.64)`    |
| `--color-white-10`      | `rgba(255,255,255,0.10)`    |

---

## ✅ Что уже готово

- [x] Header — sticky, blur, навигация, кнопки Регистрация / Войти
- [x] Hero Section — тэглайн, CTA кнопка, соц. иконки, glow эффект
- [x] News Section — горизонтальный скролл, карточки, теги, стрелки навигации
- [x] Streamers Section — сетка 3×2, hover эффекты, кнопка "Смотреть полностью"
- [x] Framer Motion анимации (fadeUp, stagger, whileInView)
- [x] CSS Variables — все токены из дизайна
- [x] TypeScript типы для всех данных
- [x] Props для подключения к API
- [x] Responsive layout

## 🔜 Что нужно доделать

- [ ] Скачать assets из Figma и положить в /public
- [ ] Заменить img → next/image
- [ ] Подключить реальные данные из FastAPI
- [ ] Добавить страницы /register и /login (дизайн есть в Figma: frame "Регистрация" и "Modal area")
