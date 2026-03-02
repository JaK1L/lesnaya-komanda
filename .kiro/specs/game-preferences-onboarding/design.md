# Design Document: Game Preferences Onboarding

## Overview

Система опросника игровых предпочтений при первом входе через Discord OAuth позволяет новым пользователям выбрать игры, в которые они играют, при первой авторизации. Выбранные предпочтения сохраняются в базе данных PostgreSQL и используются для обновления статистики игр на главной странице.

### Цели дизайна

- Создать интуитивный UX для сбора игровых предпочтений при первом входе
- Обеспечить надежное хранение данных в формате JSONB
- Предоставить API для управления предпочтениями
- Обновлять статистику игр в реальном времени
- Поддерживать редактирование предпочтений в профиле пользователя

### Технологический стек

- **Backend**: FastAPI (Python), asyncpg для работы с PostgreSQL
- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS, Framer Motion
- **Database**: PostgreSQL с JSONB полем для хранения предпочтений
- **Authentication**: JWT токены через Discord OAuth

## Architecture

### Общая архитектура

Система следует трехуровневой архитектуре:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ GamePreferences  │  │  Profile Page                │ │
│  │ Modal Component  │  │  (Edit Preferences)          │ │
│  └──────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │ HTTP/JSON
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend API (FastAPI)                  │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Game Preferences │  │  Statistics                  │ │
│  │ Routes           │  │  Routes                      │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Validation       │  │  User Service                │ │
│  │ Schemas          │  │                              │ │
│  └──────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │ asyncpg
                          ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  users table                                      │  │
│  │  - game_preferences JSONB                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Поток данных

1. **Первый вход пользователя**:
   - Discord OAuth → Backend создает/обновляет пользователя
   - Backend редиректит на Frontend с JWT токеном
   - Frontend проверяет `game_preferences === null`
   - Показывает модальное окно опросника

2. **Сохранение предпочтений**:
   - User выбирает игры → Frontend отправляет POST запрос
   - Backend валидирует данные → Сохраняет в JSONB
   - Frontend закрывает модальное окно

3. **Обновление статистики**:
   - Frontend запрашивает GET `/api/games/statistics`
   - Backend подсчитывает игроков по играм из `game_preferences`
   - Frontend отображает обновленные данные

## Components and Interfaces

### Frontend Components

#### 1. GamePreferencesModal

Модальное окно для выбора игровых предпочтений.

**Props**:
```typescript
interface GamePreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (preferences: GamePreference[]) => Promise<void>
  onSkip: () => Promise<void>
}
```

**State**:
```typescript
interface GamePreferencesState {
  selectedGames: Set<string>
  customGameName: string
  isSubmitting: boolean
  error: string | null
}
```

**Behavior**:
- Отображается как overlay с блокировкой фона
- Содержит чекбоксы для 11 игр в grid layout (2-3 колонки на desktop, 1-2 на mobile)
- При выборе "Другое" показывает текстовое поле с анимацией
- Кнопка "Сохранить" активна только при выборе хотя бы одной игры
- Кнопка "Пропустить" всегда активна

#### 2. ProfileGamePreferences

Компонент для редактирования предпочтений в профиле.

**Props**:
```typescript
interface ProfileGamePreferencesProps {
  currentPreferences: GamePreference[]
  onUpdate: (preferences: GamePreference[]) => Promise<void>
}
```

**State**:
```typescript
interface ProfileGamePreferencesState {
  isEditing: boolean
  selectedGames: Set<string>
  customGameName: string
  isSubmitting: boolean
}
```

### Backend Routes

#### 1. POST /api/users/game-preferences

Сохранение игровых предпочтений пользователя.

**Request**:
```python
class GamePreferenceItem(BaseModel):
    game: str
    custom_name: Optional[str] = None

class GamePreferencesRequest(BaseModel):
    preferences: List[GamePreferenceItem]
```

**Response**:
```python
{
  "status": "success",
  "message": "Game preferences saved"
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 500: Server error

#### 2. GET /api/users/me

Получение данных текущего пользователя.

**Response**:
```python
{
  "discord_id": int,
  "discord_username": str,
  "game_preferences": List[GamePreferenceItem] | None,
  "forest_rank": str,
  "rating": float,
  ...
}
```

#### 3. PUT /api/users/game-preferences

Обновление игровых предпочтений.

**Request/Response**: Аналогично POST эндпоинту.

#### 4. GET /api/games/statistics

Получение статистики игроков по играм (публичный эндпоинт).

**Response**:
```python
{
  "CS2": int,
  "DOTA 2": int,
  "VALORANT": int,
  "ДРУГИЕ": int
}
```

### Backend Services

#### GamePreferencesService

Сервис для работы с игровыми предпочтениями.

**Methods**:
```python
class GamePreferencesService:
    async def save_preferences(
        self, 
        user_id: int, 
        preferences: List[GamePreferenceItem]
    ) -> None
    
    async def get_preferences(
        self, 
        user_id: int
    ) -> List[GamePreferenceItem] | None
    
    async def update_preferences(
        self, 
        user_id: int, 
        preferences: List[GamePreferenceItem]
    ) -> None
    
    async def skip_preferences(
        self, 
        user_id: int
    ) -> None
    
    async def get_game_statistics(self) -> Dict[str, int]
