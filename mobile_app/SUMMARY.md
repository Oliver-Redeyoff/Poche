# Poche Mobile App - Summary

## Overview

The Poche mobile app is a React Native application built with Expo that allows users to view and manage their saved articles. It provides a native mobile experience for reading articles saved via the browser extension.

## Features

- **Authentication**: Email/password login and signup
- **Article Viewing**: Display all articles saved by the user
- **User Profile**: Manage username, website, and avatar
- **Native Navigation**: Tab-based navigation with native iOS blur effects
- **Dark Mode**: Automatic theme switching based on system preferences

## Architecture

### Technology Stack

- **Framework**: React Native with Expo SDK ~54
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Navigation**: Expo Router with Stack and Tab navigators
- **Backend**: Supabase (authentication and database)
- **Storage**: AsyncStorage for session persistence

### File Structure

```
mobile_app/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx        # Root layout (Stack navigator)
│   ├── (tabs)/            # Tab navigation group
│   │   ├── _layout.tsx    # Tab layout with native iOS blur
│   │   ├── index.tsx      # Home tab (auth/account)
│   │   └── explore.tsx    # Explore tab
│   └── modal.tsx          # Modal screen
├── components/            # React components
│   ├── auth.tsx          # Authentication component
│   ├── account.tsx       # Account/profile component with articles
│   ├── themed-text.tsx   # Themed text component
│   └── ...
├── lib/
│   └── supabase.ts       # Supabase client configuration
├── hooks/                # Custom React hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── constants/
│   └── theme.ts          # Theme colors and fonts
└── SUMMARY.md            # This file
```

## Key Components

### app/(tabs)/index.tsx
Home screen that:
- Checks authentication status
- Shows Auth component if not logged in
- Shows Account component if logged in
- Listens for auth state changes

### components/auth.tsx
Authentication component:
- Email/password login
- Email/password signup
- Form validation
- Error handling
- Themed UI with dark mode support

### components/account.tsx
Account/profile component:
- User profile management (username, website)
- Displays user's saved articles
- Fetches articles from Supabase
- Article list with cards showing title, content preview, date
- Sign out functionality

## Routing Structure

### File-Based Routing
Expo Router uses file-based routing similar to Next.js:

- `app/_layout.tsx` - Root layout with Stack navigator
- `app/(tabs)/_layout.tsx` - Tab navigator layout
- `app/(tabs)/index.tsx` - Home tab (default route `/`)
- `app/(tabs)/explore.tsx` - Explore tab (`/explore`)
- `app/modal.tsx` - Modal screen (`/modal`)

### Route Groups
- `(tabs)` - Route group that doesn't affect URL structure
- Parentheses create logical grouping without adding to path

## Database Integration

### Articles Table
The app fetches articles with:
- `user_id` filter to show only user's articles
- Ordered by `created_time` (newest first)
- Displays: title, content preview, creation date

### Profiles Table
User profile management:
- `username` - Display name
- `website` - User's website URL
- `avatar_url` - Profile picture (not yet implemented in UI)

## Authentication Flow

1. App starts → Checks for existing session
2. If no session → Shows Auth component
3. User logs in/signs up → Supabase authenticates
4. Session stored → AsyncStorage persists session
5. Account component shown → User can view articles

## UI/UX Features

### Native iOS Tab Bar
- Liquid glass blur effect on iOS
- Uses `expo-blur` for native blur
- Transparent background with blur overlay
- Hides when keyboard appears

### Theming
- Automatic dark/light mode detection
- Themed components (ThemedText, ThemedView)
- Consistent color scheme across app
- System preference-based switching

### Navigation
- Tab-based navigation for main screens
- Stack navigation for modals
- Native transitions and animations
- Haptic feedback on tab presses

## Development

### Setup
```bash
cd mobile_app
npm install
npx expo start
```

### Scripts
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser

### Dependencies

Key dependencies:
- `expo` - Expo SDK
- `expo-router` - File-based routing
- `@supabase/supabase-js` - Supabase client
- `expo-blur` - Native blur effects
- `@react-native-async-storage/async-storage` - Local storage

## State Management

- React hooks for local state (`useState`, `useEffect`)
- Supabase session management
- Auth state changes via `onAuthStateChange`
- No global state management library (kept simple)

## Error Handling

- Alert dialogs for user-facing errors
- Console logging for debugging
- Graceful fallbacks for missing data
- Loading states for async operations

## Platform-Specific Features

### iOS
- Native tab bar with blur effect
- SF Symbols icons
- Native navigation transitions

### Android
- Material Design elements
- Android-specific styling
- Edge-to-edge support

## Future Enhancements

Potential features:
- Article reading view with full content
- Article search and filtering
- Article organization (tags, folders)
- Offline article reading
- Reading progress tracking
- Article sharing
- Push notifications for new articles
- Article deletion
- Article editing

