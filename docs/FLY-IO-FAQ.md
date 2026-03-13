# FAQ: Fly.io для Lesnaya Komanda

## Общие вопросы

### Что такое Fly.io?

Fly.io - это платформа для деплоя приложений, которая запускает ваш код в контейнерах по всему миру. Похоже на Heroku, но современнее и дешевле.

### Почему Fly.io, а не Render/Railway/Heroku?

- ✅ Бесплатный tier достаточен для старта
- ✅ Быстрее, чем Render (нет cold starts)
- ✅ Дешевле, чем Railway для production
- ✅ Больше контроля, чем Heroku
- ✅ Отличная документация и поддержка
- ✅ Регионы близко к России/Европе (Amsterdam, Frankfurt, Warsaw)

### Сколько это стоит?

**Бесплатный tier:**
- 3 shared-cpu-1x VMs (256MB RAM)
- 3GB persistent storage
- 160GB outbound data transfer

**Для нашего проекта (~$5-10/месяц):**
- 1-2 машины с 512MB-1GB RAM
- Postgres база (включена в бесплатный tier или ~$2/месяц)
- Достаточно для 1000+ пользователей

## Настройка и деплой

### Как начать?

1. Установите Fly CLI
2. Авторизуйтесь: `fly auth login`
3. Запустите: `.\deploy-fly.ps1 -Action setup` (Windows) или `./deploy-fly.sh --setup` (Linux/macOS)
4. Установите секреты
5. Деплой: `.\deploy-fly.ps1 -Action deploy`

Подробнее: [FLY-QUICKSTART.md](../FLY-QUICKSTART.md)

### Нужна ли кредитная карта?

Для бесплатного tier - нет. Но для production рекомендуется добавить карту, чтобы избежать лимитов.

### Как установить секреты?

```bash
# По одному
fly secrets set SECRET_KEY="your-secret-key"

# Несколько сразу
fly secrets set KEY1="value1" KEY2="value2"

# Из файла
fly secrets import < fly-secrets.txt
```

### Где взять SECRET_KEY?

Сгенерируйте:
```bash
python generate-secret-key.py
```

Или:
```bash
openssl rand -base64 48
```

### Как настроить Discord OAuth?