```

## Data Models

### Database Schema

#### Migration: add_game_preferences.sql

```sql
-- Add game_preferences field to users table
-- Migration: add_game_preferences
-- Date: 2024

-- Add JSONB column for storing game preferences
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS game_preferences JSONB DEFAULT NULL;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_game_preferences 
  ON users USING GIN (game_preferences);

-- Comments for documentation
COMMENT ON COLUMN users.game_preferences IS 
  'Array of game preference objects with structure: 
   [{"game": "CS2", "custom_name": null}, {"game": "Другое", "custom_name": "Minecraft"}]
   NULL = user has not completed survey
   [] = user skipped survey';
```

### JSONB Structure

**Format**:
```json
[
  {
    "game": "CS2",
    "custom_name": null
  },
  {
    "game": "DOTA 2",
    "custom_name": null
  },
  {
    "game": "Другое",
    "custom_name": "Minecraft"
  }
]
```

**States**:
- `NULL`: Пользователь не проходил опросник (показываем модальное окно)
- `[]`: Пользователь пропустил опросник (не показываем модальное окно)
- `[{...}]`: Пользователь заполнил опросник

**Valid game values**:
- CS2
- DOTA 2
- VALORANT
- PUBG
- Apex Legends
- League of Legends
- Overwatch 2
- Fortnite
- Minecraft
- GTA V
- Другое

### Pydantic Models

```python
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class GamePreferenceItem(BaseModel):
    game: str
    custom_name: Optional[str] = None
    
    @field_validator("game")
    @classmethod
    def validate_game(cls, v: str) -> str:
        valid_games = [
            "CS2", "DOTA 2", "VALORANT", "PUBG", 
            "Apex Legends", "League of Legends", 
            "Overwatch 2", "Fortnite", "Minecraft", 
            "GTA V", "Другое"
        ]
        if v not in valid_games:
            raise ValueError(f"Game must be one of: {', '.join(valid_games)}")
        return v
    
    @field_validator("custom_name")
    @classmethod
    def validate_custom_name(cls, v: Optional[str], info) -> Optional[str]:
        game = info.data.get("game")
        if game == "Другое":
            if not v or len(v.strip()) == 0:
                raise ValueError("custom_name is required when game is 'Другое'")
            if len(v) > 50:
                raise ValueError("custom_name must be 50 characters or less")
            return v.strip()
        return None

class GamePreferencesRequest(BaseModel):
    preferences: List[GamePreferenceItem] = Field(..., max_length=15)
    
    @field_validator("preferences")
    @classmethod
    def validate_preferences_not_empty(cls, v: List[GamePreferenceItem]) -> List[GamePreferenceItem]:
        if len(v) == 0:
            raise ValueError("At least one game must be selected")
        return v

class GameStatistics(BaseModel):
    CS2: int = 0
    DOTA_2: int = 0
    VALORANT: int = 0
    OTHER: int = 0
```

### TypeScript Interfaces

```typescript
interface GamePreference {
  game: string
  custom_name: string | null
}

interface GamePreferencesResponse {
  status: string
  message: string
}

interface UserData {
  discord_id: number
  discord_username: string
  game_preferences: GamePreference[] | null
  forest_rank: string
  rating: number
  avatar_url: string | null
}

