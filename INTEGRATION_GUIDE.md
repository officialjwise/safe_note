# Backend-Frontend Integration Guide

## Overview
The frontend (React Native/Expo) is now fully integrated with the backend FastAPI server. All API calls are managed through a centralized `apiClient` service that handles authentication, token management, and error handling.

## Architecture

### API Client (`src/services/apiClient.ts`)
- Centralized HTTP client using axios
- Automatic JWT token management via interceptors
- Secure token storage in `expo-secure-store` (encrypted)
- Automatic token refresh via `/auth/refresh` endpoint
- Consistent error handling across all endpoints

### Redux Integration
The app uses Redux for state management with async thunks that dispatch API calls:

#### Auth Flow (`src/store/slices/authSlice.ts`)
- **`loginThunk`**: POST `/auth/login` with email/password
- **`registerThunk`**: POST `/auth/register`, then automatically logs in
- **`logoutThunk`**: POST `/auth/logout`, clears tokens
- **`refreshTokenThunk`**: Handles token refresh (automatic via interceptors)
- **`checkAuthThunk`**: Verifies session on app startup

#### Notes Flow (`src/store/slices/notesSlice.ts`)
- **`fetchNotesThunk`**: GET `/notes` with optional search
- **`createNoteThunk`**: POST `/notes` with title and content
- **`updateNoteThunk`**: PUT `/notes/{id}` with new content
- **`deleteNoteThunk`**: DELETE `/notes/{id}`
- **`searchNotesThunk`**: GET `/notes?search=query` for searching

### Configuration
API endpoints are configured in `src/constants/environment.ts`:

```typescript
const ENV = {
  dev: {
    API_BASE_URL: 'http://localhost:8000/api/v1',  // Local development
    DEBUG: true,
  },
  prod: {
    API_BASE_URL: 'https://api.securenotes.app/api/v1',  // Production
    DEBUG: false,
  },
};
```

Development uses `http://localhost:8000` - **make sure the backend is running on this port**.

## API Endpoints

### Authentication
```
POST   /auth/register      - Create new account
POST   /auth/login         - Authenticate user
POST   /auth/refresh       - Refresh access token
POST   /auth/logout        - Invalidate tokens
```

### Notes (require JWT token)
```
GET    /notes              - List all notes (with optional ?search=query)
POST   /notes              - Create new note
GET    /notes/{id}         - Retrieve encrypted note
PUT    /notes/{id}         - Update note content
DELETE /notes/{id}         - Delete note
```

### Health
```
GET    /health             - Server health check
```

## Request/Response Flow

### Login Example
```typescript
// Frontend
const response = await apiClient.login('user@example.com', 'Password123!');

// API Call Flow:
1. POST http://localhost:8000/api/v1/auth/login
   {
     "email": "user@example.com",
     "password": "Password123!"
   }

2. Server Response:
   {
     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "token_type": "bearer",
     "expires_in": 900
   }

3. Client stores tokens in secure storage (expo-secure-store)
```

### Protected Request Example
```typescript
// Frontend
const notes = await apiClient.getNotes();

// API Call Flow:
1. Interceptor adds header: Authorization: Bearer {accessToken}
2. GET http://localhost:8000/api/v1/notes
3. Server validates JWT token
4. Returns encrypted notes:
   [
     {
       "id": "uuid",
       "title": "My Note",
       "content": "encrypted_content_AES256GCM",
       "created_at": "2026-03-15T...",
       "updated_at": "2026-03-15T..."
     }
   ]
```

## Error Handling

### 401 Unauthorized (Token Expired)
The apiClient automatically handles this:
1. Detects 401 response
2. Calls POST `/auth/refresh` with stored refresh_token
3. Gets new `access_token`
4. Retries original request with new token
5. If refresh fails, clears tokens and user must login again

### Other Errors
```typescript
const response = await apiClient.createNote('title', 'content');
if (response.error) {
  console.error('Failed to create note:', response.error);
  // Handle error in UI
}
```

## Security Features

### Token Storage
- Access tokens: Stored in `expo-secure-store` (encrypted at rest)
- Refresh tokens: Stored in `expo-secure-store` (encrypted at rest)
- Tokens never stored in AsyncStorage or app state (Redux)

### Encryption
- All note content is encrypted on the server using AES-256-GCM
- Encryption handled transparently by backend
- Frontend receives/sends encrypted content

