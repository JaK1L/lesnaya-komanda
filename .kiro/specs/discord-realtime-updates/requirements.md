# Requirements Document

## Introduction

Эта функция добавляет real-time обновления для блока "ЧТО ПРОИСХОДИТ В DISCORD" через WebSocket соединение. Вместо однократной загрузки данных при загрузке страницы, пользователи будут получать мгновенные обновления об активности в Discord: изменения игровой активности, статусов пользователей, топов по сообщениям и голосу.

## Glossary

- **WebSocket_Server**: Серверный компонент на FastAPI, который управляет WebSocket соединениями и отправляет обновления клиентам
- **WebSocket_Client**: Клиентский компонент на Next.js фронтенде, который устанавливает и поддерживает WebSocket соединение
- **Discord_Block**: UI компонент, отображающий информацию "ЧТО ПРОИСХОДИТ В DISCORD"
- **Connection_Status_Indicator**: UI элемент, показывающий статус WebSocket соединения
- **Discord_Update**: Сообщение с данными об изменениях в Discord активности
- **Reconnection_Handler**: Компонент, управляющий автоматическим переподключением при разрыве соединения
- **Activity_Data**: Данные о текущей активности пользователей (игры, статусы)
- **Statistics_Data**: Данные топов по сообщениям и голосу

## Requirements

### Requirement 1: WebSocket Server Endpoint

**User Story:** Как бэкенд разработчик, я хочу иметь WebSocket endpoint, чтобы отправлять real-time обновления Discord данных клиентам

#### Acceptance Criteria

1. THE WebSocket_Server SHALL expose a WebSocket endpoint at `/ws/discord`
2. WHEN a client connects, THE WebSocket_Server SHALL accept the connection and add it to active connections list
3. WHEN a client disconnects, THE WebSocket_Server SHALL remove the connection from active connections list
4. WHEN Discord_Update is available, THE WebSocket_Server SHALL broadcast it to all connected clients within 100ms
5. THE WebSocket_Server SHALL send updates in JSON format with a consistent schema

### Requirement 2: Discord Activity Updates

**User Story:** Как пользователь, я хочу видеть в реальном времени, кто во что играет, чтобы быть в курсе активности сообщества

#### Acceptance Criteria

1. WHEN a user starts playing a game, THE WebSocket_Server SHALL send Discord_Update with game start event
2. WHEN a user stops playing a game, THE WebSocket_Server SHALL send Discord_Update with game stop event
3. WHEN a user changes status (online/offline/idle/dnd), THE WebSocket_Server SHALL send Discord_Update with status change event
4. THE Discord_Update SHALL include user identifier, activity type, and timestamp
5. FOR ALL Discord_Update messages, THE WebSocket_Client SHALL parse and apply updates to Discord_Block within 50ms

### Requirement 3: Statistics Updates

**User Story:** Как пользователь, я хочу видеть актуальные топы по сообщениям и голосу, чтобы отслеживать самых активных участников

#### Acceptance Criteria

1. WHEN message statistics change, THE WebSocket_Server SHALL send Discord_Update with updated message leaderboard
2. WHEN voice statistics change, THE WebSocket_Server SHALL send Discord_Update with updated voice leaderboard
3. THE WebSocket_Server SHALL send statistics updates at most once per 30 seconds to avoid excessive traffic
4. THE Discord_Update SHALL include complete leaderboard data with user identifiers and metrics
5. THE WebSocket_Client SHALL replace existing statistics with new data when update is received

### Requirement 4: WebSocket Client Connection

**User Story:** Как фронтенд разработчик, я хочу иметь WebSocket клиент, чтобы получать real-time обновления от сервера

#### Acceptance Criteria

1. WHEN Discord_Block component mounts, THE WebSocket_Client SHALL establish connection to WebSocket_Server
2. WHEN Discord_Block component unmounts, THE WebSocket_Client SHALL close the connection gracefully
3. WHEN WebSocket_Client receives Discord_Update, THE WebSocket_Client SHALL validate the message format
4. IF Discord_Update has invalid format, THEN THE WebSocket_Client SHALL log error and ignore the message
5. THE WebSocket_Client SHALL update Discord_Block state with validated data

### Requirement 5: Connection Status Indicator

**User Story:** Как пользователь, я хочу видеть статус подключения, чтобы понимать, получаю ли я актуальные данные

#### Acceptance Criteria

