# Requirements Document

## Introduction

Улучшение блока "ЧТО ПРОИСХОДИТ В DISCORD" на главной странице для создания нативного Discord UI с карточками активности. Текущая реализация показывает только базовую информацию (никнейм, статус, игра) в простом списке. Новая версия должна отображать активность пользователей в виде карточек с иконками игр, ролями, временем активности и детальными статусами, как в оригинальном Discord клиенте.

## Glossary

- **Discord_Activity_Card**: Визуальный компонент карточки, отображающий активность одного пользователя
- **Discord_Bot**: Бот, собирающий данные о присутствии и активности пользователей с Discord сервера
- **Backend_API**: FastAPI сервер, предоставляющий REST API и WebSocket соединения
- **Frontend_Client**: Next.js приложение, отображающее пользовательский интерфейс
- **WebSocket_Connection**: Двунаправленное соединение для real-time обновлений
- **Presence_Data**: Данные о присутствии пользователя (статус, активность, роли)
- **Activity_Timestamp**: Время начала текущей активности пользователя
- **User_Role**: Роль пользователя на Discord сервере с названием и цветом
- **Status_Indicator**: Визуальный индикатор статуса (онлайн/оффлайн/не беспокоить/idle)
- **Relative_Time**: Относительное время в формате "7 д. назад", "2 ч. назад"
- **Database_Schema**: Структура таблиц PostgreSQL для хранения данных присутствия

## Requirements

### Requirement 1: Хранение расширенных данных присутствия

**User Story:** Как система, я хочу хранить полные данные о присутствии пользователей, чтобы отображать детальную информацию об активности

#### Acceptance Criteria

1. THE Database_Schema SHALL include a column for storing user roles as JSON array
2. THE Database_Schema SHALL include a column for storing activity start timestamp
3. THE Database_Schema SHALL include a column for storing detailed status (online/offline/dnd/idle)
4. THE Database_Schema SHALL include a column for storing game icon URL
5. WHEN presence data is stored, THE Database_Schema SHALL preserve all role information including name and color
6. WHEN presence data is stored, THE Database_Schema SHALL record the exact timestamp when activity started

### Requirement 2: Сбор данных Discord ботом

**User Story:** Как Discord бот, я хочу собирать полные данные о присутствии пользователей, чтобы система могла отображать детальную активность

#### Acceptance Criteria

1. WHEN a user presence updates, THE Discord_Bot SHALL collect all user roles from the server
2. WHEN a user presence updates, THE Discord_Bot SHALL collect role colors in hexadecimal format
3. WHEN a user starts an activity, THE Discord_Bot SHALL record the activity start timestamp
4. WHEN a user presence updates, THE Discord_Bot SHALL collect the detailed status (online/offline/dnd/idle)
5. WHEN a user plays a game, THE Discord_Bot SHALL collect the game icon URL if available
6. WHEN presence data is collected, THE Discord_Bot SHALL store it in the database within 1 second

### Requirement 3: API для расширенных данных присутствия

**User Story:** Как фронтенд клиент, я хочу получать полные данные о присутствии через API, чтобы отображать детальные карточки активности

#### Acceptance Criteria

1. THE Backend_API SHALL provide an endpoint that returns presence data with roles
2. THE Backend_API SHALL provide an endpoint that returns presence data with activity timestamps
3. THE Backend_API SHALL provide an endpoint that returns presence data with detailed statuses
4. THE Backend_API SHALL provide an endpoint that returns presence data with game icons
5. WHEN presence data is requested, THE Backend_API SHALL return data within 200ms
6. THE Backend_API SHALL return roles as an array of objects with name and color properties

### Requirement 4: WebSocket обновления расширенных данных

**User Story:** Как фронтенд клиент, я хочу получать real-time обновления с полными данными присутствия, чтобы карточки обновлялись мгновенно

#### Acceptance Criteria

1. WHEN presence updates, THE WebSocket_Connection SHALL broadcast messages with role information
2. WHEN presence updates, THE WebSocket_Connection SHALL broadcast messages with activity timestamps
3. WHEN presence updates, THE WebSocket_Connection SHALL broadcast messages with detailed statuses
4. WHEN presence updates, THE WebSocket_Connection SHALL broadcast messages with game icons
5. THE WebSocket_Connection SHALL deliver presence updates to connected clients within 500ms
6. THE WebSocket_Connection SHALL include all fields from Presence_Data in broadcast messages

### Requirement 5: Компонент карточки активности

**User Story:** Как пользователь, я хочу видеть активность Discord в виде карточек, чтобы интерфейс выглядел как нативный Discord

#### Acceptance Criteria

1. THE Discord_Activity_Card SHALL display a circular user avatar
2. THE Discord_Activity_Card SHALL display the user nickname
3. THE Discord_Activity_Card SHALL display user roles as colored badges
4. THE Discord_Activity_Card SHALL display a large game icon when user is playing
5. THE Discord_Activity_Card SHALL display the game name
6. THE Discord_Activity_Card SHALL display relative time since activity started
7. THE Discord_Activity_Card SHALL display a status indicator with appropriate color
8. THE Discord_Activity_Card SHALL use card-based layout with shadows and borders

### Requirement 6: Индикация статуса пользователя

