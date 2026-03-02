# Implementation Plan: Game Preferences Onboarding

## Overview

Implement a game preferences onboarding system that displays a modal questionnaire on first Discord OAuth login, saves user preferences to PostgreSQL in JSONB format, and updates game statistics on the homepage. The system includes both frontend (Next.js/TypeScript) and backend (FastAPI/Python) components with full validation and testing.

## Tasks

- [x] 1. Database migration and schema setup
  - [x] 1.1 Create database migration file to add game_preferences column
    - Add JSONB column with DEFAULT NULL to users table
    - Create GIN index on game_preferences for efficient queries
    - Add column comments for documentation
    - Ensure migration is idempotent (IF NOT EXISTS)
    - _Requirements: 3.1, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 1.2 Write property test for migration idempotency
    - **Property: Migration can run multiple times without errors**
    - **Validates: Requirements 7.4**

- [x] 2. Backend data models and validation
  - [x] 2.1 Create Pydantic models for game preferences
    - Implement GamePreferenceItem with game and custom_name fields
    - Implement GamePreferencesRequest with preferences array
    - Implement GameStatistics response model
    - Add field validators for game names (11 valid games)
    - Add validator for custom_name when game is "Другое" (1-50 chars, required)
    - Add validator to ensure custom_name is null for non-"Другое" games
    - Add validator to limit preferences array to max 15 items
    - Add validator to ensure at least one game selected
    - _Requirements: 3.2, 3.3, 3.4, 8.1, 8.2, 8.3, 8.4, 8.6_
  
  - [ ]* 2.2 Write property test for data structure validation
    - **Property 6: Data Structure Validation**
    - **Validates: Requirements 3.3, 3.4, 8.2, 8.3**
  
  - [ ]* 2.3 Write property test for input validation rejection
    - **Property 7: Input Validation Rejects Invalid Data**
    - **Validates: Requirements 2.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
  
  - [ ]* 2.4 Write property test for valid requests
    - **Property 8: Valid Requests Return Success**
    - **Validates: Requirements 2.3**

- [x] 3. Backend service layer for game preferences
  - [x] 3.1 Create GamePreferencesService class
    - Implement save_preferences method (INSERT/UPDATE game_preferences JSONB)
    - Implement get_preferences method (SELECT game_preferences)
    - Implement update_preferences method (UPDATE game_preferences)
    - Implement skip_preferences method (set game_preferences to empty array [])
    - Implement get_game_statistics method (aggregate counts from all users)
    - Add error handling for database connection errors
    - Add error handling for JSON serialization errors
    - _Requirements: 2.2, 2.6, 3.2, 4.2, 4.3, 4.4_
  
  - [ ]* 3.2 Write property test for preferences round-trip persistence
    - **Property 4: Preferences Round-Trip Persistence**
    - **Validates: Requirements 2.2, 3.2, 5.5**
  
  - [ ]* 3.3 Write property test for statistics categorization
    - **Property 9: Statistics Categorization**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  
  - [ ]* 3.4 Write unit tests for GamePreferencesService
    - Test save_preferences with valid data
    - Test skip_preferences sets empty array
    - Test get_game_statistics with various user data
    - Test error handling for database failures

