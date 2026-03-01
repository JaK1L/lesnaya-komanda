# Requirements Document

## Introduction

Страница профиля пользователя для сайта "Лесная Команда" позволяет авторизованным пользователям управлять своими персональными данными, включая никнейм, аватар, описание и настройки видимости. Функциональность интегрируется с существующей системой аутентификации через Discord OAuth и базой данных PostgreSQL.

## Glossary

- **Profile_Page**: Веб-страница по адресу `/profile`, доступная только авторизованным пользователям
- **User**: Авторизованный пользователь сайта с записью в таблице users
- **Site_Nickname**: Никнейм пользователя на сайте, независимый от Discord никнейма
- **Bio**: Текстовое описание пользователя о себе
- **Avatar**: Изображение профиля пользователя (URL или загруженный файл)
- **Visibility_Flag**: Флаг is_hidden в базе данных, определяющий видимость пользователя в публичных списках
- **Navigation_Bar**: Панель навигации сайта с кнопками управления
- **Database**: PostgreSQL база данных с таблицей users
- **Backend_API**: FastAPI сервер, обрабатывающий запросы к базе данных
- **Frontend**: Next.js приложение с интерфейсом пользователя

## Requirements

### Requirement 1: Навигация к профилю

**User Story:** Как авторизованный пользователь, я хочу видеть кнопку "ПРОФИЛЬ" в навигации, чтобы быстро перейти на страницу своего профиля

#### Acceptance Criteria

1. WHEN User is authenticated, THE Navigation_Bar SHALL display a "ПРОФИЛЬ" button
2. THE "ПРОФИЛЬ" button SHALL be positioned next to the "ВЫЙТИ" button
3. WHEN User clicks the "ПРОФИЛЬ" button, THE Frontend SHALL navigate to `/profile` page
4. WHEN User is not authenticated, THE Navigation_Bar SHALL NOT display the "ПРОФИЛЬ" button

### Requirement 2: Доступ к странице профиля

**User Story:** Как авторизованный пользователь, я хочу получить доступ к странице профиля, чтобы управлять своими данными

#### Acceptance Criteria

1. WHEN authenticated User navigates to `/profile`, THE Frontend SHALL display the Profile_Page
2. WHEN unauthenticated user attempts to access `/profile`, THE Frontend SHALL redirect to the login page
3. THE Profile_Page SHALL load current user data from the Database
4. WHEN Profile_Page loads, THE Frontend SHALL display user's current Site_Nickname, Avatar, Bio, and Visibility_Flag status

### Requirement 3: Изменение никнейма на сайте

**User Story:** Как пользователь, я хочу изменить свой никнейм на сайте, чтобы он отличался от моего Discord никнейма

#### Acceptance Criteria

1. THE Profile_Page SHALL display an editable text field for Site_Nickname
2. WHEN User modifies Site_Nickname and saves, THE Backend_API SHALL update the site_nickname field in the Database
3. THE Site_Nickname field SHALL accept text input between 1 and 50 characters
4. WHEN Site_Nickname is empty, THE Backend_API SHALL use discord_username as the display name
5. WHEN save operation succeeds, THE Frontend SHALL display a success confirmation message
6. IF save operation fails, THEN THE Frontend SHALL display an error message with details

### Requirement 4: Управление аватаром

**User Story:** Как пользователь, я хочу загрузить или изменить свой аватар, чтобы персонализировать профиль

#### Acceptance Criteria

1. THE Profile_Page SHALL display current Avatar image
2. THE Profile_Page SHALL provide an option to enter Avatar URL
3. THE Profile_Page SHALL provide an option to upload Avatar file
4. WHEN User enters valid Avatar URL and saves, THE Backend_API SHALL update the avatar_url field in the Database
5. WHEN User uploads Avatar file, THE Backend_API SHALL store the file and update avatar_url with the stored file path
6. THE Backend_API SHALL accept image files in formats: JPEG, PNG, GIF, WebP
7. THE Backend_API SHALL limit uploaded Avatar file size to 5MB maximum
8. IF uploaded file exceeds size limit, THEN THE Backend_API SHALL return an error message
9. IF uploaded file format is invalid, THEN THE Backend_API SHALL return an error message

### Requirement 5: Добавление описания о себе

