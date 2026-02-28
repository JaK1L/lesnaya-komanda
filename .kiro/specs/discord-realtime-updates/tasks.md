# Implementation Plan: Discord Real-Time Updates

## Overview

Реализация WebSocket-based real-time обновлений для блока "ЧТО ПРОИСХОДИТ В DISCORD". Система включает WebSocket сервер на FastAPI (backend), WebSocket клиент на Next.js/React (frontend), и механизмы надежности (reconnection, fallback to polling).

## Tasks

- [ ] 1. Настроить WebSocket инфраструктуру на бэкенде
  - [x] 1.1 Создать WebSocket endpoint `/ws/discord` в FastAPI
    - Добавить endpoint в `backend/app/api/websocket.py`
    - Реализовать базовую логику accept/disconnect соединений
    - Добавить authentication через query parameter `token`
    - _Requirements: 1.1, 1.2, 1.3, 10.1, 10.2_
  
  - [ ]* 1.2 Написать property test для connection lifecycle
    - **Property 1: Connection Lifecycle Management**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 1.3 Создать Connection Manager для управления активными соединениями
    - Создать класс `ConnectionManager` в `backend/app/services/connection_manager.py`
    - Реализовать методы `add_connection`, `remove_connection`, `get_active_connections`
    - Добавить rate limiting (5 connections/minute per IP)
    - _Requirements: 1.2, 1.3, 10.5_
  
  - [ ]* 1.4 Написать property test для rate limiting
    - **Property 28: Connection Rate Limiting**
    - **Validates: Requirements 10.5**

- [ ] 2. Реализовать message types и serialization на бэкенде
  - [x] 2.1 Создать Pydantic модели для всех типов сообщений
    - Создать файл `backend/app/models/websocket_messages.py`
    - Реализовать модели: `InitialStateMessage`, `ActivityUpdateMessage`, `StatisticsUpdateMessage`, `HeartbeatMessage`
    - Добавить валидацию полей
    - _Requirements: 1.5, 2.4, 3.4_
  
  - [ ]* 2.2 Написать property test для message serialization
    - **Property 3: Message Serialization Round-Trip**
    - **Validates: Requirements 1.5**

- [ ] 3. Реализовать broadcast механизм на бэкенде
  - [x] 3.1 Добавить метод broadcast в Connection Manager
    - Реализовать `broadcast_message(message: DiscordMessage)` в `ConnectionManager`
    - Добавить error isolation (ошибка одного клиента не влияет на других)
    - Добавить логирование ошибок broadcast
    - _Requirements: 1.4, 7.1_
  
  - [ ]* 3.2 Написать property test для broadcast delivery
    - **Property 2: Broadcast Delivery**
    - **Validates: Requirements 1.4**
  
  - [ ]* 3.3 Написать property test для error isolation
    - **Property 14: Error Isolation**
    - **Validates: Requirements 7.1**
  
  - [x] 3.4 Реализовать message batching для оптимизации
    - Добавить буфер сообщений с временным окном (50ms)
    - Реализовать логику объединения нескольких updates в один batch
    - _Requirements: 9.2_
  
  - [ ]* 3.5 Написать property test для message batching
    - **Property 22: Message Batching**
    - **Validates: Requirements 9.2**

- [ ] 4. Checkpoint - Проверить базовую WebSocket инфраструктуру
  - Убедиться, что WebSocket endpoint принимает соединения
  - Проверить, что authentication работает корректно
  - Убедиться, что broadcast доставляет сообщения всем клиентам
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Реализовать Discord Monitor для генерации updates
  - [x] 5.1 Создать Discord Monitor service
    - Создать класс `DiscordMonitor` в `backend/app/services/discord_monitor.py`
    - Реализовать метод для получения текущего состояния из БД
    - Реализовать метод `get_initial_state()` для новых подключений
    - _Requirements: 8.1_
  
  - [x] 5.2 Реализовать детекцию activity changes
    - Добавить метод `detect_activity_changes()` для отслеживания game start/stop и status changes
    - Генерировать `ActivityUpdateMessage` при изменениях
    - Добавить timestamp к каждому событию
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 5.3 Написать property test для activity event generation
    - **Property 4: Activity Event Generation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  
  - [ ] 5.4 Реализовать периодическое обновление statistics
    - Добавить background task для обновления statistics каждые 30 секунд
    - Генерировать `StatisticsUpdateMessage` с message/voice leaderboards
    - Реализовать rate limiting (max 1 update per 30 seconds)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 5.5 Написать property test для statistics rate limiting
    - **Property 7: Statistics Rate Limiting**
    - **Validates: Requirements 3.3**

