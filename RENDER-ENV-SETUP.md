# Настройка переменных окружения на Render

## Проблема
CORS ошибка при обращении с Vercel к Render API.

## Решение
Нужно добавить переменные окружения на Render.

### Шаги:

1. Зайти на https://dashboard.render.com
2. Выбрать сервис `lesnayakomanda` (backend)
3. Перейти в **Environment**
4. Добавить/обновить следующие переменные:

```
ALLOWED_ORIGINS=http://localhost:3000,https://lesnaya-komanda.vercel.app
FRONTEND_URL=https://lesnaya-komanda.vercel.app
BACKEND_URL=https://lesnayakomanda.onrender.com
DATABASE_URL=postgresql://neondb_owner:npg_PRJbuN0f4Yyc@ep-purple-boat-agxuy7jr-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SECRET_KEY=your-super-secret-key-change-this-in-production
DISCORD_CLIENT_ID=1329022035062079540
DISCORD_CLIENT_SECRET=Gt6g_0gQ13R-7Y7FZp0k2Xo8aZFQ7U8B
ADMIN_USERNAME=LesnoyBOSS
ADMIN_PASSWORD=LesnoyBOSS909!
DEBUG=False
```

5. Нажать **Save Changes**
6. Render автоматически перезапустит сервис

### Проверка

После перезапуска проверить:
- https://lesnayakomanda.onrender.com/api/docs - должна открыться документация API
- CORS ошибки должны исчезнуть

### Важно

- `ALLOWED_ORIGINS` должен содержать домен Vercel
- `DEBUG=False` для production
- Все секретные ключи должны быть уникальными и сложными