### Password Security
- Passwords transmitted over HTTPS (production)
- Server uses bcrypt with cost factor 12
- Passwords never logged or stored in plain text

## Usage Examples

### Register
```typescript
import { useAuth } from '@hooks/useAuth';

const { register, loading, error } = useAuth();

const handleRegister = async (email: string, password: string) => {
  await register({ email, password });
  // Redux state updates automatically
};
```

### Login
```typescript
import { useAuth } from '@hooks/useAuth';

const { login, isAuthenticated } = useAuth();

const handleLogin = async (email: string, password: string) => {
  await login({ email, password });
  if (isAuthenticated) {
    // Navigation happens automatically in AppNavigator.tsx
  }
};
```

### Create Note
```typescript
import { useAppDispatch } from '@hooks/useAuth';
import { createNoteThunk } from '@store/slices/notesSlice';

const dispatch = useAppDispatch();

const handleCreateNote = async (title: string, body: string) => {
  const result = await dispatch(createNoteThunk({ title, body }));
  if (result.meta.requestStatus === 'fulfilled') {
    // Note created successfully
  }
};
```

### Fetch Notes
```typescript
import { useAppDispatch, useAppSelector } from '@hooks/useAuth';
import { fetchNotesThunk } from '@store/slices/notesSlice';

const dispatch = useAppDispatch();
const { notes, loading } = useAppSelector(state => state.notes);

useEffect(() => {
  dispatch(fetchNotesThunk());
}, [dispatch]);
```

## Troubleshooting

### API Connection Failed
- **Symptom**: "Connection refused" or timeout errors
- **Cause**: Backend not running on localhost:8000
- **Fix**: Start the backend with `docker-compose up -d` in the `securenotes-backend` directory

### 401 Unauthorized on Every Request
- **Symptom**: Login works but subsequent requests fail with 401
- **Cause**: Tokens not being stored/retrieved properly
- **Fix**: Check that `expo-secure-store` is working (may need native installation)

### CORS Errors
- **Symptom**: "Cross-Origin Request Blocked" in browser console
- **Cause**: Backend CORS settings not allowing frontend origin
- **Fix**: Backend is configured to accept `http://localhost:8081` (Expo default)

### Encrypted Content Shows as Garbled
- **Symptom**: Note content appears as encrypted strings
- **Cause**: Backend returns encrypted content which is correct
- **Fix**: No action needed - server handles encryption transparently

## Next Steps

1. **Start the Backend**:
   ```bash
   cd securenotes-backend
   docker-compose up -d
   ```

2. **Run the Frontend**:
   ```bash
   npm start
   # or
   expo start
   ```

3. **Test Registration**:
   - Navigate to register screen
   - Create account with email and password
   - Should see success message and redirect to login

4. **Test Login**:
   - Login with registered credentials
   - Should be redirected to notes list screen
   - Redux state updates with authenticated user

5. **Test Notes Operations**:
   - Create a note with title and content
   - Note should appear in list immediately
   - Update note content
   - Delete note
   - Search for notes

## Performance Optimization

### Caching
- Notes are cached locally in AsyncStorage after each API call
- If API fails, cached notes are shown
- Search first tries API, falls back to local cache

### Token Refresh
- Token refresh happens automatically in background
- No need to manually handle token expiration
- Single failed request triggers refresh, then retries

### Lazy Loading
- Only fetch notes when screen is focused
- Search debounced to reduce API calls
- Edit operations optimistic (update local store first)

## Backend Debugging

If you encounter backend errors:

1. Check backend logs:
   ```bash
   docker-compose logs api
   ```

2. Test endpoints directly with curl:
   ```bash
   curl http://localhost:8000/api/v1/health
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"Password123!"}'
   ```

3. Check database status:
   ```bash
   docker-compose logs db
   docker-compose exec db psql -U postgres -d securenotes_db
   ```

## Related Files
- `src/services/apiClient.ts` - HTTP client implementation
- `src/constants/environment.ts` - Configuration
- `src/store/slices/authSlice.ts` - Auth state management
- `src/store/slices/notesSlice.ts` - Notes state management
- `src/hooks/useAuth.ts` - Auth hook
- `src/hooks/useNotes.ts` - Notes hook
- `src/screens/auth/LoginScreen.tsx` - Login UI
- `src/screens/auth/RegisterScreen.tsx` - Register UI
- `src/screens/notes/NotesListScreen.tsx` - Notes list UI
- `src/screens/notes/NoteEditorScreen.tsx` - Note editor UI
