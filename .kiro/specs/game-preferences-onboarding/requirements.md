# Requirements Document

## Introduction

Система опросника игровых предпочтений при первом входе через Discord OAuth. Функция позволяет новым пользователям выбрать игры, в которые они играют, при первой авторизации на сайте. Выбранные предпочтения сохраняются в базе данных и используются для обновления статистики в блоке "ВО ЧТО ИГРАЕМ" на главной странице.

## Glossary

- **Game_Preferences_Modal**: Модальное окно с опросником игровых предпочтений
- **User**: Пользователь, авторизованный через Discord OAuth
- **Game_Statistics_Block**: Блок "ВО ЧТО ИГРАЕМ" на главной странице с количеством игроков по играм
- **Database**: PostgreSQL база данных с таблицей users
- **Backend_API**: FastAPI сервер, обрабатывающий запросы
- **Frontend**: Next.js приложение
- **First_Login**: Первый вход пользователя через Discord OAuth (когда поле game_preferences равно NULL)

## Requirements

### Requirement 1: Отображение опросника при первом входе

**User Story:** Как новый пользователь, я хочу видеть опросник игр при первом входе, чтобы указать свои игровые предпочтения.

#### Acceptance Criteria

1. WHEN User завершает Discord OAuth авторизацию AND game_preferences поле равно NULL, THE Frontend SHALL отобразить Game_Preferences_Modal
2. THE Game_Preferences_Modal SHALL содержать список из 11 игр с чекбоксами: CS2, DOTA 2, VALORANT, PUBG, Apex Legends, League of Legends, Overwatch 2, Fortnite, Minecraft, GTA V, Другое
3. WHERE User выбирает "Другое", THE Game_Preferences_Modal SHALL отобразить текстовое поле для ввода названия игры
4. THE Game_Preferences_Modal SHALL содержать кнопку "Сохранить" для подтверждения выбора
5. THE Game_Preferences_Modal SHALL содержать кнопку "Пропустить" для закрытия без сохранения
6. THE Game_Preferences_Modal SHALL блокировать взаимодействие с остальной частью страницы (overlay)

### Requirement 2: Сохранение игровых предпочтений

**User Story:** Как пользователь, я хочу, чтобы мой выбор игр сохранялся в системе, чтобы не заполнять опросник повторно.

#### Acceptance Criteria

1. WHEN User нажимает кнопку "Сохранить", THE Frontend SHALL отправить выбранные игры в Backend_API
2. THE Backend_API SHALL сохранить выбранные игры в поле game_preferences таблицы users в формате JSONB
3. THE Backend_API SHALL вернуть статус 200 при успешном сохранении
4. IF сохранение не удалось, THEN THE Backend_API SHALL вернуть статус ошибки и сообщение
5. WHEN User нажимает кнопку "Пропустить", THE Frontend SHALL закрыть Game_Preferences_Modal без отправки данных в Backend_API
6. WHEN User нажимает "Пропустить", THE Backend_API SHALL установить game_preferences в пустой массив JSON для предотвращения повторного показа опросника

### Requirement 3: Структура данных игровых предпочтений

**User Story:** Как разработчик, я хочу иметь четкую структуру данных для игровых предпочтений, чтобы обеспечить консистентность системы.

#### Acceptance Criteria

1. THE Database SHALL содержать поле game_preferences типа JSONB в таблице users
2. THE game_preferences поле SHALL хранить массив объектов с полями: game (строка), custom_name (строка или null)
3. WHERE game равно "Другое", THE custom_name SHALL содержать название игры, указанное пользователем
4. WHERE game не равно "Другое", THE custom_name SHALL быть null
5. WHEN game_preferences равно NULL, THE User SHALL считаться не прошедшим опросник
6. WHEN game_preferences равно пустому массиву, THE User SHALL считаться пропустившим опросник

### Requirement 4: Обновление статистики игр

**User Story:** Как посетитель сайта, я хочу видеть актуальную статистику игроков по играм, чтобы понимать популярность игр в сообществе.

#### Acceptance Criteria

1. THE Backend_API SHALL предоставить endpoint для получения статистики игроков по играм
2. THE Backend_API SHALL подсчитывать количество пользователей для каждой игры на основе поля game_preferences
3. WHERE User выбрал игру из списка (CS2, DOTA 2, VALORANT), THE Backend_API SHALL увеличить счетчик для этой игры на 1
4. WHERE User выбрал "Другое" или игру не из основного списка (PUBG, Apex Legends, League of Legends, Overwatch 2, Fortnite, Minecraft, GTA V), THE Backend_API SHALL увеличить счетчик для категории "ДРУГИЕ" на 1
5. THE Frontend SHALL запрашивать статистику при загрузке главной страницы
6. THE Game_Statistics_Block SHALL отображать актуальные данные из Backend_API

### Requirement 5: Редактирование игровых предпочтений в профиле

