# Implementation Plan: Discord Activity Cards

## Overview

Реализация системы карточек активности Discord с расширенными данными присутствия (роли, иконки игр, временные метки). Включает расширение схемы БД, обновление Discord бота для сбора полных данных, расширение API и WebSocket протокола, создание React компонентов карточек с Discord-подобным дизайном и адаптивной сеткой.

## Tasks

- [x] 1. Расширить схему базы данных для хранения расширенных данных присутствия
  - Добавить миграцию для новых колонок: roles (JSONB), activity_started_at (TIMESTAMP), game_icon_url (TEXT)
  - Создать индексы для оптимизации запросов по activity_started_at
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 Написать property test для round-trip сохранения данных присутствия
  - **Property 1: Presence data persistence round-trip**
  - **Validates: Requirements 1.5, 1.6**

- [x] 2. Обновить Discord бота для сбора расширенных данных присутствия
  - [x] 2.1 Расширить функцию upsert_presence для сбора ролей пользователя
    - Собирать все роли (исключая @everyone)
    - Извлекать название и цвет каждой роли в hex формате
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Добавить сбор временных меток активности
    - Извлекать timestamp начала активности из объекта Activity
    - Сохранять в поле activity_started_at
    - _Requirements: 2.3_
  
  - [x] 2.3 Добавить сбор URL иконок игр
    - Проверять наличие large_image_url и small_image_url в Rich Presence
    - Сохранять URL иконки в поле game_icon_url
    - _Requirements: 2.5_
  
  - [x] 2.4 Обновить SQL запрос для сохранения всех новых полей
    - Добавить roles, activity_started_at, game_icon_url в INSERT/UPDATE
    - Сериализовать roles в JSON формат
    - _Requirements: 2.6_

- [ ]* 2.5 Написать property tests для сбора данных ботом
  - **Property 2: Bot collects all user roles**
  - **Property 3: Bot collects role colors in hex format**
  - **Property 4: Bot records activity timestamps**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Расширить модели данных WebSocket сообщений
  - [x] 3.1 Создать модель RoleData в websocket_messages.py
    - Поля: name (str), color (Optional[str])
    - _Requirements: 3.6_
  
  - [x] 3.2 Расширить модель ActivityData
    - Добавить поля: roles (List[RoleData]), activity_started_at (Optional[str]), game_icon_url (Optional[str])
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Обновить Discord Monitor Service для передачи расширенных данных
  - [x] 4.1 Обновить метод get_initial_state
    - Добавить roles, activity_started_at, game_icon_url в SQL запрос
    - Преобразовать activity_started_at в ISO 8601 формат
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.2 Обновить логику broadcast обновлений
    - Включить все новые поля в WebSocket сообщения
    - Оптимизировать для отправки только измененных полей
    - _Requirements: 4.6, 12.5_

- [ ]* 4.3 Написать property tests для API и WebSocket
  - **Property 7: API returns complete presence data**
  - **Property 8: WebSocket broadcasts complete presence data**
  - **Property 26: WebSocket broadcasts only changed fields**
  - **Validates: Requirements 3.1-3.6, 4.1-4.6, 12.5**

- [x] 5. Создать REST API endpoint для получения данных присутствия
  - Создать файл backend/app/routes/discord.py
  - Реализовать GET /api/discord/presence endpoint
  - Возвращать список ActivityData с расширенными полями
  - Добавить кэширование на 5 секунд
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.3_

- [ ]* 5.1 Написать property test для кэширования API
  - **Property 25: API caching behavior**
  - **Validates: Requirements 12.3**

- [x] 6. Checkpoint - Проверить backend изменения
  - Убедиться, что все backend тесты проходят
  - Проверить, что WebSocket транслирует расширенные данные
  - Спросить пользователя, если возникли вопросы

- [x] 7. Создать компонент DiscordActivityCard
  - [x] 7.1 Создать базовую структуру компонента
    - Создать файл frontend/components/DiscordActivityCard.tsx
    - Определить интерфейсы Role и DiscordActivityCardProps
    - Реализовать базовую разметку с аватаром, никнеймом, статусом
    - _Requirements: 5.1, 5.2, 5.7_
  
  - [x] 7.2 Реализовать отображение ролей
    - Рендерить роли как цветные badges
    - Ограничить отображение до 5 ролей с индикатором "+N"
    - Применять цвета ролей или дефолтный серый
    - _Requirements: 5.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 7.3 Реализовать отображение игровой активности
    - Добавить секцию с иконкой игры и названием
    - Реализовать lazy loading для иконок игр
    - Добавить placeholder для отсутствующих иконок
    - _Requirements: 5.4, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 7.4 Реализовать вычисление относительного времени
    - Создать useMemo хук для расчета относительного времени
    - Форматировать время: минуты, часы, дни, недели
    - Отображать "Сейчас" при отсутствии timestamp
    - _Requirements: 5.6, 7.1, 7.2, 7.3, 7.4, 7.6_
  
  - [x] 7.5 Добавить стили компонента
    - Реализовать Discord-подобный дизайн с тенями и границами
    - Добавить hover эффекты
    - Реализовать индикатор статуса с правильными цветами
    - Добавить адаптивные размеры шрифтов
    - _Requirements: 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 11.4, 11.5, 11.6_
  
  - [x] 7.6 Добавить React.memo для оптимизации
    - Обернуть компонент в React.memo
    - _Requirements: 12.2_