**User Story:** Как пользователь, я хочу добавить описание о себе, чтобы другие участники сообщества могли узнать меня лучше

#### Acceptance Criteria

1. THE Profile_Page SHALL display an editable text area for Bio
2. WHEN User modifies Bio and saves, THE Backend_API SHALL update the bio field in the Database
3. THE Bio field SHALL accept text input up to 500 characters
4. THE Profile_Page SHALL display character count for Bio field
5. WHEN Bio exceeds 500 characters, THE Frontend SHALL prevent further input and display a warning message

### Requirement 6: Управление видимостью профиля

**User Story:** Как пользователь, я хочу скрыть себя с публичных списков сайта, чтобы контролировать свою видимость в сообществе

#### Acceptance Criteria

1. THE Profile_Page SHALL display a checkbox or toggle for Visibility_Flag
2. THE Visibility_Flag control SHALL be labeled "Скрыть профиль из публичных списков"
3. WHEN User toggles Visibility_Flag and saves, THE Backend_API SHALL update the is_hidden field in the Database
4. WHEN is_hidden is true, THE Backend_API SHALL exclude User from public user lists
5. WHEN is_hidden is true, THE User profile SHALL remain accessible via direct URL for authenticated users
6. WHEN is_hidden is false, THE User SHALL appear in all public user lists

### Requirement 7: Сохранение изменений профиля

**User Story:** Как пользователь, я хочу сохранить все изменения профиля одновременно, чтобы эффективно управлять своими данными

#### Acceptance Criteria

1. THE Profile_Page SHALL provide a "Сохранить" button
2. WHEN User clicks "Сохранить", THE Frontend SHALL send all modified profile data to Backend_API
3. THE Backend_API SHALL validate all profile data before saving to Database
4. THE Backend_API SHALL perform atomic update of all profile fields in a single transaction
5. WHEN all validations pass, THE Backend_API SHALL return success status with updated user data
6. IF any validation fails, THEN THE Backend_API SHALL return error status without modifying Database
7. WHEN save succeeds, THE Frontend SHALL update displayed data with confirmed values from Backend_API

### Requirement 8: Дизайн в стиле Lunacy

**User Story:** Как пользователь, я хочу видеть страницу профиля в едином стиле с остальным сайтом, чтобы интерфейс был согласованным

#### Acceptance Criteria

1. THE Profile_Page SHALL use the same color scheme as existing site pages
2. THE Profile_Page SHALL use the same typography and spacing as existing site pages
3. THE Profile_Page SHALL use the same button styles as existing site pages
4. THE Profile_Page SHALL use the same form input styles as existing site pages
5. THE Profile_Page SHALL be responsive and adapt to mobile, tablet, and desktop screen sizes

### Requirement 9: Расширение схемы базы данных

**User Story:** Как система, мне нужно хранить дополнительные поля профиля, чтобы поддерживать новую функциональность

#### Acceptance Criteria

1. THE Database SHALL add a site_nickname column to users table with VARCHAR(50) type
2. THE Database SHALL add a bio column to users table with TEXT type
3. THE Database SHALL add an is_hidden column to users table with BOOLEAN type and default value false
4. THE Database SHALL maintain existing columns: discord_id, discord_username, avatar_url, forest_rank, rating, last_seen, joined_at
5. WHEN migration is applied, THE Database SHALL preserve all existing user data

### Requirement 10: API эндпоинты для профиля

**User Story:** Как Frontend, мне нужны API эндпоинты для работы с профилем, чтобы получать и обновлять данные пользователя

#### Acceptance Criteria

1. THE Backend_API SHALL provide GET `/api/profile` endpoint that returns current user profile data
2. THE Backend_API SHALL provide PUT `/api/profile` endpoint that updates user profile data
3. THE Backend_API SHALL provide POST `/api/profile/avatar` endpoint that handles avatar file uploads
4. WHEN unauthenticated request is made to profile endpoints, THE Backend_API SHALL return 401 Unauthorized status
5. WHEN authenticated request is made, THE Backend_API SHALL identify User from session token
6. THE Backend_API SHALL return profile data in JSON format with fields: site_nickname, discord_username, avatar_url, bio, is_hidden, forest_rank, rating, joined_at