- [x] 4. Backend API routes
  - [x] 4.1 Implement POST /api/users/game-preferences endpoint
    - Accept GamePreferencesRequest in request body
    - Validate JWT token and extract user_id
    - Call GamePreferencesService.save_preferences
    - Return 200 with success message
    - Return 400 for validation errors
    - Return 401 for unauthorized requests
    - Return 500 for server errors
    - _Requirements: 2.1, 2.3, 2.4, 10.1, 10.5_
  
  - [x] 4.2 Implement PUT /api/users/game-preferences endpoint
    - Accept GamePreferencesRequest in request body
    - Validate JWT token and extract user_id
    - Call GamePreferencesService.update_preferences
    - Return 200 with success message
    - Handle same error cases as POST endpoint
    - _Requirements: 5.4, 5.5, 10.3, 10.5_
  
  - [x] 4.3 Update GET /api/users/me endpoint to include game_preferences
    - Add game_preferences field to user response model
    - Return game_preferences as null, empty array, or array of preferences
    - _Requirements: 6.2, 10.2_
  
  - [x] 4.4 Implement GET /api/games/statistics endpoint (public)
    - Call GamePreferencesService.get_game_statistics
    - Return statistics in format: {CS2: int, "DOTA 2": int, VALORANT: int, ДРУГИЕ: int}
    - No authentication required
    - _Requirements: 4.1, 4.5, 10.4, 10.5_
  
  - [ ]* 4.5 Write property test for authorization enforcement
    - **Property 11: Authorization Enforcement**
    - **Validates: Requirements 10.5**
  
  - [ ]* 4.6 Write unit tests for API routes
    - Test POST with valid data returns 200
    - Test POST without token returns 401
    - Test POST with invalid data returns 400
    - Test PUT updates existing preferences
    - Test GET /api/users/me includes game_preferences
    - Test GET /api/games/statistics accessible without token

- [x] 5. Checkpoint - Backend implementation complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 6. Frontend TypeScript interfaces and types
  - [x] 6.1 Create TypeScript interfaces for game preferences
    - Define GamePreference interface (game: string, custom_name: string | null)
    - Define GamePreferencesResponse interface
    - Define UserData interface with game_preferences field
    - Define GameStatistics interface
    - Create constants array for 11 valid game names
    - _Requirements: 1.2, 3.2_

- [-] 7. Frontend GamePreferencesModal component
  - [ ] 7.1 Create GamePreferencesModal component structure
    - Create component with props: isOpen, onClose, onSave, onSkip
    - Set up state: selectedGames (Set<string>), customGameName, isSubmitting, error
    - Implement overlay with backdrop blur
    - Add modal container with responsive width
    - _Requirements: 1.1, 1.6, 9.1, 9.6_
  
  - [ ] 7.2 Implement game selection UI
    - Render 11 game checkboxes in grid layout (2-3 columns desktop, 1-2 mobile)
    - Add visual styling for selected/unselected states
    - Implement checkbox onChange handlers to update selectedGames Set
    - _Requirements: 1.2, 9.2, 9.3_
  
  - [ ] 7.3 Implement custom game input for "Другое"
    - Show/hide text input based on "Другое" checkbox state
    - Add smooth animation (Framer Motion) when showing/hiding
    - Bind input value to customGameName state
    - Add placeholder text and styling
    - _Requirements: 1.3, 9.4_
  
  - [ ] 7.4 Implement save and skip buttons
    - Create "Сохранить" button, disabled when selectedGames is empty
    - Create "Пропустить" button, always enabled
    - Add loading state during submission
    - Style buttons according to site design
    - _Requirements: 1.4, 1.5, 9.5_
  
  - [ ] 7.5 Implement save handler with API integration
    - Build GamePreference[] array from selectedGames and customGameName
    - Send POST request to /api/users/game-preferences
    - Handle success: call onSave callback, close modal
    - Handle errors: display user-friendly error messages
    - Handle network errors, 400, 401, 500 status codes
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [ ] 7.6 Implement skip handler
    - Call onSkip callback without sending API request
    - Close modal
    - _Requirements: 2.5_
  
  - [ ]* 7.7 Write unit tests for GamePreferencesModal
    - Test component renders with 11 checkboxes
    - Test custom input shows when "Другое" selected
    - Test save button disabled with no selection
    - Test save button enabled with selection
    - Test onSave called with correct data structure
    - Test onSkip called without data
    - Test error message display

