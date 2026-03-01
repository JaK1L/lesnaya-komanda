# Requirements Document

## Introduction

Система управления правами администратора на основе Discord роли "🐓ПИТУХ🐓". Пользователи с этой ролью в Discord автоматически получают доступ к административной панели при авторизации через Discord OAuth. Система интегрируется с существующей инфраструктурой сбора данных о ролях пользователей через Discord бота.

## Glossary

- **Admin_System**: Система управления административными правами
- **Discord_OAuth**: Механизм аутентификации через Discord
- **Admin_Role**: Discord роль "🐓ПИТУХ🐓" (с эмодзи)
- **User_Database**: База данных PostgreSQL с таблицей users
- **Discord_Presence**: Таблица discord_presence с данными о ролях пользователей (поле roles JSONB)
- **Admin_Panel**: Интерфейс административной панели в профиле пользователя
- **Backend_API**: FastAPI сервер с эндпоинтами администрирования
- **JWT_Token**: JSON Web Token для аутентификации запросов

## Requirements

### Requirement 1: Автоматическое назначение прав администратора

**User Story:** Как пользователь с Discord ролью "🐓ПИТУХ🐓", я хочу автоматически получать права администратора при входе, чтобы не требовалось ручное назначение прав.

#### Acceptance Criteria

1. WHEN пользователь проходит Discord OAuth авторизацию, THE Admin_System SHALL проверить наличие Admin_Role в discord_presence.roles
2. WHEN Admin_Role обнаружена в discord_presence.roles, THE Admin_System SHALL установить поле is_admin в TRUE в User_Database
3. WHEN Admin_Role отсутствует в discord_presence.roles, THE Admin_System SHALL установить поле is_admin в FALSE в User_Database
4. THE Admin_System SHALL сравнивать роли по точному совпадению имени "🐓ПИТУХ🐓" включая эмодзи
5. WHEN пользователь повторно авторизуется, THE Admin_System SHALL обновить статус is_admin на основе текущих ролей

### Requirement 2: Хранение статуса администратора

**User Story:** Как система, я хочу хранить статус администратора в базе данных, чтобы быстро проверять права доступа без обращения к Discord API.

#### Acceptance Criteria

1. THE User_Database SHALL содержать поле is_admin типа BOOLEAN с значением по умолчанию FALSE
2. THE User_Database SHALL обновлять поле is_admin при каждой OAuth авторизации
3. THE Admin_System SHALL использовать поле is_admin для проверки прав доступа к административным функциям

### Requirement 3: Отображение административной панели

**User Story:** Как администратор, я хочу видеть вкладку "АДМИНКА" в своем профиле, чтобы получить доступ к административным функциям.

#### Acceptance Criteria

1. WHEN пользователь с is_admin=TRUE открывает профиль, THE Admin_Panel SHALL отображать вкладку "АДМИНКА"
2. WHEN пользователь с is_admin=FALSE открывает профиль, THE Admin_Panel SHALL скрывать вкладку "АДМИНКА"
3. THE Admin_Panel SHALL содержать ссылки на управление новостями (/admin/news)
4. THE Admin_Panel SHALL содержать ссылки на управление лентой (/admin/feed)
5. THE Admin_Panel SHALL содержать ссылки на управление событиями (/admin/events)
6. THE Admin_Panel SHALL содержать ссылки на настройки (/admin/settings)

### Requirement 4: Защита административных эндпоинтов

**User Story:** Как система безопасности, я хочу проверять права администратора на backend при каждом запросе, чтобы предотвратить несанкционированный доступ.

#### Acceptance Criteria

1. WHEN запрос поступает к административному эндпоинту, THE Backend_API SHALL извлечь user_id из JWT_Token
2. WHEN user_id извлечен, THE Backend_API SHALL проверить значение is_admin в User_Database
3. IF is_admin=FALSE, THEN THE Backend_API SHALL вернуть HTTP статус 403 Forbidden
4. IF is_admin=TRUE, THEN THE Backend_API SHALL разрешить выполнение запроса
5. IF JWT_Token невалиден или отсутствует, THEN THE Backend_API SHALL вернуть HTTP статус 401 Unauthorized

