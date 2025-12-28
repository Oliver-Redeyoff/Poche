# Poche Mobile App - Summary

## Overview

The Poche mobile app is a React Native application built with Expo that allows users to view and manage their saved articles. It provides a native mobile experience for reading articles saved via the browser extension.

## Features

- **Authentication**: Email/password login and signup
- **Article Viewing**: Display all articles saved by the user
- **User Profile**: Manage username, website, and avatar
- **Native Navigation**: Tab-based navigation with native iOS blur effects
- **Dark Mode**: Automatic theme switching based on system preferences
- **Offline Access**: Signed-in users can access articles stored locally even when offline
- **Background Sync**: Periodic background task to sync latest articles from database
- **Instant Loading**: Articles from local storage appear immediately on homepage
- **Article Animations**: Smooth entry animations for new articles and exit animations for deleted articles
- **Article Deletion**: Delete articles with confirmation dialog and smooth animations
- **Article Detail View**: Full article reading experience with offline support
- **Tag Management**: Add and remove tags from articles directly from article cards with confirmation dialogs
- **Tag Filtering**: Filter articles by tag using tag chips at the top of the homepage
- **Reading Time**: Display estimated reading time based on article character count (replaces created time display)

## Architecture

### Technology Stack

- **Framework**: React Native with Expo SDK ~54
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Navigation**: Expo Router with Stack and Tab navigators
- **Backend**: Supabase (authentication and database)
- **Storage**: AsyncStorage for session persistence and article caching
- **Background Tasks**: expo-background-task for periodic article syncing
- **Animations**: react-native-reanimated for smooth list animations

### File Structure

```
mobile_app/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx        # Root layout (Stack navigator)
│   ├── index.tsx          # Home screen with article list and tag filtering
│   ├── article/[id].tsx    # Article detail screen
│   ├── auth.tsx            # Authentication screen
│   └── settings.tsx        # Settings screen
├── components/            # React components
│   ├── article-card.tsx   # Article card with tag management, delete, and animations
│   ├── themed-text.tsx    # Themed text component
│   ├── themed-view.tsx    # Themed view component
│   └── ...
├── shared/                # Shared types and utilities
│   ├── types.tsx          # TypeScript types (Article, Database, etc.)
│   └── util.ts            # Utility functions (tagToColor, etc.)
├── lib/
│   ├── supabase.ts       # Supabase client configuration
│   └── background-sync.ts # Background task for syncing articles
├── hooks/                # Custom React hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── constants/
│   └── theme.ts          # Theme colors and fonts
└── SUMMARY.md            # This file
```

## Key Components

### app/index.tsx
Home screen that:
- Checks authentication status
- Shows Auth component if not logged in
- Shows article list if logged in
- Loads articles from local storage immediately
- Syncs new articles from Supabase in background
- Handles article deletion with animations
- Manages article list state and storage
- **Tag filtering**: Displays tag chips at top for filtering articles by tag
- **Tag updates**: Handles tag updates from ArticleCard and syncs to Supabase and local storage

### components/auth.tsx
Authentication component:
- Email/password login
- Email/password signup
- Form validation
- Error handling
- Themed UI with dark mode support

### components/article-card.tsx
Article card component:
- Renders individual article card with title, site name, reading time, and optional image
- Handles navigation to article detail page
- Delete button with confirmation dialog
- Entry and exit animations using react-native-reanimated
- **Tag management**: 
  - Displays tags as colored chips
  - Click tag to remove (with confirmation alert)
  - Click "+" button to add new tag (cross-platform modal)
  - Updates tags via `onUpdateTags` callback
- **Reading time**: Calculates and displays reading time based on article length
- Updates parent state and storage on deletion and tag changes

### app/article/[id].tsx
Article detail screen:
- Displays full article content
- Loads articles from local storage only (offline-first)
- Handles navigation back if article not found
- Shows article title, content, and metadata

## Routing Structure

### File-Based Routing
Expo Router uses file-based routing similar to Next.js:

- `app/_layout.tsx` - Root layout with Stack navigator, registers background sync
- `app/index.tsx` - Home screen (default route `/`) with article list
- `app/article/[id].tsx` - Article detail screen with dynamic ID parameter
- `app/settings.tsx` - Settings screen
- `app/modal.tsx` - Modal screen (`/modal`)

## Database Integration

### Articles Table
The app fetches articles with:
- `user_id` filter to show only user's articles
- Ordered by `created_time` (newest first)
- Displays: title, content preview, reading time, site name, tags, URL
- **Article Fields**: 
  - `title`, `content`, `excerpt` (HTML entities decoded)
  - `url`, `siteName`, `length` (character count)
  - `tags` (comma-delimited string)
- **Local Storage**: Articles cached in AsyncStorage with key `@poche_articles_{userId}`
- **Incremental Sync**: Only fetches new articles not already in local storage
- **Offline Support**: Article detail view loads only from local storage
- **Tag Updates**: Tags can be updated and synced to Supabase and local storage

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
5. Background sync registered → Periodic article syncing enabled
6. Articles loaded → From local storage immediately, then synced from Supabase
7. User can view articles → With offline support

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
- `@react-native-async-storage/async-storage` - Local storage for articles and session
- `expo-background-task` - Background task management for article syncing
- `expo-task-manager` - Task manager for background tasks
- `react-native-reanimated` - Smooth animations for article list
- `expo-image` - Optimized image component for article thumbnails

## State Management

- React hooks for local state (`useState`, `useEffect`, `useRef`)
- Supabase session management
- Auth state changes via `onAuthStateChange`
- Local article state with AsyncStorage persistence
- Animation state tracking (`seenArticleIds`, `deletingArticleId`)
- No global state management library (kept simple)

## Error Handling

- Alert dialogs for user-facing errors
- Console logging for debugging
- Graceful fallbacks for missing data
- Loading states for async operations
- Network error detection with fallback to local storage
- Background task availability checks (Expo Go compatibility)

## Platform-Specific Features

### iOS
- Native tab bar with blur effect
- SF Symbols icons
- Native navigation transitions

### Android
- Material Design elements
- Android-specific styling
- Edge-to-edge support

## Recent Enhancements

- ✅ Offline article reading support
- ✅ Background article syncing with expo-background-task
- ✅ Instant article loading from local storage
- ✅ Article entry animations (FadeIn) for new articles
- ✅ Article exit animations (FadeOut) for deleted articles
- ✅ Article deletion with confirmation dialog
- ✅ Modular ArticleCard component
- ✅ Incremental article syncing (only new articles)
- ✅ Network error handling with local storage fallback
- ✅ Tag management UI (add/remove tags from article cards)
- ✅ Tag filtering on homepage with tag chips
- ✅ Reading time display (replaces created time)
- ✅ Cross-platform tag input modal (replaces iOS-only Alert.prompt)
- ✅ Shared types and utilities folder for code reuse
- ✅ Tag removal confirmation alerts

## Future Enhancements

Potential features:
- Article search functionality
- Article organization (folders/categories)
- Reading progress tracking
- Article sharing
- Push notifications for new articles
- Article editing
- Enhanced sync conflict resolution
- Tag autocomplete/suggestions
- Bulk tag operations
- Tag colors customization

