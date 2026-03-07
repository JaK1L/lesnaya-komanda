# Исправление ошибки 401 Unauthorized в админке

## Проблема
При попытке создать новость появляется ошибка:
```
POST https://lesnayakomanda.onrender.com/api/admin/news 401 (Unauthorized)
Error saving news: Failed to save
```

## Причина
Токен авторизации в localStorage истек или невалидный.

## Решение

### Вариант 1: Перелогиниться
1. Открой консоль браузера (F12)
2. Выполни команду:
```javascript
localStorage.removeItem('admin_token')
```
3. Обнови страницу
4. Зайди снова на https://lesnaya-komanda.vercel.app/admin
5. Введи логин: `LesnoyBOSS`
6. Введи пароль: `LesnoyBOSS909!`

### Вариант 2: Просто перезайти
1. Зайди на https://lesnaya-komanda.vercel.app/admin
2. Если не перебросило на форму логина, очисти localStorage (см. Вариант 1)
3. Введи логин и пароль

## Проверка
После входа попробуй создать новость - ошибка 401 должна исчезнуть.

## Дополнительно
Если проблема повторяется, возможно нужно увеличить время жизни токена в backend:
- Файл: `backend/.env`
- Параметр: `ACCESS_TOKEN_EXPIRE_MINUTES=30`
- Можно увеличить до 1440 (24 часа)