- [ ] 6. Реализовать heartbeat механизм на бэкенде
  - [ ] 6.1 Добавить heartbeat ping/pong логику
    - Реализовать периодическую отправку ping каждые 30 секунд
    - Отслеживать pong ответы от клиентов
    - Закрывать соединения без pong в течение 10 секунд
    - _Requirements: 7.4, 7.5_
  
  - [ ]* 6.2 Написать property test для heartbeat periodicity
    - **Property 16: Heartbeat Ping Periodicity**
    - **Validates: Requirements 7.4**
  
  - [ ]* 6.3 Написать property test для heartbeat timeout
    - **Property 17: Heartbeat Timeout Disconnection**
    - **Validates: Requirements 7.5**

- [ ] 7. Добавить security и validation на бэкенде
  - [ ] 7.1 Реализовать authentication token validation
    - Добавить функцию `validate_token(token: str)` в `backend/app/auth/token_validator.py`
    - Reject connections с invalid/missing token (401 status)
    - _Requirements: 10.1, 10.2_
  
  - [ ]* 7.2 Написать property test для authentication requirement
    - **Property 26: Authentication Token Requirement**
    - **Validates: Requirements 10.1, 10.2**
  
  - [ ] 7.3 Добавить origin header validation
    - Проверять origin header для предотвращения CSRF
    - Reject unauthorized origins
    - _Requirements: 10.4_
  
  - [ ]* 7.4 Написать property test для origin validation
    - **Property 27: Origin Header Validation**
    - **Validates: Requirements 10.4**
  
  - [ ] 7.4 Добавить message compression для больших сообщений
    - Реализовать gzip compression для сообщений > 1KB
    - _Requirements: 9.4_

- [ ] 8. Checkpoint - Проверить полную функциональность бэкенда
  - Убедиться, что Discord Monitor генерирует корректные updates
  - Проверить heartbeat механизм
  - Проверить security (authentication, origin validation)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Создать WebSocket Client hook на фронтенде
  - [x] 9.1 Создать useWebSocket hook
    - Создать файл `frontend/hooks/useWebSocket.ts`
    - Реализовать базовую логику подключения к WebSocket
    - Добавить authentication token в connection URL
    - Реализовать graceful disconnect при unmount компонента
    - _Requirements: 4.1, 4.2_
  
  - [x] 9.2 Добавить message validation и parsing
    - Реализовать валидацию формата входящих сообщений
    - Парсить JSON и проверять required поля
    - Логировать ошибки для invalid messages и игнорировать их
    - _Requirements: 4.3, 4.4, 7.2_
  
  - [ ]* 9.3 Написать property test для message validation
    - **Property 5: Client Message Processing**
    - **Validates: Requirements 2.5, 4.3, 4.4, 4.5**
  
  - [ ]* 9.4 Написать property test для malformed message resilience
    - **Property 15: Malformed Message Resilience**
    - **Validates: Requirements 7.2**

- [ ] 10. Реализовать state management на фронтенде
  - [ ] 10.1 Добавить обработку initial state message
    - Применять initial state к local state при подключении
    - Обеспечить, что initial state применяется до incremental updates
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 10.2 Написать property test для initial state priority
    - **Property 19: Initial State Priority**
    - **Validates: Requirements 8.2**
  
  - [ ] 10.3 Реализовать обработку activity updates
    - Применять activity_update к local state
    - Обновлять список активных пользователей и их игр/статусов
    - _Requirements: 2.5, 4.5_
  
  - [ ] 10.4 Реализовать обработку statistics updates
    - Полностью заменять старые statistics новыми данными
    - _Requirements: 3.5_
  
  - [ ]* 10.5 Написать property test для statistics replacement
    - **Property 8: Statistics Replacement**
    - **Validates: Requirements 3.5**
  
  - [ ] 10.6 Добавить timestamp-based message ordering
    - Отслеживать timestamp последнего обработанного update
    - Игнорировать messages с более старым timestamp
    - _Requirements: 8.4, 8.5_
  
  - [ ]* 10.7 Написать property test для timestamp ordering
    - **Property 21: Timestamp-Based Message Ordering**
    - **Validates: Requirements 8.4, 8.5**

