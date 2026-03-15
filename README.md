# SecureNotes

A security-first React Native note-taking app with biometric authentication, end-to-end encryption awareness, and a clean, modern design system.

## Features

- **Secure Authentication**: Email/password login and registration with strong validation
- **Biometric Unlock**: Face ID, Touch ID, or fingerprint authentication (device-dependent)
- **Session Management**: Automatic logout after 15 minutes of inactivity
- **Create & Edit Notes**: Rich note editing with auto-save drafts
- **Search**: Debounced search across all notes
- **Offline Support**: Efficient Redux state management with data persistence
- **Screenshot Protection**: Prevents unauthorized screenshots on sensitive screens
- **Material Design**: Modern, accessible UI with TypeScript throughout

## Technology Stack

- **Framework**: React Native with Expo managed workflow
- **Language**: TypeScript 5.3+
- **State Management**: Redux Toolkit with async thunks
- **Navigation**: React Navigation 6+ (stack & bottom tabs)
- **API**: Axios with JWT interceptors and automatic token refresh
- **Authentication**: react-native-keychain for secure token storage
- **Biometrics**: react-native-biometrics for device-native authentication
- **UI Components**: Custom components with react-native-vector-icons
- **Styling**: TypeScript-based style system with reusable constants

## Project Structure

```
src/
├── screens/              # Screen components
│   ├── auth/            # Login & Register
│   └── notes/           # Notes list, detail, editor, settings
├── components/
│   ├── ui/              # Reusable UI components (Button, Input, Card, etc.)
│   ├── notes/           # Note-specific components (NoteCard, SearchBar)
│   └── shared/          # Shared components (Header, Dialogs, Spinners)
├── navigation/          # Navigation configuration
├── store/               # Redux configuration & slices
├── services/            # API & biometric services
├── hooks/               # Custom React hooks
├── utils/               # Utilities (storage, validators, formatters)
├── types/               # TypeScript type definitions
└── constants/           # Design tokens & constants
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator
- Physical device for testing biometrics

### Installation

1. **Clone and install**:
   ```bash
   cd Secure_Note
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API base URL
   ```

3. **Start development server**:
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on device**:
   - iOS: Press `i` in the terminal
   - Android: Press `a` in the terminal
   - Physical device: Scan QR code with Expo Go app

## API Integration

The app expects a backend API with the following endpoints:

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Notes
- `GET /api/v1/notes` - Fetch all notes
- `POST /api/v1/notes` - Create note
- `GET /api/v1/notes/:id` - Get note details
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note
- `GET /api/v1/notes/search?q=` - Search notes

## Key Features Deep Dive

### Security
- **Token Storage**: Tokens stored in secure Keychain, never in AsyncStorage
- **Token Refresh**: Axios interceptor auto-refreshes expired tokens
- **Screenshot Protection**: Enabled on detail/editor screens
- **Input Validation**: Email, password strength, text sanitization
- **Logout on Expiry**: Automatic logout with session expiry handling

### Biometric Authentication
- Checked at app launch after user backgrounds the app
- Supports Face ID, Touch ID, and fingerprint authentication
- Graceful fallback to PIN/password input after 3 failures
- Device capability detection—hidden on unsupported devices

### State Management
- Redux slices for auth and notes
- Async thunks for API operations
- Optimistic updates for better UX
- Error handling with user-friendly messages

### UI/UX
- **Color System**: 10-color palette with semantic meaning
- **Typography**: Responsive sizing and weights
- **Spacing**: 8-based scale for consistency
- **Components**: Reusable, composable, accessible
- **Animations**: Subtle transitions and press states

## Development Guidelines

### Adding a New Feature

1. Create types in `src/types/`
2. Add Redux slice in `src/store/slices/` if needed
3. Create API service method in `src/services/api.ts`
4. Build UI components in `src/components/`
5. Implement screens in `src/screens/`
6. Update navigation if needed

### Styling

- Use constants from `src/constants/` for all colors, spacing, typography
- Avoid magic numbers and hardcoded values
- Create reusable style objects for common patterns
- Always add spacing bottom on stack screens for scrolling room

### Performance

- Memoize expensive computations with `useMemo`
- Use `useCallback` for event handlers to prevent re-renders
- Debounce search inputs (300ms default)
- Lazy load images with proper caching
- Profile with React DevTools Profiler

## Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## Deployment

### iOS
```bash
eas build --platform ios
eas submit --platform ios
```

### Android
```bash
eas build --platform android
eas submit --platform android
```

See [Expo EAS Documentation](https://docs.expo.dev/build/introduction/) for detailed setup.

## Troubleshooting

### Biometric not working
- Ensure permissions are granted in app.json
- Test with a real device (simulator may not support biometrics)
- Check device has biometric hardware

### API calls failing
- Verify `EXPO_PUBLIC_API_BASE_URL` in `.env`
- Check network connectivity
- Review API response format matches types

### Styling issues
- Verify color constants are imported
- Check spacing values match spacing scale
- Test on multiple device sizes

## Contributing

1. Follow TypeScript strict mode
2. Use functional components and hooks
3. Add error boundaries for critical sections
4. Document complex logic with comments
5. Keep components small and focused

## License

Proprietary - SecureNotes

## Support

For issues or questions, contact the development team or refer to the inline code documentation.
# safe_note