**User Story:** Как пользователь, я хочу видеть детальный статус каждого пользователя, чтобы понимать их доступность

#### Acceptance Criteria

1. WHEN user status is online, THE Status_Indicator SHALL display a green indicator
2. WHEN user status is offline, THE Status_Indicator SHALL display a gray indicator
3. WHEN user status is dnd (do not disturb), THE Status_Indicator SHALL display a red indicator
4. WHEN user status is idle, THE Status_Indicator SHALL display a yellow indicator
5. THE Status_Indicator SHALL be positioned on the user avatar
6. THE Status_Indicator SHALL be circular with 12px diameter

### Requirement 7: Отображение относительного времени

**User Story:** Как пользователь, я хочу видеть как давно началась активность, чтобы понимать актуальность информации

#### Acceptance Criteria

1. WHEN activity duration is less than 1 hour, THE Relative_Time SHALL display minutes (e.g., "15 мин. назад")
2. WHEN activity duration is less than 24 hours, THE Relative_Time SHALL display hours (e.g., "2 ч. назад")
3. WHEN activity duration is less than 7 days, THE Relative_Time SHALL display days (e.g., "3 д. назад")
4. WHEN activity duration is 7 days or more, THE Relative_Time SHALL display weeks (e.g., "2 нед. назад")
5. THE Relative_Time SHALL update every 60 seconds without full page reload
6. WHEN activity timestamp is missing, THE Relative_Time SHALL display "Сейчас"

### Requirement 8: Отображение ролей пользователя

**User Story:** Как пользователь, я хочу видеть роли каждого участника Discord, чтобы понимать их статус в сообществе

#### Acceptance Criteria

1. THE Discord_Activity_Card SHALL display all user roles as badges
2. WHEN a role has a color, THE Discord_Activity_Card SHALL apply that color to the badge background
3. WHEN a role has no color, THE Discord_Activity_Card SHALL use a default gray color
4. THE Discord_Activity_Card SHALL display roles in horizontal layout with 4px spacing
5. THE Discord_Activity_Card SHALL limit role badge height to 20px
6. WHEN user has more than 5 roles, THE Discord_Activity_Card SHALL display first 5 roles and "+N" indicator

### Requirement 9: Отображение иконок игр

**User Story:** Как пользователь, я хочу видеть иконки игр, чтобы быстро распознавать во что играют участники

#### Acceptance Criteria

1. WHEN game icon URL is available, THE Discord_Activity_Card SHALL display the game icon
2. THE Discord_Activity_Card SHALL display game icons with 64x64px dimensions
3. THE Discord_Activity_Card SHALL display game icons with rounded corners (8px radius)
4. WHEN game icon fails to load, THE Discord_Activity_Card SHALL display a placeholder icon
5. WHEN game icon is not available, THE Discord_Activity_Card SHALL display a default gaming controller icon
6. THE Discord_Activity_Card SHALL load game icons lazily to optimize performance

### Requirement 10: Real-time обновление карточек

**User Story:** Как пользователь, я хочу видеть обновления активности в реальном времени, чтобы информация была актуальной

#### Acceptance Criteria

1. WHEN WebSocket receives presence update, THE Frontend_Client SHALL update the corresponding Discord_Activity_Card
2. WHEN a new user comes online, THE Frontend_Client SHALL add a new Discord_Activity_Card
3. WHEN a user goes offline, THE Frontend_Client SHALL update the Discord_Activity_Card status
4. WHEN user activity changes, THE Frontend_Client SHALL update the Discord_Activity_Card within 1 second
5. THE Frontend_Client SHALL maintain WebSocket connection and reconnect automatically on disconnect
6. THE Frontend_Client SHALL display connection status indicator for WebSocket state

### Requirement 11: Адаптивный дизайн карточек

**User Story:** Как пользователь, я хочу видеть карточки активности на любом устройстве, чтобы интерфейс был удобен везде

#### Acceptance Criteria

1. WHEN viewport width is greater than 1024px, THE Discord_Activity_Card SHALL display in 3-column grid
2. WHEN viewport width is between 768px and 1024px, THE Discord_Activity_Card SHALL display in 2-column grid
3. WHEN viewport width is less than 768px, THE Discord_Activity_Card SHALL display in single column
4. THE Discord_Activity_Card SHALL maintain aspect ratio on all screen sizes
5. THE Discord_Activity_Card SHALL use responsive font sizes (16px on desktop, 14px on mobile)
6. THE Discord_Activity_Card SHALL maintain minimum width of 280px

### Requirement 12: Производительность и оптимизация

**User Story:** Как система, я хочу эффективно обрабатывать данные присутствия, чтобы интерфейс оставался быстрым

#### Acceptance Criteria

1. THE Frontend_Client SHALL render up to 50 Discord_Activity_Card components without performance degradation
2. THE Frontend_Client SHALL use React memoization to prevent unnecessary re-renders
3. THE Backend_API SHALL cache presence data for 5 seconds to reduce database queries
4. THE Backend_API SHALL use database indexes on user_id and timestamp columns
5. WHEN presence data updates, THE Backend_API SHALL broadcast only changed fields via WebSocket
6. THE Frontend_Client SHALL debounce relative time updates to once per minute per card
