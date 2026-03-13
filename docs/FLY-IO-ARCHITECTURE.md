# Архитектура на Fly.io

## Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                         Пользователи                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js 14 App                                       │  │
│  │  - React Components                                   │  │
│  │  - Server Components                                  │  │
│  │  - API Routes (если нужны)                           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │ NEXT_PUBLIC_API_URL
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Fly.io (Backend - Amsterdam)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FastAPI Application                                  │  │
│  │  - REST API Endpoints                                 │  │
│  │  - WebSocket (Discord status)                        │  │
│  │  - JWT Authentication                                 │  │
│  │  - Discord OAuth                                      │  │
│  │  - Admin Panel                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         │ DATABASE_URL                       │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                  │  │
│  │  - Users, Profiles                                    │  │
│  │  - Achievements, Events                               │  │
│  │  - News, Feed                                         │  │
│  │  - Game Accounts                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ External APIs
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Discord    │  │    Twitch    │  │   Telegram   │     │
│  │     API      │  │     API      │  │     Bot      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Steam      │  │  Tracker.gg  │  │  Henrik API  │     │
│  │     API      │  │     API      │  │  (Valorant)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Компоненты

### Frontend (Vercel)
- **Платформа**: Vercel
- **Технологии**: Next.js 14, TypeScript, React
- **Регионы**: Global CDN
- **Стоимость**: Бесплатный tier (Hobby)

### Backend (Fly.io)
- **Платформа**: Fly.io
- **Технологии**: FastAPI, Python 3.12
- **Регион**: Amsterdam (ams)
- **Ресурсы**: 512MB RAM, 1 vCPU (shared)
- **Стоимость**: ~$5-10/месяц

### База данных
- **Вариант 1**: Fly Postgres (рекомендуется)
  - Регион: Amsterdam (ams)
  - Стоимость: Включена в бесплатный tier или ~$2/месяц
  
- **Вариант 2**: Neon (если уже используете)
  - Serverless PostgreSQL
  - Стоимость: Бесплатный tier или ~$5/месяц

### Кэширование (опционально)
- **Redis**: Upstash Redis (бесплатный tier)
- **Использование**: Кэширование API запросов, сессии

## Поток данных

### 1. Загрузка страницы
```
Пользователь → Vercel CDN → Next.js SSR → Fly.io API → PostgreSQL
```

### 2. API запрос
```
Frontend → HTTPS → Fly.io Load Balancer → FastAPI → PostgreSQL
```

### 3. WebSocket (Discord status)
```
Frontend ←→ WebSocket ←→ Fly.io ←→ Discord API
```

### 4. Discord OAuth
```
Пользователь → Discord → Callback → Fly.io → JWT Token → Frontend
```

## Безопасность

### HTTPS/SSL
- ✅ Vercel: Автоматический SSL
- ✅ Fly.io: Автоматический SSL (Let's Encrypt)
- ✅ Force HTTPS: Включено в fly.toml

### Аутентификация
- ✅ JWT токены (HS256)
- ✅ Discord OAuth 2.0
- ✅ Secure cookies (httpOnly, secure, sameSite)

### CORS
- ✅ Настроен в FastAPI
- ✅ Whitelist доменов в ALLOWED_ORIGINS
- ✅ Credentials: true

### Секреты
- ✅ Хранятся в Fly.io Secrets (зашифрованы)
- ✅ Не коммитятся в git
- ✅ Доступны только в runtime

## Масштабирование

### Вертикальное (больше ресурсов)
```bash
# Увеличить память
fly scale memory 1024

# Изменить тип CPU
fly scale vm shared-cpu-2x
```

### Горизонтальное (больше машин)
```bash
# Добавить машины
fly scale count 2

# Добавить регионы
fly regions add fra  # Frankfurt
fly regions add waw  # Warsaw
```

### Автоскейлинг
```toml
[http_service.concurrency]
  type = "connections"
  hard_limit = 250
  soft_limit = 200  # Начинает масштабирование
```

## Мониторинг

### Health Checks
- `/health` - Проверка приложения (каждые 30 сек)
- `/health/db` - Проверка базы данных (каждые 60 сек)

### Логи
```bash
fly logs                    # Все логи
fly logs --since 1h        # За последний час
fly logs -a app-name       # Конкретное приложение
```

### Метрики
- Fly.io Dashboard: CPU, Memory, Network
- Custom metrics: Можно добавить Prometheus/Grafana

### Алерты
- Fly.io: Встроенные алерты на health checks
- External: UptimeRobot, Pingdom, Better Uptime

## Бэкапы

### База данных
```bash
# Автоматические бэкапы (Fly Postgres)
fly postgres backup create -a lesnaya-komanda-db

# Список бэкапов
fly postgres backup list -a lesnaya-komanda-db

# Восстановление
fly postgres backup restore -a lesnaya-komanda-db
```

### Код
- Git repository (GitHub)
- Автоматический деплой через GitHub Actions

## Стоимость (примерная)

### Минимальная конфигурация (бесплатно)
- Frontend (Vercel): $0
- Backend (Fly.io): $0 (бесплатный tier)
- Database (Fly Postgres): $0 (бесплатный tier)
- **Итого: $0/месяц**

### Рекомендуемая конфигурация
- Frontend (Vercel): $0 (Hobby tier)
- Backend (Fly.io): $5-7 (512MB RAM, 1 машина)
- Database (Fly Postgres): $2-3
- Redis (Upstash): $0 (бесплатный tier)
- **Итого: ~$7-10/месяц**

### Production конфигурация
- Frontend (Vercel): $20 (Pro tier)
- Backend (Fly.io): $15-20 (1GB RAM, 2 машины, 2 региона)
- Database (Neon): $10 (Scale tier)
- Redis (Upstash): $5
- Monitoring (Better Uptime): $10
- **Итого: ~$60-65/месяц**

## Производительность

### Latency (от пользователя до API)
- Россия/Европа → Amsterdam: ~30-50ms
- США → Amsterdam: ~100-150ms
- Азия → Amsterdam: ~200-300ms

### Throughput
- 1 машина (512MB): ~100-200 req/sec
- 2 машины (1GB): ~400-600 req/sec
- С кэшированием: 2-5x улучшение

### Database
- Fly Postgres: ~1000 connections
- Neon: Serverless, автоскейлинг

## Disaster Recovery

### RTO (Recovery Time Objective)
- Откат к предыдущей версии: ~1-2 минуты
- Восстановление из бэкапа: ~5-10 минут
- Полное восстановление: ~15-30 минут

### RPO (Recovery Point Objective)
- Fly Postgres: Бэкапы каждые 24 часа
- Neon: Point-in-time recovery (до 7 дней)

### План восстановления
1. Проверить статус: `fly status`
2. Проверить логи: `fly logs`
3. Откатиться: `fly releases rollback`
4. Восстановить БД: `fly postgres backup restore`
5. Проверить health checks

## Дополнительные возможности

### Custom Domain
```bash
fly certs add api.lesnaya-komanda.com
```

### Multiple Environments
- Production: `lesnaya-komanda-backend`
- Staging: `lesnaya-komanda-backend-staging`
- Development: Локально

### CI/CD
- GitHub Actions (уже настроено)
- Автоматический деплой при push в main
- Тесты перед деплоем (можно добавить)

### Observability
- Логи: Fly.io встроенные
- Метрики: Fly.io Dashboard
- Трейсинг: Можно добавить Sentry
- APM: Можно добавить New Relic/Datadog