- [ ] 8. Frontend modal display logic integration
  - [ ] 8.1 Add modal display logic to main layout or auth callback
    - Fetch user data from /api/users/me after Discord OAuth
    - Check if game_preferences === null
    - Show GamePreferencesModal if game_preferences is null
    - Do not show modal if game_preferences is [] or has values
    - _Requirements: 1.1, 6.1, 6.3, 6.4_
  
  - [ ] 8.2 Implement onSave callback
    - Close modal after successful save
    - Optionally refresh user data or update local state
    - _Requirements: 2.2_
  
  - [ ] 8.3 Implement onSkip callback to set empty array
    - Send request to backend to set game_preferences to []
    - Close modal
    - Ensure modal doesn't show on next login
    - _Requirements: 2.6, 6.4_
  
  - [ ]* 8.4 Write property test for modal display logic
    - **Property 1: Modal Display Logic**
    - **Validates: Requirements 1.1, 3.5, 3.6, 6.1, 6.4**
  
  - [ ]* 8.5 Write integration tests for modal display
    - Test modal appears after OAuth with game_preferences=null
    - Test modal does not appear with game_preferences=[]
    - Test modal does not appear with filled game_preferences

- [ ] 9. Frontend ProfileGamePreferences component
  - [ ] 9.1 Create ProfileGamePreferences component
    - Create component with props: currentPreferences, onUpdate
    - Set up state: isEditing, selectedGames, customGameName, isSubmitting
    - Display current preferences in read-only mode
    - _Requirements: 5.1, 5.2_
  
  - [ ] 9.2 Implement edit mode UI
    - Add "Изменить" button to enter edit mode
    - Show same checkbox grid as GamePreferencesModal when editing
    - Pre-populate selectedGames from currentPreferences
    - Add "Сохранить" and "Отмена" buttons in edit mode
    - _Requirements: 5.3_
  
  - [ ] 9.3 Implement update handler with API integration
    - Build GamePreference[] array from edited selections
    - Send PUT request to /api/users/game-preferences
    - Handle success: call onUpdate callback, exit edit mode
    - Handle errors: display error messages
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [ ]* 9.4 Write unit tests for ProfileGamePreferences
    - Test component displays current preferences
    - Test edit mode shows checkboxes
    - Test save sends PUT request
    - Test cancel exits edit mode without saving

- [ ] 10. Frontend game statistics integration
  - [ ] 10.1 Create API client function for fetching statistics
    - Implement fetchGameStatistics function
    - Call GET /api/games/statistics
    - Parse response into GameStatistics type
    - _Requirements: 4.1, 4.5_
  
  - [ ] 10.2 Update Game_Statistics_Block component
    - Fetch statistics on component mount
    - Display CS2, DOTA 2, VALORANT, ДРУГИЕ counts
    - Handle loading and error states
    - Refresh statistics after user saves preferences (optional)
    - _Requirements: 4.6_
  
  - [ ]* 10.3 Write unit tests for statistics display
    - Test statistics fetch on mount
    - Test correct display of counts
    - Test error handling

- [ ] 11. Checkpoint - Frontend implementation complete
  - Ensure all frontend tests pass, ask the user if questions arise.

- [ ] 12. Integration and final wiring
  - [ ] 12.1 Wire all components together
    - Ensure Discord OAuth flow triggers modal check
    - Ensure modal save updates backend and closes modal
    - Ensure skip action sets empty array in backend
    - Ensure profile page can edit preferences
    - Ensure statistics block shows updated counts
    - _Requirements: 1.1, 2.1, 2.6, 5.1, 4.6_
  
  - [ ]* 12.2 Write end-to-end integration tests
    - Test full flow: OAuth → modal → save → statistics update
    - Test skip flow: OAuth → modal → skip → no modal on next login
    - Test edit flow: profile → edit → save → statistics update
  
  - [ ] 12.3 Add error handling and edge cases
    - Handle network failures gracefully
    - Handle concurrent updates (last write wins)
    - Trim whitespace from custom_name
    - Handle special characters in custom_name
    - _Requirements: 2.4, 8.5_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses Python/FastAPI for backend and TypeScript/Next.js for frontend as specified in the design
- Database uses PostgreSQL with JSONB for flexible game preferences storage
- All API endpoints return JSON responses with proper error handling