1. WHEN WebSocket connection is established, THE Connection_Status_Indicator SHALL display "connected" state
2. WHEN WebSocket connection is lost, THE Connection_Status_Indicator SHALL display "disconnected" state
3. WHILE reconnection is in progress, THE Connection_Status_Indicator SHALL display "reconnecting" state
4. THE Connection_Status_Indicator SHALL use visual cues (color, icon) to distinguish between states
5. THE Connection_Status_Indicator SHALL be visible but non-intrusive in the Discord_Block UI

### Requirement 6: Automatic Reconnection

**User Story:** Как пользователь, я хочу автоматическое переподключение при разрыве соединения, чтобы не терять real-time обновления

#### Acceptance Criteria

1. WHEN WebSocket connection is lost, THE Reconnection_Handler SHALL attempt to reconnect after 1 second
2. IF reconnection fails, THEN THE Reconnection_Handler SHALL retry with exponential backoff up to 30 seconds
3. THE Reconnection_Handler SHALL attempt reconnection at most 10 times before stopping
4. WHEN reconnection succeeds, THE Reconnection_Handler SHALL reset retry counter and backoff timer
5. WHILE reconnecting, THE WebSocket_Client SHALL queue incoming state changes and apply them after reconnection

### Requirement 7: Error Handling

**User Story:** Как разработчик, я хочу надежную обработку ошибок, чтобы система продолжала работать при сбоях

#### Acceptance Criteria

1. IF WebSocket_Server encounters error while broadcasting, THEN THE WebSocket_Server SHALL log error and continue serving other connections
2. IF WebSocket_Client receives malformed message, THEN THE WebSocket_Client SHALL log error and continue listening for messages
3. WHEN WebSocket connection fails to establish, THE WebSocket_Client SHALL fall back to REST API polling every 30 seconds
4. THE WebSocket_Server SHALL send heartbeat ping every 30 seconds to detect stale connections
5. IF client does not respond to heartbeat within 10 seconds, THEN THE WebSocket_Server SHALL close the connection

### Requirement 8: Data Consistency

**User Story:** Как пользователь, я хочу видеть согласованные данные, чтобы информация в блоке была точной

#### Acceptance Criteria

1. WHEN WebSocket_Client connects, THE WebSocket_Server SHALL send complete current state as initial message
2. THE WebSocket_Client SHALL apply initial state before processing incremental updates
3. FOR ALL Activity_Data updates, applying update then reverting SHALL return to previous state (inverse operations)
4. THE WebSocket_Client SHALL maintain local timestamp of last update to detect out-of-order messages
5. IF Discord_Update has older timestamp than last processed update, THEN THE WebSocket_Client SHALL ignore the message

### Requirement 9: Performance and Scalability

**User Story:** Как системный администратор, я хочу эффективное использование ресурсов, чтобы система масштабировалась

#### Acceptance Criteria

1. THE WebSocket_Server SHALL support at least 100 concurrent connections without degradation
2. THE WebSocket_Server SHALL use message batching to send multiple updates in single transmission when possible
3. THE WebSocket_Client SHALL debounce UI updates to render at most 10 times per second
4. THE WebSocket_Server SHALL compress messages larger than 1KB using gzip
5. THE WebSocket_Server SHALL limit message queue size to 100 messages per connection to prevent memory exhaustion

### Requirement 10: Security

**User Story:** Как администратор безопасности, я хочу защищенное WebSocket соединение, чтобы предотвратить несанкционированный доступ

#### Acceptance Criteria

1. THE WebSocket_Server SHALL require authentication token for connection establishment
2. IF authentication token is invalid or missing, THEN THE WebSocket_Server SHALL reject connection with 401 status
3. THE WebSocket_Server SHALL use WSS protocol (WebSocket over TLS) in production environment
4. THE WebSocket_Server SHALL validate origin header to prevent cross-site WebSocket hijacking
5. THE WebSocket_Server SHALL rate limit connections to 5 per minute per IP address

## Notes

- Система должна gracefully деградировать до REST API polling если WebSocket недоступен
- Рекомендуется использовать библиотеку `fastapi-websocket` для бэкенда и нативный WebSocket API или библиотеку типа `socket.io-client` для фронтенда
- Необходимо учесть, что в production окружении может потребоваться настройка nginx/load balancer для проксирования WebSocket соединений
- Для тестирования reconnection логики рекомендуется использовать property-based тесты с симуляцией сетевых сбоев
