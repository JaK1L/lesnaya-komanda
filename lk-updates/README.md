# 🌲 Лесная Команда — Полный апдейт компонентов

Все задачи из списка выполнены. Ниже — что изменилось и как интегрировать.

---

## ✅ Что сделано

| Задача | Файл |
|--------|------|
| 🔴 Placeholder в секции стримеров | `StreamersSection.tsx` |
| 🔴 Placeholder в секции новостей  | `NewsSection.tsx` |
| 🔴 Соц. кнопки в Hero (SVG иконки Twitch/TG/TikTok/YT) | `HeroSection.tsx` |
| 🟡 Логотип через компонент Logo   | `Logo/Logo.tsx` |
| 🟡 Glow эффект в Hero             | `HeroSection.module.css` |
| 🟡 Страница /register по Figma    | `app/register/` |
| 🟡 Login модальное окно по Figma  | `LoginModal/` |
| 🟡 Кнопка "Войти" открывает модалку | `Header.tsx` |
| 🟡 `id` якоря на всех секциях    | `HeroSection`, `NewsSection`, `StreamersSection`, `Footer` |
| 🟢 OG-теги и SEO метаданные      | `app/page.tsx`, `app/layout.tsx` |
| 🟢 Расширенный Footer с соцсетями | `Footer/` |
| + | `globals.css` с CSS-переменными и scroll-offset |

---

## 🚀 Как интегрировать в проект

### 1. Скопируй файлы
```
app/globals.css           → frontend/app/globals.css  (замени существующий)
app/layout.tsx            → frontend/app/layout.tsx
app/page.tsx              → frontend/app/page.tsx
app/register/             → frontend/app/register/

components/Header/        → frontend/components/Header/
components/HeroSection/   → frontend/components/HeroSection/
components/NewsSection/   → frontend/components/NewsSection/
components/StreamersSection/ → frontend/components/StreamersSection/
components/LoginModal/    → frontend/components/LoginModal/
components/Footer/        → frontend/components/Footer/
components/Logo/          → frontend/components/Logo/
```

### 2. Логотип
Открой Figma → выдели слой "L-Komand" (node 18:232) → правая кнопка → Copy as SVG.
Вставь SVG код в `components/Logo/Logo.tsx` вместо текстового fallback.

### 3. Подключи данные (раскомментируй в page.tsx)
```tsx
async function getNews() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/news`, {
    next: { revalidate: 60 },
  });
  return res.json();
}
```

### 4. OG Image
Создай картинку `1200×630px` и положи в `frontend/public/og-image.png`.
Раскомментируй строки в `app/page.tsx`:
```tsx
images: [{ url: '/og-image.png', width: 1200, height: 630 }],
```

### 5. Ссылки соцсетей
Замени placeholder URL в:
- `components/HeroSection/HeroSection.tsx` → `SOCIAL_LINKS`
- `components/Footer/Footer.tsx` → `SOCIAL_LINKS`

### 6. Discord OAuth
Убедись что в `.env.local` есть:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Кнопки Discord ведут на `NEXT_PUBLIC_API_URL/api/auth/discord` — это твой FastAPI endpoint.

---

## 📁 Структура файлов

```
app/
  globals.css         ← CSS переменные + base styles
  layout.tsx          ← Manrope font + Footer
  page.tsx            ← Главная + SEO metadata
  register/
    page.tsx          ← Серверный wrapper
    RegisterPage.tsx  ← Клиентский компонент формы
    RegisterPage.module.css

components/
  Header/             ← Sticky header + открывает LoginModal
  HeroSection/        ← Hero с glow + соц. кнопками
  NewsSection/        ← Новости с placeholder fallback
  StreamersSection/   ← Стримеры с placeholder fallback
  LoginModal/         ← Модальное окно входа
  Footer/             ← Расширенный footer с соцсетями
  Logo/               ← SVG логотип компонент
```
