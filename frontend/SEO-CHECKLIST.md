# SEO Checklist для Лесная Команда

## ✅ Выполнено

### Meta Tags
- [x] Title tags на всех страницах
- [x] Description tags
- [x] Keywords
- [x] Canonical URLs (автоматически Next.js)
- [x] Language (lang="ru")
- [x] Viewport (responsive)

### Open Graph
- [x] og:title
- [x] og:description
- [x] og:image (1200x630)
- [x] og:url
- [x] og:type
- [x] og:locale
- [x] og:site_name

### Twitter Cards
- [x] twitter:card
- [x] twitter:title
- [x] twitter:description
- [x] twitter:image
- [x] twitter:creator

### Structured Data (JSON-LD)
- [x] Organization schema
- [x] ContactPoint
- [x] SameAs (social links)

### Technical SEO
- [x] robots.txt
- [x] sitemap.xml (динамический)
- [x] manifest.json (PWA)
- [x] Favicon
- [x] Apple touch icon

### Performance
- [x] Image optimization (Next.js Image)
- [x] Code splitting
- [x] Lazy loading
- [x] Мемоизация

---

## 📋 TODO (Требует контента)

### Изображения
- [ ] Создать og-image.jpg (1200x630)
- [ ] Создать twitter-image.jpg (1200x675)
- [ ] Создать favicon.ico
- [ ] Создать apple-touch-icon.png (180x180)
- [ ] Создать android-chrome-192x192.png
- [ ] Создать android-chrome-512x512.png
- [ ] Создать logo.png

### Контент
- [ ] Обновить Discord URL в schema
- [ ] Обновить Telegram URL в schema
- [ ] Добавить Twitter handle
- [ ] Добавить Google verification code
- [ ] Добавить Yandex verification code

---

## 🎯 Рекомендации

### 1. Создайте изображения

**OG Image (1200x630):**
```
- Логотип Лесная Команда
- Слоган "Мы — своя стая"
- Зеленый акцент (#4aff75)
- Темный фон (#0a0a0a)
```

**Favicon (32x32):**
```
- Простой логотип
- Узнаваемый на маленьком размере
```

### 2. Настройте Google Search Console

1. Зарегистрируйтесь на https://search.google.com/search-console
2. Добавьте сайт
3. Получите verification code
4. Добавьте в `layout.tsx`:
```tsx
verification: {
  google: 'your-code-here',
}
```

### 3. Настройте Yandex Webmaster

1. Зарегистрируйтесь на https://webmaster.yandex.ru
2. Добавьте сайт
3. Получите verification code
4. Добавьте в `layout.tsx`

### 4. Проверьте SEO

**Инструменты:**
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Schema.org Validator](https://validator.schema.org/)

### 5. Мониторинг

**Google Analytics:**
```tsx
// app/layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
  strategy="afterInteractive"
/>
```

**Yandex Metrika:**
```tsx
<Script id="yandex-metrika">
  {`(function(m,e,t,r,i,k,a){...})`}
</Script>
```

---

## 📊 SEO Метрики

### Целевые показатели

**Google PageSpeed:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

**Core Web Vitals:**
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

### Текущие показатели

После деплоя проверьте:
```bash
# Lighthouse
npx lighthouse https://lesnaya-komanda.com --view

# Sitemap
curl https://lesnaya-komanda.com/sitemap.xml

# Robots
curl https://lesnaya-komanda.com/robots.txt
```

---

## 🔗 Полезные ссылки

- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google SEO Guide](https://developers.google.com/search/docs)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
