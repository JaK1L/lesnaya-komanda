# Design Document: User Profile

## Overview

The user profile feature enables authenticated users to manage their personal information on the "Лесная Команда" website. Users can customize their site nickname (independent from Discord username), upload or set an avatar, write a bio, and control their visibility in public user lists. The feature integrates with the existing Discord OAuth authentication system and PostgreSQL database.

### Key Design Decisions

1. **Separate Site Identity**: Users can maintain a site-specific nickname different from their Discord username, allowing for personalized identity while preserving Discord integration
2. **Dual Avatar Support**: Support both URL-based avatars and file uploads to accommodate different user preferences and workflows
3. **Atomic Updates**: All profile changes are saved in a single database transaction to ensure data consistency
4. **Privacy Control**: Users can hide themselves from public lists while remaining accessible via direct URL to authenticated users
5. **Lunacy Design Consistency**: Profile page follows the established Lunacy design system with dark theme, Unbounded font for headings, and accent green (#4aff75)

### Research Findings

**File Upload Strategy**: For avatar uploads, we'll use FastAPI's `UploadFile` with local filesystem storage. Files will be stored in a `backend/uploads/avatars/` directory with unique filenames (using UUID + original extension) to prevent collisions. The `avatar_url` field will store the relative path that can be served via a static file endpoint.

**Image Validation**: We'll use Python's `Pillow` library to validate image formats (JPEG, PNG, GIF, WebP) and dimensions before saving. This prevents malicious file uploads and ensures consistent image quality.

**Frontend Form Handling**: The profile form will use React's `useState` for local state management and `axios` for API calls. File uploads will use `FormData` to send multipart/form-data requests.

**Authentication Flow**: The existing JWT token system supports both admin users (username/password) and Discord users (OAuth). The profile endpoints will use the `get_current_user` dependency which handles both authentication types, extracting user identity from the JWT token's `sub` and `type` fields.

## Architecture

### System Components

```
┌─────────────────┐
│   Frontend      │
│   /profile      │
│   (Next.js)     │
└────────┬────────┘
         │ HTTP/REST
         │ JWT Token
         ▼
┌─────────────────┐
│   Backend API   │
│   FastAPI       │
│   /api/profile  │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   users table   │
└─────────────────┘
```

### Data Flow

1. **Profile Load**: Frontend requests `/api/profile` with JWT token → Backend validates token → Queries database → Returns user profile data
2. **Profile Update**: Frontend sends PUT request with modified fields → Backend validates data → Updates database in transaction → Returns updated profile
3. **Avatar Upload**: Frontend sends POST with file → Backend validates file → Saves to filesystem → Updates database with file path → Returns new avatar URL

### Authentication Integration

The profile feature leverages the existing authentication system:
- JWT tokens contain `sub` (user identifier) and `type` (authentication method)
- Discord users: `type="discord"`, `sub=discord_id`
- Admin users: `type` is undefined, `sub=username`
- The `get_current_user` dependency extracts user identity and queries the appropriate table

## Components and Interfaces

### Frontend Components

#### ProfilePage Component (`frontend/app/profile/page.tsx`)

Main profile page component with form for editing user data.

**State Management**:
```typescript
interface ProfileData {
  site_nickname: string
  discord_username: string
  avatar_url: string | null
  bio: string
  is_hidden: boolean
  forest_rank: string
  rating: number
  joined_at: string
}

const [profile, setProfile] = useState<ProfileData | null>(null)
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)
const [avatarFile, setAvatarFile] = useState<File | null>(null)
const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
```

**Key Functions**:
- `loadProfile()`: Fetches current user profile from API
- `handleSave()`: Validates and submits profile changes
- `handleAvatarUpload()`: Handles file selection and preview
- `handleAvatarUrlChange()`: Updates avatar URL field

**UI Elements**:
- Text input for site nickname (max 50 chars)
- Avatar display with upload button and URL input
- Textarea for bio (max 500 chars with counter)
- Checkbox for visibility toggle
- Save button with loading state
- Success/error message display

#### Navigation Update

Add "ПРОФИЛЬ" button to navigation bar (visible only when authenticated):

```typescript
{token && (
  <a href="/profile" className="nav-link">ПРОФИЛЬ</a>
)}
```

### Backend Components

#### Profile Router (`backend/app/routes/profile.py`)

New router module for profile endpoints.

**Endpoints**:

1. **GET /api/profile**
   - Authentication: Required (JWT token)
   - Returns: Current user profile data
   - Response: `ProfileResponse` model

2. **PUT /api/profile**
   - Authentication: Required (JWT token)
   - Body: `ProfileUpdate` model
   - Returns: Updated profile data
   - Validates: nickname length, bio length, boolean flags

3. **POST /api/profile/avatar**
   - Authentication: Required (JWT token)
   - Body: Multipart form data with file
   - Returns: New avatar URL
   - Validates: file size (max 5MB), file format (JPEG/PNG/GIF/WebP)

4. **GET /api/uploads/avatars/{filename}**
   - Authentication: Not required (public access)
   - Returns: Static file from uploads directory

#### Profile Service (`backend/app/services/profile_service.py`)

Service layer for profile business logic.

**Methods**:
- `get_user_profile(user_id: int)`: Retrieves profile data from database
- `update_user_profile(user_id: int, data: ProfileUpdate)`: Updates profile fields
- `save_avatar_file(user_id: int, file: UploadFile)`: Validates and saves avatar file
- `delete_old_avatar(user_id: int)`: Removes previous avatar file when replaced

**Validation Logic**:
- Nickname: 1-50 characters, optional (falls back to discord_username)
- Bio: 0-500 characters
- Avatar file: max 5MB, formats JPEG/PNG/GIF/WebP
- Avatar URL: valid URL format or empty

## Data Models

### Database Schema Changes

Add new columns to existing `users` table:

```sql
ALTER TABLE users ADD COLUMN site_nickname VARCHAR(50);
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN is_hidden BOOLEAN DEFAULT false;
```

**Migration Script** (`backend/migrations/add_profile_fields.sql`):
```sql
-- Add profile fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS site_nickname VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Create index for visibility queries
CREATE INDEX IF NOT EXISTS idx_users_is_hidden ON users(is_hidden);
```

### Pydantic Models

#### ProfileResponse (`backend/app/schemas.py`)

```python
class ProfileResponse(BaseModel):
    site_nickname: Optional[str]
    discord_username: str
    avatar_url: Optional[str]
    bio: Optional[str]
    is_hidden: bool
    forest_rank: str
    rating: float
    joined_at: Optional[datetime]
```

#### ProfileUpdate (`backend/app/schemas.py`)

```python
class ProfileUpdate(BaseModel):
    site_nickname: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=500)
    is_hidden: bool = False
    
    @field_validator('site_nickname')
    @classmethod
    def validate_nickname(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v.strip()) == 0:
            return None
        return v
```

### File Storage Structure

```
backend/
  uploads/
    avatars/
      {uuid}_{timestamp}.jpg
      {uuid}_{timestamp}.png
      ...
```

**Filename Format**: `{user_id}_{uuid4}_{timestamp}.{ext}`
- Prevents filename collisions
- Allows tracking user's avatars
- Preserves original file extension


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Profile Field Persistence

*For any* authenticated user and any valid profile field update (site_nickname, avatar_url, bio, is_hidden), when the user saves the profile, the updated value should be persisted to the database and returned in subsequent profile queries.

**Validates: Requirements 3.2, 4.4, 5.2, 6.3**

### Property 2: Avatar File Upload and Storage

*For any* valid image file (JPEG, PNG, GIF, or WebP format, under 5MB), when uploaded as an avatar, the system should store the file, generate a unique filename, update the user's avatar_url in the database, and make the file accessible via the returned URL.

**Validates: Requirements 4.5, 4.6**

### Property 3: Visibility Filtering

*For any* user list query, users with is_hidden=true should be excluded from the results, and users with is_hidden=false should be included in the results.

**Validates: Requirements 6.4, 6.6**

### Property 4: Hidden Profile Direct Access

*For any* authenticated user, when accessing a hidden user's profile via direct URL, the profile data should be returned successfully regardless of the is_hidden flag value.

**Validates: Requirements 6.5**

### Property 5: Transaction Atomicity

*For any* profile update request, if any validation fails, no database fields should be modified; if all validations pass, all fields should be updated in a single atomic transaction.

**Validates: Requirements 7.4, 7.6**

### Property 6: Validation Before Persistence

*For any* profile update request, the backend should validate all fields (nickname length ≤50, bio length ≤500, avatar_url format) before attempting any database modifications.

**Validates: Requirements 7.3**

### Property 7: Unauthenticated Request Rejection

*For any* profile endpoint (GET /api/profile, PUT /api/profile, POST /api/profile/avatar), requests without a valid JWT token should return HTTP 401 Unauthorized status.

**Validates: Requirements 10.4**

### Property 8: User Identification from Token

*For any* authenticated profile request, the backend should correctly identify the user from the JWT token's sub and type fields, and return/update only that user's profile data.

**Validates: Requirements 10.5**

### Property 9: Profile Response Structure

*For any* successful GET /api/profile request, the response should be valid JSON containing all required fields: site_nickname, discord_username, avatar_url, bio, is_hidden, forest_rank, rating, and joined_at.

**Validates: Requirements 10.6**

## Error Handling

### Client-Side Validation

**Input Validation**:
- Site nickname: Trim whitespace, check length (1-50 chars), show inline error if invalid
- Bio: Count characters in real-time, prevent input beyond 500 chars, show warning at 450 chars
- Avatar URL: Basic URL format validation before submission
- Avatar file: Check file size client-side before upload, show error if >5MB

**User Feedback**:
- Display loading spinner during save operations
- Show success toast message on successful save
- Show error toast with specific message on failure
- Disable save button during submission to prevent double-clicks

### Server-Side Error Handling

**Validation Errors** (HTTP 400):
- Invalid nickname length: "Nickname must be between 1 and 50 characters"
- Invalid bio length: "Bio must not exceed 500 characters"
- Invalid avatar URL format: "Invalid avatar URL format"
- Invalid file format: "Avatar must be JPEG, PNG, GIF, or WebP"
- File too large: "Avatar file must be under 5MB"

**Authentication Errors** (HTTP 401):
- Missing token: "Authentication required"
- Invalid token: "Invalid or expired token"
- Token type mismatch: "Invalid authentication method"

**Authorization Errors** (HTTP 403):
- Attempting to modify another user's profile: "Cannot modify other user's profile"

**Database Errors** (HTTP 500):
- Connection failure: "Database connection error, please try again"
- Transaction failure: "Failed to save profile, please try again"
- Constraint violation: "Profile update failed due to data constraint"

**File System Errors** (HTTP 500):
- Upload directory not writable: "Failed to save avatar file"
- Disk space full: "Insufficient storage space for avatar"
- File deletion failure: Log warning but don't fail the request

### Error Recovery

**Retry Strategy**:
- Frontend: Retry failed requests up to 2 times with exponential backoff (1s, 2s)
- Backend: Database transactions automatically rollback on error

**Graceful Degradation**:
- If avatar upload fails, allow user to continue with URL-based avatar
- If old avatar deletion fails, log error but complete the profile update
- If profile load fails, show error message with retry button

## Testing Strategy

### Unit Testing

**Frontend Tests** (Vitest + React Testing Library):
- Profile form rendering with initial data
- Form field validation (nickname length, bio length, URL format)
- Character counter updates for bio field
- File selection and preview functionality
- Save button disabled state during submission
- Success/error message display
- Navigation to profile page when authenticated
- Redirect to login when unauthenticated

**Backend Tests** (pytest):
- Profile endpoint authentication checks
- Profile data retrieval for valid user
- Profile update with valid data
- Validation error responses for invalid data
- Avatar file upload with valid file
- Avatar file rejection for invalid format/size
- Transaction rollback on validation failure
- User identification from JWT token

### Property-Based Testing

Property-based tests will use **fast-check** (TypeScript) for frontend and **Hypothesis** (Python) for backend, with minimum 100 iterations per test.

**Frontend Properties**:

1. **Character Counter Accuracy**
   - *For any* bio text input, the displayed character count should equal the actual text length
   - Tag: **Feature: user-profile, Property: Character counter matches text length**

2. **Form State Consistency**
   - *For any* sequence of form field updates, the form state should accurately reflect all changes
   - Tag: **Feature: user-profile, Property: Form state reflects all field changes**

**Backend Properties**:

1. **Profile Field Persistence** (Property 1)
   - *For any* valid profile update, saving and then retrieving should return the same values
   - Tag: **Feature: user-profile, Property 1: Profile field persistence**

2. **Avatar Upload Round-Trip** (Property 2)
   - *For any* valid image file, uploading and then retrieving via the returned URL should return the same image data
   - Tag: **Feature: user-profile, Property 2: Avatar file upload and storage**

3. **Visibility Filtering** (Property 3)
   - *For any* set of users with mixed is_hidden values, public list queries should only return users with is_hidden=false
   - Tag: **Feature: user-profile, Property 3: Visibility filtering**

4. **Hidden Profile Access** (Property 4)
   - *For any* hidden user, authenticated direct profile access should succeed
   - Tag: **Feature: user-profile, Property 4: Hidden profile direct access**

5. **Transaction Atomicity** (Property 5)
   - *For any* profile update with one invalid field, no fields should be updated in the database
   - Tag: **Feature: user-profile, Property 5: Transaction atomicity**

6. **Validation Before Persistence** (Property 6)
   - *For any* profile update request, validation errors should be returned before any database queries are executed
   - Tag: **Feature: user-profile, Property 6: Validation before persistence**

7. **Unauthenticated Rejection** (Property 7)
   - *For any* profile endpoint, requests without valid JWT should return 401
   - Tag: **Feature: user-profile, Property 7: Unauthenticated request rejection**

8. **User Identification** (Property 8)
   - *For any* valid JWT token, the extracted user ID should match the user in the database
   - Tag: **Feature: user-profile, Property 8: User identification from token**

9. **Response Structure** (Property 9)
   - *For any* successful profile retrieval, the response should contain all required fields with correct types
   - Tag: **Feature: user-profile, Property 9: Profile response structure**

### Integration Testing

**End-to-End Scenarios**:
1. Complete profile update flow: Load profile → Edit fields → Save → Verify changes
2. Avatar upload flow: Select file → Upload → Verify display → Verify persistence
3. Visibility toggle flow: Hide profile → Verify not in public list → Verify direct access works
4. Authentication flow: Access profile while authenticated → Logout → Verify redirect on profile access

**Test Data**:
- Create test users with various profile states (complete, partial, empty)
- Generate test images in all supported formats
- Test with edge cases: maximum length strings, boundary file sizes, special characters

### Performance Testing

**Load Testing**:
- Profile page load time: <500ms for initial render
- Profile save operation: <1s for database update
- Avatar upload: <3s for 5MB file
- Concurrent users: Support 100 simultaneous profile updates

**Optimization Targets**:
- Database queries: Use indexes on user_id and is_hidden
- File uploads: Stream files to disk without loading fully into memory
- Frontend: Lazy load avatar preview, debounce character counter updates