- [ ] 11. Реализовать Reconnection Handler на фронтенде
  - [ ] 11.1 Создать reconnection логику с exponential backoff
    - Добавить reconnection handler в `useWebSocket` hook
    - Реализовать exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (max)
    - Ограничить количество попыток до 10
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 11.2 Написать property test для exponential backoff
    - **Property 10: Exponential Backoff**
    - **Validates: Requirements 6.2**
  
  - [ ]* 11.3 Написать property test для reconnection attempt limit
    - **Property 11: Reconnection Attempt Limit**
    - **Validates: Requirements 6.3, 7.3**
  
  - [ ] 11.4 Реализовать reset reconnection state при успешном подключении
    - Сбрасывать retry counter и backoff timer при успешном reconnect
    - _Requirements: 6.4_
  
  - [ ]* 11.5 Написать property test для reconnection state reset
    - **Property 12: Reconnection State Reset**
    - **Validates: Requirements 6.4**
  
  - [ ] 11.6 Добавить message queuing во время reconnection
    - Сохранять state changes в очередь во время reconnection
    - Применять все queued changes после успешного reconnect
    - _Requirements: 6.5_
  
  - [ ]* 11.7 Написать property test для message queuing
    - **Property 13: Message Queuing During Reconnection**
    - **Validates: Requirements 6.5**

- [ ] 12. Реализовать fallback на REST API polling
  - [ ] 12.1 Добавить REST API polling механизм
    - Создать функцию `pollDiscordData()` для REST API запросов
    - Активировать polling после исчерпания reconnection попыток
    - Устанавливать интервал polling на 30 секунд
    - _Requirements: 7.3_
  
  - [ ] 12.2 Добавить переключение обратно на WebSocket
    - Периодически проверять доступность WebSocket
    - Переключаться обратно на WebSocket когда он становится доступен

- [ ] 13. Создать Connection Status Indicator компонент
  - [x] 13.1 Создать ConnectionStatusIndicator компонент
    - Создать файл `frontend/components/ConnectionStatusIndicator.tsx`
    - Реализовать отображение трех состояний: connected (зеленый), disconnected (красный), reconnecting (желтый)
    - Добавить иконки для каждого состояния
    - Сделать дизайн минималистичным и неинтрузивным
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 13.2 Написать property test для connection status reflection
    - **Property 9: Connection Status Reflection**
    - **Validates: Requirements 5.4**

- [ ] 14. Checkpoint - Проверить WebSocket клиент и reconnection
  - Убедиться, что клиент корректно подключается и получает updates
  - Проверить reconnection логику с exponential backoff
  - Проверить fallback на REST API polling
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Интегрировать WebSocket с Discord Block компонентом
  - [x] 15.1 Добавить useWebSocket hook в Discord Block
    - Найти существующий Discord Block компонент
    - Интегрировать `useWebSocket` hook
    - Передать callback для обновления state при получении messages
    - _Requirements: 4.1, 4.5_
  
  - [x] 15.2 Добавить Connection Status Indicator в Discord Block UI
    - Разместить `ConnectionStatusIndicator` в верхней части блока
    - Связать с connection status из `useWebSocket` hook
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 15.3 Реализовать UI debouncing для оптимизации
    - Добавить debouncing для re-renders (max 10 FPS / 100ms interval)
    - Использовать `useMemo` или `useCallback` для оптимизации
    - _Requirements: 9.3_
  
  - [ ]* 15.4 Написать property test для UI debouncing
    - **Property 23: UI Update Debouncing**
    - **Validates: Requirements 9.3**

- [ ] 16. Добавить heartbeat pong на фронтенде
  - [x] 16.1 Реализовать обработку ping и отправку pong
    - Добавить обработчик для `ping` messages в `useWebSocket`
    - Автоматически отправлять `pong` response при получении `ping`
    - _Requirements: 7.4, 7.5_

- [ ] 17. Настроить production конфигурацию
  - [ ] 17.1 Настроить WSS (WebSocket over TLS) для production
    - Обновить WebSocket URL для использования `wss://` в production
    - Добавить environment variable для WebSocket URL
    - _Requirements: 10.3_
  
  - [ ] 17.2 Настроить CORS и origin validation
    - Добавить allowed origins в backend configuration
    - Обновить origin validation для production domains
    - _Requirements: 10.4_

- [ ] 18. Final checkpoint - End-to-end тестирование
  - Проверить полный flow: connect → initial state → real-time updates → disconnect
  - Проверить reconnection flow с network simulation
  - Проверить fallback на REST API polling
  - Проверить multi-client broadcast (несколько вкладок браузера)
  - Убедиться, что все security механизмы работают
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Задачи, отмеченные `*`, являются optional и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные requirements для traceability
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases
- Backend использует Python/FastAPI, frontend использует TypeScript/Next.js/React
- Для property-based тестов: backend использует `hypothesis`, frontend использует `fast-check`
