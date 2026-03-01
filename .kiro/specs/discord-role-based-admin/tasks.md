# Implementation Plan: Discord Role-Based Admin

## Overview

Реализация системы автоматического управления административными правами на основе Discord роли "🐓ПИТУХ🐓". Система проверяет наличие роли при OAuth авторизации, обновляет флаг is_admin в базе данных и предоставляет доступ к административной панели через интерфейс профиля.

## Tasks

- [x] 1. Создать миграцию базы данных для поля is_admin
  - Создать файл миграции `backend/migrations/add_is_admin_column.sql`
  - Добавить колонку is_admin типа BOOLEAN с DEFAULT FALSE и NOT NULL
  - Создать индекс для оптимизации проверок администраторов
  - Обновить существующие записи, установив is_admin=FALSE
  - _Requirements: 2.1, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Реализовать сервис проверки административных прав
  - [x] 2.1 Создать AdminService в backend/app/services/admin_service.py
    - Реализовать метод check_admin_role для проверки наличия роли "🐓ПИТУХ🐓"
    - Реализовать метод update_admin_status для обновления is_admin в БД
    - Реализовать метод sync_admin_status_on_login для синхронизации при OAuth
    - Добавить обработку NULL и невалидного JSON в поле roles
    - Реализовать поиск роли без учета регистра
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2_

  - [ ]* 2.2 Написать property test для Property 1: Role Check Determines Admin Status
    - **Property 1: Role Check Determines Admin Status**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]* 2.3 Написать property test для Property 2: Exact Role Name Matching
    - **Property 2: Exact Role Name Matching**
    - **Validates: Requirements 1.4**

  - [ ]* 2.4 Написать property test для Property 7: JSONB Role Array Processing
    - **Property 7: JSONB Role Array Processing**
    - **Validates: Requirements 7.2**

  - [ ]* 2.5 Написать property test для Property 8: Case-Insensitive Role Search
    - **Property 8: Case-Insensitive Role Search**
    - **Validates: Requirements 7.4**

  - [ ]* 2.6 Написать unit тесты для AdminService
    - Тесты для различных комбинаций ролей
    - Тесты для обработки NULL и невалидного JSON
    - Тесты для case-insensitive поиска
    - _Requirements: 7.2, 7.4, 8.1, 8.2_

- [x] 3. Интегрировать проверку ролей в OAuth flow
  - [x] 3.1 Обновить backend/app/routes/discord_oauth.py
    - Добавить вызов AdminService.sync_admin_status_on_login после создания/обновления пользователя
    - Добавить логирование назначения административных прав (INFO level)
    - Добавить логирование отзыва административных прав (WARNING level)
    - Обработать ошибки обновления is_admin без прерывания OAuth процесса
    - _Requirements: 1.5, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 3.2 Написать property test для Property 3: Admin Status Synchronization on Re-login
    - **Property 3: Admin Status Synchronization on Re-login**
    - **Validates: Requirements 1.5**

  - [ ]* 3.3 Написать property test для Property 9: OAuth Resilience to Admin Status Update Failures
    - **Property 9: OAuth Resilience to Admin Status Update Failures**
    - **Validates: Requirements 8.5**

  - [ ]* 3.4 Написать property test для Property 10: Admin Status Change Logging
    - **Property 10: Admin Status Change Logging**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 3.5 Написать integration тесты для OAuth flow
    - Тест с наличием админ роли
    - Тест без админ роли
    - Тест с повторной авторизацией
    - Тест с ошибкой обновления is_admin
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 8.5_

- [ ] 4. Checkpoint - Проверить работу OAuth и синхронизации ролей
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Обновить схемы данных и Profile API
  - [x] 5.1 Обновить ProfileResponse в backend/app/schemas.py
    - Добавить поле is_admin: bool в ProfileResponse
    - _Requirements: 2.1_

  - [x] 5.2 Обновить ProfileService в backend/app/services/profile_service.py
    - Добавить is_admin в SELECT запрос get_user_profile
    - _Requirements: 2.2_

  - [ ]* 5.3 Написать unit тесты для обновленного ProfileService
    - Тест возврата is_admin=True
    - Тест возврата is_admin=False
    - _Requirements: 2.2_