### Requirement 5: Интеграция с существующими административными страницами

**User Story:** Как администратор, я хочу использовать все существующие административные функции через новую панель, чтобы сохранить функциональность системы.

#### Acceptance Criteria

1. THE Admin_Panel SHALL предоставлять доступ к странице управления новостями (frontend/app/admin/news/page.tsx)
2. THE Admin_Panel SHALL предоставлять доступ к странице управления лентой (frontend/app/admin/feed/page.tsx)
3. THE Admin_Panel SHALL предоставлять доступ к странице управления событиями (frontend/app/admin/events/page.tsx)
4. THE Admin_Panel SHALL предоставлять доступ к странице настроек (frontend/app/admin/settings/page.tsx)
5. THE Admin_System SHALL сохранить всю существующую функциональность административных страниц

### Requirement 6: Миграция базы данных

**User Story:** Как система, я хочу добавить поле is_admin в существующую таблицу users, чтобы хранить статус администратора.

#### Acceptance Criteria

1. THE Admin_System SHALL создать миграцию для добавления поля is_admin в таблицу users
2. THE Admin_System SHALL установить тип поля is_admin как BOOLEAN
3. THE Admin_System SHALL установить значение по умолчанию FALSE для поля is_admin
4. THE Admin_System SHALL установить NOT NULL constraint для поля is_admin
5. WHEN миграция применяется к существующим записям, THE Admin_System SHALL установить is_admin=FALSE для всех пользователей

### Requirement 7: Синхронизация с данными Discord бота

**User Story:** Как система, я хочу использовать данные о ролях из discord_presence, чтобы определять административные права на основе актуальной информации.

#### Acceptance Criteria

1. THE Admin_System SHALL читать поле roles из таблицы discord_presence
2. THE Admin_System SHALL обрабатывать roles как JSONB массив объектов с полями name и color
3. WHEN роль "🐓ПИТУХ🐓" найдена в массиве roles, THE Admin_System SHALL считать пользователя администратором
4. THE Admin_System SHALL выполнять поиск роли без учета регистра для поля name
5. IF запись в discord_presence отсутствует для пользователя, THEN THE Admin_System SHALL установить is_admin=FALSE

### Requirement 8: Обработка ошибок авторизации

**User Story:** Как система, я хочу корректно обрабатывать ошибки при проверке ролей, чтобы обеспечить стабильную работу авторизации.

#### Acceptance Criteria

1. IF discord_presence.roles имеет значение NULL, THEN THE Admin_System SHALL установить is_admin=FALSE
2. IF discord_presence.roles содержит невалидный JSON, THEN THE Admin_System SHALL логировать ошибку и установить is_admin=FALSE
3. IF соединение с User_Database недоступно при OAuth, THEN THE Admin_System SHALL вернуть HTTP статус 503 Service Unavailable
4. WHEN происходит ошибка обновления is_admin, THE Admin_System SHALL логировать детали ошибки
5. THE Admin_System SHALL продолжить процесс авторизации даже при ошибке обновления is_admin

### Requirement 9: Логирование административных действий

**User Story:** Как администратор системы, я хочу видеть логи назначения и отзыва административных прав, чтобы отслеживать изменения в системе безопасности.

#### Acceptance Criteria

1. WHEN is_admin изменяется с FALSE на TRUE, THE Admin_System SHALL логировать событие с user_id и временной меткой
2. WHEN is_admin изменяется с TRUE на FALSE, THE Admin_System SHALL логировать событие с user_id и временной меткой
3. THE Admin_System SHALL включать в лог информацию о наличии Admin_Role в discord_presence
4. THE Admin_System SHALL использовать уровень логирования INFO для успешных изменений прав
5. THE Admin_System SHALL использовать уровень логирования WARNING для отзыва административных прав
