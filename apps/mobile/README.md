# VINBOX Mobile App

React Native/Expo mobile application for VINBOX - a private, self-hosted AI-powered email workspace.

## Quick Start

```bash
# Install dependencies
cd apps/mobile
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (app)/             # Main app screens (tab navigation)
│   │   ├── _layout.tsx    # Tab navigator
│   │   ├── inbox/         # Inbox screen
│   │   ├── drafts/        # Drafts screen
│   │   ├── search/        # Search screen
│   │   └── settings/      # Settings screen
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
│   ├── ui/                # Basic UI components (Button, Input, etc.)
│   ├── ThemeProvider.tsx
│   ├── EmailItem.tsx
│   ├── Avatar.tsx
│   └── RefreshableList.tsx
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   ├── useInbox.ts
│   ├── useStorage.ts
│   └── useTheme.ts
├── api/                   # API client
│   └── client.ts
├── store/                 # State management (Zustand)
├── utils/                 # Utility functions
├── types/                 # TypeScript types
├── assets/                # Images, icons, fonts
└── constants/             # App constants
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `EXPO_PUBLIC_API_URL` - Backend API URL

## Building

### Development Builds
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Development builds
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production Builds
```bash
# Preview builds
eas build --profile preview --platform android
eas build --profile preview --platform ios

# Production builds
eas build --profile production --platform android
eas build --profile production --platform ios
```

## App Store Submission

```bash
# iOS
eas submit --platform ios --profile production

# Android
eas submit --platform android --profile production
```

## Key Features

- **Authentication**: Email/password + Google/Microsoft OAuth via custom scheme (`vinbox://`)
- **Offline Support**: Secure token storage with expo-secure-store
- **Push Notifications**: Expo push notifications with FCM/APNs
- **Deep Linking**: Custom `vinbox://` scheme for auth callbacks
- **Dark/Light Mode**: System-aware with manual override
- **Offline-first**: Emails cached locally with background sync

## Architecture

- **Navigation**: Expo Router (file-based)
- **State Management**: Zustand + React Context
- **API Client**: Custom fetch wrapper with auto token refresh
- **Styling**: React Native StyleSheet with theme support
- **Icons**: Inline SVG components (no external dependencies)

## Security

- Tokens stored in expo-secure-store (Keychain/Keystore)
- Automatic token refresh on 401
- PKCE for OAuth flows
- Certificate pinning ready (configure in app.json)

## Testing

```bash
npm test
```

## License

Internal use only - VINBOX is a private application for VNETINDIA team.