- [x] 6. Обновить middleware для защиты административных эндпоинтов
  - [x] 6.1 Обновить get_current_admin_user в backend/app/auth.py
    - Добавить проверку is_admin из таблицы users для Discord пользователей
    - Вернуть HTTP 403 если is_admin=FALSE
    - Сохранить существующую логику для admin_users
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.2 Написать property test для Property 5: Admin Endpoint Access Control
    - **Property 5: Admin Endpoint Access Control**
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 6.3 Написать property test для Property 6: Invalid Token Rejection
    - **Property 6: Invalid Token Rejection**
    - **Validates: Requirements 4.5**

  - [ ]* 6.4 Написать integration тесты для admin middleware
    - Тест доступа с is_admin=True
    - Тест блокировки с is_admin=False (403)
    - Тест с невалидным токеном (401)
    - Тест с отсутствующим токеном (401)
    - _Requirements: 4.3, 4.4, 4.5_

- [ ] 7. Checkpoint - Проверить защиту административных эндпоинтов
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Обновить frontend профиль для отображения админ панели
  - [x] 8.1 Обновить интерфейс ProfileData в frontend/app/profile/page.tsx
    - Добавить поле is_admin: boolean в интерфейс ProfileData
    - _Requirements: 3.1, 3.2_

  - [x] 8.2 Создать компонент AdminPanel в frontend/app/profile/page.tsx
    - Создать компонент с кнопками для управления новостями, лентой, событиями и настройками
    - Добавить ссылки на /admin/news, /admin/feed, /admin/events, /admin/settings
    - Применить стили lunacy-card и lunacy-button
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3, 5.4_

  - [x] 8.3 Добавить условный рендеринг AdminPanel
    - Отображать AdminPanel только если profile.is_admin === true
    - _Requirements: 3.1, 3.2_

  - [ ]* 8.4 Написать property test для Property 4: Admin Panel Visibility
    - **Property 4: Admin Panel Visibility**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 8.5 Написать unit тесты для компонента AdminPanel
    - Тест рендеринга всех кнопок
    - Тест условного рендеринга на основе is_admin
    - Тест навигации по ссылкам
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 9. Добавить защиту административных страниц на frontend
  - [x] 9.1 Добавить проверку is_admin в frontend/app/admin/news/page.tsx
    - Добавить useEffect для проверки is_admin через /api/profile
    - Редиректить на /profile если is_admin=false
    - Редиректить на / при ошибке загрузки профиля
    - _Requirements: 5.1_

  - [x] 9.2 Добавить проверку is_admin в frontend/app/admin/feed/page.tsx
    - Добавить useEffect для проверки is_admin через /api/profile
    - Редиректить на /profile если is_admin=false
    - Редиректить на / при ошибке загрузки профиля
    - _Requirements: 5.2_

  - [x] 9.3 Добавить проверку is_admin в frontend/app/admin/events/page.tsx
    - Добавить useEffect для проверки is_admin через /api/profile
    - Редиректить на /profile если is_admin=false
    - Редиректить на / при ошибке загрузки профиля
    - _Requirements: 5.3_

  - [x] 9.4 Добавить проверку is_admin в frontend/app/admin/settings/page.tsx
    - Добавить useEffect для проверки is_admin через /api/profile
    - Редиректить на /profile если is_admin=false
    - Редиректить на / при ошибке загрузки профиля
    - _Requirements: 5.4_

  - [ ]* 9.5 Написать integration тесты для защиты админ страниц
    - Тест редиректа для не-админа
    - Тест доступа для админа
    - Тест обработки ошибок загрузки профиля
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Checkpoint - Проверить работу frontend и интеграцию
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Финальная интеграция и проверка
  - [ ] 11.1 Применить миграцию базы данных
    - Запустить миграцию add_is_admin_column.sql
    - Проверить создание колонки и индекса
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 11.2 Проверить end-to-end flow
    - Проверить OAuth авторизацию с админ ролью
    - Проверить OAuth авторизацию без админ роли
    - Проверить отображение админ панели в профиле
    - Проверить доступ к административным страницам
    - Проверить защиту административных эндпоинтов
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.3, 4.4, 5.5_

  - [ ]* 11.3 Запустить все property-based тесты
    - Запустить все 10 property тестов с минимум 100 итерациями
    - Проверить отсутствие ошибок

- [ ] 12. Final checkpoint - Убедиться что все тесты проходят
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Задачи помеченные `*` являются опциональными и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property тесты валидируют универсальные свойства корректности
- Unit тесты валидируют конкретные примеры и граничные случаи
- Backend использует Python/FastAPI, frontend использует TypeScript/React
- Система интегрируется с существующей инфраструктурой Discord OAuth и discord_presence
