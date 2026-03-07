# 🤝 Руководство по участию в разработке

Спасибо за интерес к проекту "Лесная Команда"! Мы рады любому вкладу в развитие платформы.

## 📋 Содержание

1. [Кодекс поведения](#кодекс-поведения)
2. [Как начать](#как-начать)
3. [Процесс разработки](#процесс-разработки)
4. [Стандарты кода](#стандарты-кода)
5. [Тестирование](#тестирование)
6. [Коммиты и Pull Requests](#коммиты-и-pull-requests)
7. [Структура проекта](#структура-проекта)

---

## Кодекс поведения

### Наши ценности

- 🤝 Уважение к каждому участнику
- 💡 Открытость к новым идеям
- 🎯 Фокус на качестве кода
- 🌱 Помощь новичкам
- 🚀 Стремление к улучшению

### Недопустимо

- Оскорбления и личные нападки
- Троллинг и провокации
- Спам и реклама
- Публикация чужих данных без разрешения

---

## Как начать

### 1. Форк репозитория

```bash
# Нажать Fork на GitHub
# Клонировать свой форк
git clone https://github.com/YOUR_USERNAME/lesnaya-komanda.git
cd lesnaya-komanda

# Добавить upstream
git remote add upstream https://github.com/JaK1L/lesnaya-komanda.git
```

### 2. Установка зависимостей

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Bot
cd ../bot
pip install -r requirements.txt
```

### 3. Настройка окружения

```bash
# Скопировать примеры
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp bot/.env.example bot/.env

# Заполнить своими значениями
```

### 4. Запуск локально

```bash
# Frontend (терминал 1)
cd frontend
npm run dev
# http://localhost:3000

# Backend (терминал 2)
cd backend
python -m uvicorn app.main:app --reload
# http://localhost:8000

# Bot (терминал 3)
cd bot
python main.py
```

---

## Процесс разработки

### 1. Выбрать задачу

- Посмотреть [Issues](https://github.com/JaK1L/lesnaya-komanda/issues)
- Выбрать issue с меткой `good first issue` для начала
- Или предложить свою идею в новом issue

### 2. Создать ветку

```bash
# Обновить main
git checkout main
git pull upstream main

# Создать ветку
git checkout -b feature/amazing-feature
# или
git checkout -b fix/bug-description
```

Именование веток:
- `feature/` - новая функциональность
- `fix/` - исправление бага
- `docs/` - документация
- `refactor/` - рефакторинг
- `test/` - тесты
- `style/` - стили и форматирование

### 3. Разработка

```bash
# Делать коммиты часто
git add .
git commit -m "feat: add user profile page"

# Следовать Conventional Commits (см. ниже)
```

### 4. Тестирование

```bash
# Frontend тесты
cd frontend
npm test
npm run type-check
npm run lint

# Backend тесты (если есть)
cd backend
pytest
```

### 5. Push и Pull Request

```bash
# Push в свой форк
git push origin feature/amazing-feature

# Создать Pull Request на GitHub
# Заполнить описание по шаблону
```

---

## Стандарты кода

### TypeScript / JavaScript

**Стиль:**
```typescript
// ✅ Хорошо
export function calculateRating(user: User): number {
  const baseRating = user.wins * 10
  const bonus = user.achievements.length * 5
  return baseRating + bonus
}

// ❌ Плохо
export function calc(u: any) {
  return u.wins*10+u.achievements.length*5
}
```

**Правила:**
- TypeScript strict mode
- Явные типы для функций
- Избегать `any`
- Использовать `const` вместо `let` где возможно
- Деструктуризация объектов
- Arrow functions для коротких функций

**Компоненты React:**
```typescript
// ✅ Хорошо
interface ProfileCardProps {
  user: User
  onEdit?: () => void
}

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  return (
    <div className={styles.card}>
      <h2>{user.username}</h2>
      {onEdit && <button onClick={onEdit}>Редактировать</button>}
    </div>
  )
}

// ❌ Плохо
export function ProfileCard(props: any) {
  return <div><h2>{props.user.username}</h2></div>
}
```

### Python

**Стиль:**
```python
# ✅ Хорошо
async def get_user_stats(user_id: int) -> UserStats:
    """Получить статистику пользователя."""
    async with get_db() as db:
        result = await db.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            user_id
        )
        return UserStats(**result)

# ❌ Плохо
async def get_stats(id):
    db = get_db()
    return await db.fetchrow(f"SELECT * FROM users WHERE id = {id}")
```

**Правила:**
- PEP 8 стиль
- Type hints везде
- Docstrings для функций
- Async/await для I/O операций
- Параметризованные SQL запросы (защита от SQL injection)

### CSS

**Стиль:**
```css
/* ✅ Хорошо */
.profileCard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.profileCard__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* ❌ Плохо */
.card {
  display: flex;
  padding: 24px;
  background: #1a1a1a;
}
.card h2 {
  font-size: 24px;
}
```

**Правила:**
- CSS Modules для компонентов
- BEM naming для классов
- CSS переменные для цветов и размеров
- Mobile-first подход
- Избегать `!important`

### Форматирование

**Frontend:**
```bash
# Prettier настроен автоматически
npm run format

# ESLint
npm run lint
npm run lint:fix
```

**Backend:**
```bash
# Black для форматирования
black .

# isort для импортов
isort .

# flake8 для линтинга
flake8 .
```

---

## Тестирование

### Frontend тесты

**Unit тесты (Jest + React Testing Library):**
```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Запуск:**
```bash
npm test                 # Все тесты
npm test Button          # Конкретный файл
npm test -- --coverage   # С покрытием
```

### Backend тесты

**Unit тесты (pytest):**
```python
# test_user_service.py
import pytest
from app.services.user_service import UserService

@pytest.mark.asyncio
async def test_get_user_by_id():
    service = UserService()
    user = await service.get_user(1)
    assert user is not None
    assert user.id == 1

@pytest.mark.asyncio
async def test_get_nonexistent_user():
    service = UserService()
    user = await service.get_user(99999)
    assert user is None
```

**Запуск:**
```bash
pytest                    # Все тесты
pytest test_user_service  # Конкретный файл
pytest --cov              # С покрытием
```

### Требования к покрытию

- Новый код: минимум 80% покрытия
- Критичные функции: 100% покрытия
- UI компоненты: основные сценарии

---

## Коммиты и Pull Requests

### Conventional Commits

Формат: `<type>(<scope>): <description>`

**Types:**
- `feat` - новая функциональность
- `fix` - исправление бага
- `docs` - документация
- `style` - форматирование, стили
- `refactor` - рефакторинг кода
- `test` - добавление тестов
- `chore` - обновление зависимостей, конфигурация

**Примеры:**
```bash
feat(profile): add user avatar upload
fix(auth): resolve Discord OAuth redirect issue
docs(readme): update installation instructions
style(button): improve hover animation
refactor(api): extract user service logic
test(profile): add profile page tests
chore(deps): update Next.js to 14.1.0
```

**Scope (опционально):**
- `frontend` / `backend` / `bot`
- `profile` / `auth` / `api`
- Название компонента

### Pull Request

**Шаблон:**
```markdown
## Описание
Краткое описание изменений

## Тип изменений
- [ ] Новая функциональность
- [ ] Исправление бага
- [ ] Документация
- [ ] Рефакторинг

## Чеклист
- [ ] Код следует стандартам проекта
- [ ] Добавлены/обновлены тесты
- [ ] Все тесты проходят
- [ ] Обновлена документация
- [ ] Проверено на мобильных устройствах (для UI)

## Скриншоты (если применимо)
Добавить скриншоты для UI изменений

## Связанные issues
Closes #123
```

**Процесс ревью:**
1. Автоматические проверки (CI/CD)
2. Code review от мейнтейнеров
3. Исправление замечаний
4. Merge в main

---

## Структура проекта

### Frontend

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Главная страница
│   ├── layout.tsx         # Общий layout
│   ├── profile/           # Страница профиля
│   ├── social/            # Соцсети
│   └── streams/           # Стримы
│
├── components/            # React компоненты
│   ├── ui/               # UI компоненты (Button, Card)
│   ├── layout/           # Layout компоненты (Header, Footer)
│   ├── profile/          # Компоненты профиля
│   └── home/             # Компоненты главной
│
├── lib/                  # Утилиты
│   ├── api.ts           # API клиент
│   └── utils.ts         # Вспомогательные функции
│
├── hooks/               # Custom React hooks
│   └── useAuth.ts
│
└── styles/              # Глобальные стили
    └── globals.css
```

### Backend

```
backend/
├── app/
│   ├── main.py          # FastAPI приложение
│   ├── config.py        # Конфигурация
│   ├── database.py      # Подключение к БД
│   │
│   ├── routes/          # API эндпоинты
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── stats.py
│   │
│   ├── services/        # Бизнес-логика
│   │   ├── user_service.py
│   │   └── stats_service.py
│   │
│   ├── models/          # Pydantic модели
│   │   └── user.py
│   │
│   └── schemas.py       # Схемы данных
│
└── tests/               # Тесты
    └── test_users.py
```

### Bot

```
bot/
├── main.py              # Основной файл бота
├── cogs/                # Модули команд
│   └── website.py       # Команды для сайта
└── utils/               # Утилиты
    └── database.py
```

---

## Типичные задачи

### Добавить новую страницу

```bash
# 1. Создать файл страницы
frontend/app/new-page/page.tsx

# 2. Создать компоненты
frontend/components/new-page/Component.tsx
frontend/components/new-page/Component.module.css

# 3. Добавить в навигацию
frontend/components/layout/Navigation.tsx

# 4. Добавить тесты
frontend/components/new-page/Component.test.tsx

# 5. Обновить документацию
```

### Добавить API эндпоинт

```bash
# 1. Создать route
backend/app/routes/new_endpoint.py

# 2. Создать service
backend/app/services/new_service.py

# 3. Добавить модели
backend/app/models/new_model.py

# 4. Зарегистрировать в main.py
backend/app/main.py

# 5. Добавить тесты
backend/tests/test_new_endpoint.py

# 6. Обновить Swagger docs
```

### Добавить команду бота

```bash
# 1. Добавить в cog
bot/cogs/website.py

# 2. Обновить документацию
bot/BOT-COMMANDS.md

# 3. Протестировать в Discord
```

---

## Полезные ресурсы

### Документация

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [FastAPI](https://fastapi.tiangolo.com)
- [Discord.py](https://discordpy.readthedocs.io)
- [PostgreSQL](https://www.postgresql.org/docs/)

### Инструменты

- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Regex101](https://regex101.com)
- [Can I Use](https://caniuse.com)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Сообщество

- [Discord сервер](https://discord.gg/YgX4RQZ)
- [GitHub Discussions](https://github.com/JaK1L/lesnaya-komanda/discussions)

---

## Вопросы?

Если что-то непонятно:
1. Проверить [README.md](./README.md)
2. Посмотреть [Issues](https://github.com/JaK1L/lesnaya-komanda/issues)
3. Спросить в [Discord](https://discord.gg/YgX4RQZ)
4. Создать новый Issue с вопросом

---

**Спасибо за вклад в проект! 🌲**

*Последнее обновление: 07.03.2026*