interface GameStatistics {
  CS2: number
  "DOTA 2": number
  VALORANT: number
  ДРУГИЕ: number
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Modal Display Logic

*For any* user authentication response where `game_preferences` is `NULL`, the frontend SHALL display the Game_Preferences_Modal. *For any* user authentication response where `game_preferences` is not `NULL` (either empty array or filled array), the frontend SHALL NOT display the Game_Preferences_Modal.

**Validates: Requirements 1.1, 3.5, 3.6, 6.1, 6.4**

### Property 2: Custom Game Field Visibility

*For any* UI state where the "Другое" checkbox is selected, the custom game name text field SHALL be visible and enabled. *For any* UI state where the "Другое" checkbox is not selected, the custom game name text field SHALL be hidden or disabled.

**Validates: Requirements 1.3**

### Property 3: Save Button Enablement

*For any* UI state where at least one game is selected, the "Сохранить" button SHALL be enabled. *For any* UI state where no games are selected, the "Сохранить" button SHALL be disabled.

**Validates: Requirements 9.5**

### Property 4: Preferences Round-Trip Persistence

*For any* valid set of game preferences, after saving to the database and retrieving the user data, the returned `game_preferences` SHALL be equivalent to the saved preferences (preserving game names, custom names, and array order).

**Validates: Requirements 2.2, 3.2, 5.5**

### Property 5: Skip Action Sets Empty Array

*For any* user who clicks "Пропустить", the backend SHALL set `game_preferences` to an empty JSON array `[]`, and subsequent authentication SHALL NOT trigger the modal display.

**Validates: Requirements 2.6**

### Property 6: Data Structure Validation

*For any* game preference object in the `game_preferences` array:
- If `game` equals "Другое", then `custom_name` SHALL be a non-empty string with length between 1 and 50 characters
- If `game` does not equal "Другое", then `custom_name` SHALL be `null`
- The `game` field SHALL be one of the 11 valid game names

**Validates: Requirements 3.3, 3.4, 8.2, 8.3**

### Property 7: Input Validation Rejects Invalid Data

*For any* request to save game preferences that violates validation rules (not an array, missing required fields, invalid game names, invalid custom_name for "Другое", more than 15 games), the backend SHALL return HTTP status 400 with an error message describing the validation failure.

**Validates: Requirements 2.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 8: Valid Requests Return Success

*For any* valid game preferences request (1-15 games, all fields valid, proper structure), the backend SHALL return HTTP status 200 and successfully save the data.

**Validates: Requirements 2.3**

### Property 9: Statistics Categorization

*For any* set of users with game preferences, the statistics endpoint SHALL:
- Count each user who selected "CS2", "DOTA 2", or "VALORANT" in the respective game's counter
- Count each user who selected "PUBG", "Apex Legends", "League of Legends", "Overwatch 2", "Fortnite", "Minecraft", "GTA V", or "Другое" in the "ДРУГИЕ" counter
- Ensure the sum of all individual game selections across all users equals the sum of all counters

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 10: User Data Response Includes Preferences

*For any* authenticated request to `/api/users/me`, the response SHALL include the `game_preferences` field with its current value (NULL, empty array, or array of preferences).

**Validates: Requirements 6.2, 10.2**

### Property 11: Authorization Enforcement

*For any* request to `/api/users/game-preferences` (POST or PUT) or `/api/users/me` without a valid JWT token, the backend SHALL return HTTP status 401. *For any* request to `/api/games/statistics` (with or without token), the backend SHALL return data successfully.

**Validates: Requirements 10.5**

### Property 12: JSON Response Format

*For any* successful API response, the Content-Type header SHALL be "application/json" and the response body SHALL be valid JSON that can be parsed without errors.

**Validates: Requirements 10.6**

### Property 13: Frontend API Integration

*For any* save action in the GamePreferencesModal or ProfileGamePreferences component, the frontend SHALL send a POST or PUT request to the backend with the selected games in the correct JSON format matching the `GamePreferencesRequest` schema.

**Validates: Requirements 2.1, 5.4**

## Error Handling

### Frontend Error Handling

**Network Errors**:
- Display user-friendly error message in modal: "Не удалось сохранить предпочтения. Проверьте подключение к интернету."
- Keep modal open to allow retry
- Log error to console for debugging

**Validation Errors (400)**:
- Parse error message from backend response
- Display specific validation error to user
- Highlight invalid fields if applicable

**Authentication Errors (401)**:
- Redirect to login page
- Clear stored JWT token
- Display message: "Сессия истекла. Пожалуйста, войдите снова."

**Server Errors (500)**:
- Display generic error message: "Произошла ошибка на сервере. Попробуйте позже."
- Log full error details to console
- Provide "Попробовать снова" button

### Backend Error Handling

**Database Connection Errors**:
```python
try:
    async with db.get_connection() as conn:
        # database operations
except asyncpg.PostgresError as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(
        status_code=500,
        detail="Database connection error"
    )
```

**Validation Errors**:
```python
try:
    preferences = GamePreferencesRequest(**request_data)
except ValidationError as e:
    raise HTTPException(
        status_code=400,
        detail={"error": "Validation failed", "details": e.errors()}
    )
```

**User Not Found**:
```python
user = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
if not user:
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )
```

**JSON Serialization Errors**:
```python
try:
    preferences_json = json.dumps(preferences)
except (TypeError, ValueError) as e:
    logger.error(f"JSON serialization error: {e}")
    raise HTTPException(
        status_code=500,
        detail="Failed to serialize preferences"
    )
```

### Error Response Format

All error responses follow consistent format:

```json
{
  "detail": {
    "error": "Error type",
    "message": "Human-readable error message",
    "details": {} // Optional additional context
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, UI component rendering, and integration points
- **Property tests**: Verify universal properties across all inputs using randomized data

### Property-Based Testing

**Library**: `fast-check` for TypeScript/JavaScript, `hypothesis` for Python (if needed)

**Configuration**: Minimum 100 iterations per property test

**Test Tagging**: Each property test MUST include a comment referencing the design property:
```typescript
// Feature: game-preferences-onboarding, Property 1: Modal Display Logic
```

**Property Tests to Implement**:

1. **Property 1 - Modal Display Logic**
   - Generate random user objects with various `game_preferences` states (null, [], filled)
   - Verify modal display logic matches specification

2. **Property 4 - Preferences Round-Trip**
   - Generate random valid game preference arrays
   - Save to database, retrieve, compare for equality

3. **Property 6 - Data Structure Validation**
   - Generate random game preference objects
   - Verify custom_name rules for "Другое" vs other games

4. **Property 7 - Input Validation Rejects Invalid Data**
   - Generate random invalid inputs (wrong types, invalid games, too many items, invalid custom_name)
   - Verify all return 400 status

5. **Property 8 - Valid Requests Return Success**
   - Generate random valid game preference arrays (1-15 items)
   - Verify all return 200 status

6. **Property 9 - Statistics Categorization**
   - Generate random sets of users with various game preferences
   - Verify statistics counters match expected categorization

7. **Property 11 - Authorization Enforcement**
   - Generate random requests with/without valid tokens
   - Verify authorization behavior for each endpoint

### Unit Testing

**Frontend Unit Tests** (Vitest + React Testing Library):

1. **GamePreferencesModal Component**:
   - Renders with correct title and 11 checkboxes
   - Shows custom game input when "Другое" is selected
   - Save button disabled when no games selected
   - Calls onSave with correct data structure
   - Calls onSkip without sending data

2. **ProfileGamePreferences Component**:
   - Displays current preferences correctly
   - Enters edit mode on "Изменить" click
   - Sends PUT request with updated preferences

3. **Integration Tests**:
   - Modal appears after Discord OAuth with game_preferences=null
   - Modal does not appear with game_preferences=[] or filled
   - Statistics block updates after preferences saved

**Backend Unit Tests** (pytest):

1. **Validation Tests**:
   - Valid preferences pass validation
   - Invalid game names rejected
   - "Другое" without custom_name rejected
   - custom_name > 50 chars rejected
   - More than 15 games rejected

2. **Database Tests**:
   - Save preferences creates correct JSONB
   - Retrieve preferences returns correct structure
   - Update preferences modifies existing data
   - Skip sets empty array

3. **Statistics Tests**:
   - Empty database returns all zeros
   - Single user with CS2 increments CS2 counter
   - User with "Другое" increments ДРУГИЕ counter
   - Multiple users aggregate correctly

4. **Authorization Tests**:
   - Requests without token return 401
   - Requests with invalid token return 401
   - Statistics endpoint accessible without token

### Edge Cases to Test

1. **Empty custom_name for "Другое"**: Should be rejected
2. **Whitespace-only custom_name**: Should be rejected or trimmed
3. **Duplicate game selections**: Should be handled (deduplicated or rejected)
4. **Very long custom_name (>50 chars)**: Should be rejected
5. **Special characters in custom_name**: Should be accepted
6. **Concurrent updates**: Last write wins
7. **Database connection loss during save**: Should return 500
8. **Malformed JSON in request**: Should return 400

### Migration Testing

1. **Forward Migration**:
   - Run migration on database with existing users
   - Verify game_preferences column exists
   - Verify all existing users have game_preferences=NULL
   - Verify GIN index created

2. **Rollback Migration**:
   - Run rollback
   - Verify game_preferences column removed
   - Verify other user data intact

3. **Idempotency**:
   - Run migration twice
   - Verify no errors, same result

### Manual Testing Checklist

- [ ] Modal appears on first Discord login
- [ ] Modal does not appear on subsequent logins
- [ ] All 11 games display correctly
- [ ] Custom game input appears when "Другое" selected
- [ ] Save button disabled with no selection
- [ ] Save button enabled with selection
- [ ] Skip button closes modal without saving
- [ ] Preferences save successfully
- [ ] Statistics update after save
- [ ] Profile page shows saved preferences
- [ ] Edit preferences works correctly
- [ ] Mobile responsive layout works
- [ ] Animations smooth and performant