- [ ]* 7.7 Написать property tests для компонента карточки
  - **Property 9: Card displays user information**
  - **Property 10: Card displays roles as badges**
  - **Property 11: Card displays game information**
  - **Property 12: Card displays relative time**
  - **Property 13: Card displays status with correct color**
  - **Property 14: Relative time formatting**
  - **Property 16: Role display with limit**
  - **Property 17: Role color application**
  - **Validates: Requirements 5.2-5.7, 7.1-7.6, 8.1-8.6**

- [x] 8. Создать компонент DiscordActivityGrid
  - [x] 8.1 Создать базовую структуру компонента
    - Создать файл frontend/components/DiscordActivityGrid.tsx
    - Определить интерфейс ActivityData
    - Настроить state для хранения списка активностей
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 8.2 Интегрировать useWebSocket hook
    - Подключить существующий useWebSocket hook
    - Обработать initial_state сообщения
    - Обработать activity_update сообщения
    - Обновлять state при получении WebSocket сообщений
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 8.3 Реализовать периодическое обновление относительного времени
    - Добавить useEffect с setInterval для обновления каждые 60 секунд
    - Триггерить ре-рендер для обновления времени во всех карточках
    - _Requirements: 7.5, 12.6_
  
  - [x] 8.4 Добавить адаптивную сетку
    - Реализовать CSS Grid с breakpoints: 3 колонки (>1024px), 2 колонки (768-1024px), 1 колонка (<768px)
    - Добавить заголовок секции и ConnectionStatusIndicator
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 8.5 Рендерить список DiscordActivityCard
    - Маппить activities в компоненты DiscordActivityCard
    - Передавать все необходимые props
    - _Requirements: 5.1-5.8, 12.1_

- [ ]* 8.6 Написать property tests для grid компонента
  - **Property 19: WebSocket updates card state**
  - **Property 20: WebSocket adds new cards**
  - **Property 24: Responsive font sizes**
  - **Property 27: Debounced relative time updates**
  - **Validates: Requirements 10.1-10.3, 11.5, 12.6**

- [x] 9. Обновить TypeScript интерфейсы для WebSocket сообщений
  - Расширить интерфейс ActivityData в useWebSocket.ts или создать отдельный types файл
  - Добавить поля: roles, activity_started_at, game_icon_url
  - Обновить типы для InitialStateMessage и ActivityUpdateMessage
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 10. Интегрировать DiscordActivityGrid в главную страницу
  - Импортировать и использовать DiscordActivityGrid в главной странице
  - Заменить старый блок "ЧТО ПРОИСХОДИТ В DISCORD"
  - Убедиться, что WebSocket URL настроен через переменные окружения
  - _Requirements: 10.1-10.6_

- [x] 11. Checkpoint - Проверить frontend изменения
  - Убедиться, что все frontend тесты проходят
  - Проверить отображение карточек на разных размерах экрана
  - Проверить real-time обновления через WebSocket
  - Спросить пользователя, если возникли вопросы

- [ ]* 12. Написать unit tests для обработки ошибок
  - Тесты для ошибок загрузки изображений (аватары, иконки игр)
  - Тесты для невалидных данных активности
  - Тесты для ошибок WebSocket соединения
  - _Requirements: 9.4, 10.5_

- [ ]* 13. Написать integration tests
  - End-to-end тест: Discord event → БД → API → WebSocket → Frontend
  - Тест real-time обновлений с задержкой < 1 секунды
  - Тест адаптивной сетки на разных viewport размерах
  - _Requirements: 10.4, 11.1, 11.2, 11.3_

- [-] 14. Финальная проверка и оптимизация
  - Проверить производительность рендеринга 50 карточек
  - Проверить время ответа API (<200ms)
  - Проверить latency WebSocket (<500ms)
  - Проверить использование индексов БД
  - Убедиться, что все тесты проходят
  - Спросить пользователя, если возникли вопросы
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

## Notes

- Задачи, помеченные `*`, являются опциональными и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные requirements для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и граничные случаи
- Backend использует Python (FastAPI, discord.py, asyncpg)
- Frontend использует TypeScript (Next.js, React, Tailwind CSS)