1. Перейдите в [Discord Developer Portal](https://discord.com/developers/applications)
2. Создайте приложение или откройте существующее
3. OAuth2 → Redirects → Добавьте: `https://lesnaya-komanda-backend.fly.dev/api/auth/discord/callback`
4. Скопируйте Client ID и Client Secret
5. Установите секреты:
```bash
fly secrets set DISCORD_CLIENT_ID="..."
fly secrets set DISCORD_CLIENT_SECRET="..."
```

## База данных

### Какую базу данных использовать?

**Вариант 1: Fly Postgres (рекомендуется для начала)**
```bash
fly postgres create --name lesnaya-komanda-db --region ams
fly postgres attach lesnaya-komanda-db --app lesnaya-komanda-backend
```

**Вариант 2: Neon (если уже используете)**
```bash
fly secrets set DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### Как подключиться к базе?

```bash
# Через Fly CLI
fly postgres connect -a lesnaya-komanda-db

# Или получить connection string
fly postgres db show lesnaya-komanda-db
```

### Как сделать бэкап базы?

```bash
# Создать бэкап
fly postgres backup create -a lesnaya-komanda-db

# Список бэкапов
fly postgres backup list -a lesnaya-komanda-db
```

## Мониторинг и отладка

### Как посмотреть логи?

```bash
# В реальном времени
fly logs

# За последний час
fly logs --since 1h

# Или через скрипт
.\deploy-fly.ps1 -Action logs  # Windows
./deploy-fly.sh --logs         # Linux/macOS
```

### Приложение не запускается, что делать?

1. Проверьте логи: `fly logs`
2. Проверьте health checks: `fly checks list`
3. Проверьте статус: `fly status`
4. Проверьте секреты: `fly secrets list`
5. Подключитесь к контейнеру: `fly ssh console`

### Как проверить, что все работает?

```bash
# Health check
curl https://lesnaya-komanda-backend.fly.dev/health

# Database check
curl https://lesnaya-komanda-backend.fly.dev/health/db

# API docs
open https://lesnaya-komanda-backend.fly.dev/api/docs
```

### CORS ошибки, что делать?

Проверьте ALLOWED_ORIGINS:
```bash
fly secrets list
fly secrets set ALLOWED_ORIGINS="https://ваш-фронтенд.vercel.app,https://другой-домен.com"
```

## Обновление и масштабирование

### Как обновить приложение?

```bash
# Просто запустите деплой снова
fly deploy

# Или через скрипт
.\deploy-fly.ps1 -Action deploy  # Windows
./deploy-fly.sh --deploy         # Linux/macOS
```

### Как откатиться к предыдущей версии?

```bash
# Посмотреть историю
fly releases

# Откатиться
fly releases rollback
```

### Как увеличить память/CPU?

```bash
# Увеличить память до 1GB
fly scale memory 1024

# Изменить тип CPU
fly scale vm shared-cpu-2x

# Добавить больше машин
fly scale count 2
```

### Как добавить регионы?

```bash
# Добавить Frankfurt
fly regions add fra

# Добавить Warsaw
fly regions add waw

# Посмотреть текущие регионы
fly regions list
```

## Автоматизация

### Как настроить автоматический деплой?

1. Получите API токен: `fly auth token`
2. Добавьте в GitHub Secrets как `FLY_API_TOKEN`
3. Workflow уже настроен в `.github/workflows/deploy-fly.yml`
4. При push в main ветку будет автоматический деплой

### Можно ли деплоить из CI/CD?

Да! Используйте GitHub Actions (уже настроено) или другие CI/CD:

```yaml
- name: Deploy to Fly.io
  run: flyctl deploy --remote-only
  env:
    FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

## Custom Domain

### Как добавить свой домен?

```bash
# Добавить домен
fly certs add api.lesnaya-komanda.com

# Fly.io покажет DNS записи для настройки
# Добавьте их в вашем DNS провайдере

# Проверить статус сертификата
fly certs show api.lesnaya-komanda.com
```

### Какие DNS записи нужны?

Fly.io покажет после `fly certs add`, обычно:
```
CNAME api.lesnaya-komanda.com -> lesnaya-komanda-backend.fly.dev
```

## Стоимость и оптимизация

### Как снизить расходы?

1. Используйте `auto_stop_machines = true` для dev окружения
2. Используйте shared CPU вместо dedicated
3. Оптимизируйте размер Docker образа
4. Используйте один регион вместо нескольких
5. Настройте правильные health checks (не слишком частые)

### Как посмотреть текущие расходы?

Dashboard → Billing: https://fly.io/dashboard/personal/billing

### Что входит в бесплатный tier?

- 3 shared-cpu-1x VMs (256MB RAM каждая)
- 3GB persistent storage (для Postgres)
- 160GB outbound data transfer
- Unlimited inbound data transfer

## Безопасность

### Как защитить секреты?

- ✅ Используйте `fly secrets set` (не храните в коде)
- ✅ Не коммитьте `fly-secrets.txt` в git
- ✅ Используйте сильные пароли (минимум 8 символов)
- ✅ Регулярно меняйте SECRET_KEY

### Как ограничить доступ к админ-панели?

В коде уже есть JWT аутентификация. Дополнительно можно:
- Использовать IP whitelist в Fly.io
- Добавить 2FA для админов
- Использовать VPN

### Нужен ли HTTPS?

Fly.io автоматически предоставляет HTTPS для всех приложений. Настроено в `fly.toml`:
```toml
force_https = true
```

## Troubleshooting

### Ошибка "failed to fetch an image or build from source"

Проверьте:
1. Dockerfile.backend существует
2. backend/app существует
3. requirements.txt существует
4. Нет синтаксических ошибок в Dockerfile

### Ошибка "database unavailable"

Проверьте:
1. База данных создана: `fly postgres list`
2. База подключена: `fly postgres attach`
3. DATABASE_URL установлен: `fly secrets list`
4. База запущена: `fly status -a lesnaya-komanda-db`

### Ошибка "health check failed"

Проверьте:
1. Приложение запустилось: `fly logs`
2. Порт правильный (8000): `fly.toml`
3. Health endpoints работают: `/health` и `/health/db`

### Приложение медленно отвечает

1. Увеличьте память: `fly scale memory 1024`
2. Добавьте больше машин: `fly scale count 2`
3. Добавьте регионы ближе к пользователям
4. Оптимизируйте запросы к БД

## Полезные ссылки

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Community](https://community.fly.io/)
- [Fly.io Status](https://status.flyio.net/)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Fly.io Postgres](https://fly.io/docs/postgres/)
- [Fly.io Dashboard](https://fly.io/dashboard)

## Контакты поддержки

- Community Forum: https://community.fly.io/
- Twitter: @flydotio
- Email: support@fly.io (для платных аккаунтов)