**User Story:** Как пользователь, я хочу изменить свои игровые предпочтения в профиле, чтобы актуализировать информацию при смене игр.

#### Acceptance Criteria

1. THE Frontend SHALL отображать раздел "Игровые предпочтения" на странице профиля пользователя
2. THE Frontend SHALL отображать текущие выбранные игры пользователя
3. WHEN User нажимает кнопку "Изменить", THE Frontend SHALL отобразить интерфейс редактирования с чекбоксами
4. WHEN User сохраняет изменения, THE Frontend SHALL отправить обновленные данные в Backend_API
5. THE Backend_API SHALL обновить поле game_preferences для пользователя
6. THE Frontend SHALL обновить отображение после успешного сохранения

### Requirement 6: Однократный показ опросника

**User Story:** Как пользователь, я не хочу видеть опросник при каждом входе, чтобы не тратить время на повторное заполнение.

#### Acceptance Criteria

1. WHEN User входит в систему AND game_preferences не равно NULL, THE Frontend SHALL не отображать Game_Preferences_Modal
2. THE Backend_API SHALL возвращать информацию о статусе заполнения опросника в ответе на запрос данных пользователя
3. THE Frontend SHALL проверять статус заполнения опросника при каждой загрузке главной страницы после авторизации
4. WHEN User пропустил опросник (game_preferences равно пустому массиву), THE Frontend SHALL не отображать Game_Preferences_Modal при последующих входах

### Requirement 7: Миграция базы данных

**User Story:** Как администратор системы, я хочу безопасно добавить новое поле в базу данных, чтобы не потерять существующие данные пользователей.

#### Acceptance Criteria

1. THE Database SHALL выполнить миграцию для добавления поля game_preferences типа JSONB в таблицу users
2. THE миграция SHALL установить значение NULL для поля game_preferences у всех существующих пользователей
3. THE миграция SHALL быть обратимой (rollback должен удалить поле game_preferences)
4. THE миграция SHALL выполниться без ошибок на существующей базе данных
5. THE миграция SHALL сохранить все существующие данные в таблице users

### Requirement 8: Валидация данных

**User Story:** Как разработчик, я хочу валидировать входящие данные, чтобы предотвратить сохранение некорректной информации.

#### Acceptance Criteria

1. THE Backend_API SHALL проверять, что game_preferences является массивом объектов
2. THE Backend_API SHALL проверять, что каждый объект содержит поле game типа строка
3. THE Backend_API SHALL проверять, что game является одним из допустимых значений: CS2, DOTA 2, VALORANT, PUBG, Apex Legends, League of Legends, Overwatch 2, Fortnite, Minecraft, GTA V, Другое
4. WHERE game равно "Другое", THE Backend_API SHALL проверять, что custom_name не пустое и содержит от 1 до 50 символов
5. IF валидация не прошла, THEN THE Backend_API SHALL вернуть статус 400 с описанием ошибки
6. THE Backend_API SHALL ограничить максимальное количество выбранных игр до 15

### Requirement 9: Пользовательский интерфейс опросника

**User Story:** Как пользователь, я хочу видеть понятный и удобный интерфейс опросника, чтобы легко выбрать свои игры.

#### Acceptance Criteria

1. THE Game_Preferences_Modal SHALL отображать заголовок "Выберите игры, в которые вы играете"
2. THE Game_Preferences_Modal SHALL отображать чекбоксы в виде сетки (2-3 колонки на десктопе, 1-2 на мобильных)
3. THE Game_Preferences_Modal SHALL визуально выделять выбранные чекбоксы
4. WHERE User выбирает "Другое", THE текстовое поле SHALL появляться с плавной анимацией
5. THE кнопка "Сохранить" SHALL быть активна только когда выбрана хотя бы одна игра
6. THE Game_Preferences_Modal SHALL быть адаптивным для мобильных устройств
7. THE Game_Preferences_Modal SHALL соответствовать дизайну сайта (цветовая схема, шрифты)

### Requirement 10: API эндпоинты

**User Story:** Как фронтенд разработчик, я хочу иметь четкие API эндпоинты для работы с игровыми предпочтениями, чтобы интегрировать функционал.

#### Acceptance Criteria

1. THE Backend_API SHALL предоставить POST эндпоинт /api/users/game-preferences для сохранения предпочтений
2. THE Backend_API SHALL предоставить GET эндпоинт /api/users/me для получения данных текущего пользователя включая game_preferences
3. THE Backend_API SHALL предоставить PUT эндпоинт /api/users/game-preferences для обновления предпочтений
4. THE Backend_API SHALL предоставить GET эндпоинт /api/games/statistics для получения статистики игроков по играм
5. THE Backend_API SHALL требовать JWT авторизацию для всех эндпоинтов кроме /api/games/statistics
6. THE Backend_API SHALL возвращать данные в формате JSON
