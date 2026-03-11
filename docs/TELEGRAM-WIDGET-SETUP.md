# Интеграция Telegram Widget на главной странице

## Что сделано

Добавлен виджет Telegram на главную страницу сайта, который показывает последний пост из канала.

## Как работает

Используется официальный Telegram Widget API, который автоматически встраивает последний пост из канала.

### Компоненты:
- `frontend/components/home/HeroSection.tsx` - добавлен виджет
- `frontend/components/home/HeroSection.module.css` - стили для виджета

## Настройка

### 1. Найти ID последнего поста

Чтобы виджет показывал последний пост, нужно указать ID поста в формате `канал/ID`:

1. Открой свой Telegram канал в браузере: `https://t.me/lesnayakomanda`
2. Открой последний пост
3. Скопируй ID из URL (например, если URL `https://t.me/lesnayakomanda/123`, то ID = `123`)

### 2. Обновить код

В файле `frontend/components/home/HeroSection.tsx` найди строку:

```tsx
script.setAttribute('data-telegram-post', 'lesnayakomanda/1')
```

Замени на:

```tsx
script.setAttribute('data-telegram-post', 'lesnayakomanda/ТВОЙ_ID_ПОСТА')
```

Например:
```tsx
script.setAttribute('data-telegram-post', 'lesnayakomanda/123')
```

### 3. Автоматическое обновление

Виджет автоматически показывает последний пост, если указать ID любого поста из канала. Telegram сам подтянет последний.

Альтернативно, можно использовать специальный формат для автоматического показа последнего поста:

```tsx
script.setAttribute('data-telegram-post', 'lesnayakomanda')
```

Без указания ID - покажет последний пост автоматически.

## Параметры виджета

Текущие настройки:

```tsx
script.setAttribute('data-telegram-post', 'lesnayakomanda/1')  // Канал и ID поста
script.setAttribute('data-width', '100%')                       // Ширина 100%
script.setAttribute('data-userpic', 'false')                    // Без аватара
script.setAttribute('data-dark', '1')                           // Темная тема
```

### Доступные параметры:

- `data-telegram-post` - канал/ID поста (обязательно)
- `data-width` - ширина виджета (px или %)
- `data-userpic` - показывать аватар автора (`true`/`false`)
- `data-dark` - темная тема (`1` - да, `0` - нет)
- `data-color` - цвет акцента (hex без #)

## Дизайн

- Виджет размещен справа от текста на главной
- Адаптивный дизайн - на мобильных под текстом
- Темная тема соответствует стилю сайта
- Полупрозрачный фон с границей

## Пример использования

### Показать конкретный пост:
```tsx
script.setAttribute('data-telegram-post', 'lesnayakomanda/456')
```

### Показать последний пост автоматически:
```tsx
script.setAttribute('data-telegram-post', 'lesnayakomanda')
```

### С аватаром и светлой темой:
```tsx
script.setAttribute('data-userpic', 'true')
script.setAttribute('data-dark', '0')
```

## Требования

- Канал должен быть публичным
- Пост должен быть опубликован (не черновик)
- Канал должен иметь username (например, @lesnayakomanda)

## Troubleshooting

**Виджет не загружается:**
- Проверь что канал публичный
- Проверь правильность username канала
- Проверь что ID поста существует

**Показывает старый пост:**
- Обнови ID поста на более свежий
- Или убери ID совсем для автоматического показа последнего

**Виджет слишком большой/маленький:**
- Измени `data-width` параметр
- Настрой CSS в `.telegramWidget` классе

## Официальная документация

https://core.telegram.org/widgets/post
