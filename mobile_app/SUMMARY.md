# Poche Mobile App - Summary

## Overview

The Poche mobile app is a React Native application built with Expo that allows users to view and manage their saved articles. It provides a native mobile experience for reading articles saved via the browser extension.

## Features

- **Authentication**: Email/password login and signup via self-hosted backend
- **Article Viewing**: Display all articles saved by the user
- **Native Navigation**: Tab-based navigation with native iOS blur effects
- **Dark Mode**: Automatic theme switching based on system preferences with custom Poche color theme
- **Custom Theme**: Warm color palette with Poche coral accent (#EF4056 light, #F06B7E dark)
- **Offline Access**: Signed-in users can access articles stored locally even when offline
- **Offline Image Caching**: Images in articles are downloaded and stored locally for offline viewing
- **Background Sync**: Periodic background task to sync latest articles and cache images
- **Instant Loading**: Articles from local storage appear immediately on homepage
- **Article Animations**: Smooth entry animations for new articles and exit animations for deleted articles
- **Article Deletion**: Delete articles with confirmation dialog and smooth animations
- **Article Detail View**: Full article reading experience with markdown rendering and offline support
- **Tag Management**: Add and remove tags from articles directly from article cards with confirmation dialogs
- **Tag Filtering**: Filter articles by tag using tag chips at the top of the homepage
- **Reading Time**: Display estimated reading time based on article word count

## Architecture

### Technology Stack

- **Framework**: React Native with Expo SDK ~54
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Navigation**: Expo Router with Stack and Tab navigators
- **Backend**: Self-hosted API (Hono + Better Auth + PostgreSQL)
- **Storage**: AsyncStorage for session persistence and article caching
- **Background Tasks**: expo-background-task for periodic article syncing
- **Animations**: react-native-reanimated for smooth list animations
- **Markdown Rendering**: react-native-markdown-display for article content

### File Structure

```
mobile_app/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx        # Root layout (Stack navigator, AuthContext)
│   ├── index.tsx          # Home screen with article list and tag filtering
│   ├── article/[id].tsx    # Article detail screen with markdown rendering
│   ├── auth.tsx            # Authentication screen
│   └── settings.tsx        # Settings screen
├── components/            # React components
│   ├── article-card.tsx   # Article card with tag management, delete, and animations
│   ├── themed-text.tsx    # Themed text component
│   ├── themed-view.tsx    # Themed view component
│   └── ...
├── shared/                # Shared types and utilities
│   ├── types.tsx          # TypeScript types (Article, AuthResponse, etc.)
│   └── util.ts            # Utility functions (tagToColor, etc.)
├── lib/
│   ├── api.ts            # API client for self-hosted backend
│   ├── background-sync.ts # Background task for syncing articles
│   ├── article-sync.ts   # Centralized article sync logic
│   └── image-cache.ts    # Image extraction, downloading, and caching utilities
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
- Checks authentication status via AuthContext
- Shows Auth screen if not logged in
- Shows article list if logged in
- Loads articles from local storage immediately
- Syncs new articles from backend in background
- Handles article deletion with animations
- Manages article list state and storage
- **Tag filtering**: Displays tag chips at top for filtering articles by tag
- **Tag updates**: Handles tag updates from ArticleCard and syncs to backend and local storage

### app/auth.tsx
Authentication screen:
- Email/password login
- Email/password signup
- Mode switch between Sign In and Sign Up
- Form validation
- Error handling
- Themed UI with dark mode support
- Redirects to home on successful authentication

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
- **Reading time**: Calculates and displays reading time based on article wordCount
- Updates parent state and storage on deletion and tag changes

### app/article/[id].tsx
Article detail screen with premium reading experience:
- Displays full article content with enhanced typography
- Uses `react-native-markdown-display` for rendering markdown content from backend
- **Custom image rendering**:
  - Filters out invalid image URLs (empty, #, data URIs)
  - Filters out low-resolution images (< 50x50 pixels) like tracking pixels
  - Handles image load errors gracefully
  - 100% width images with preserved aspect ratio using `expo-image`
- **Link styling**: Links appear in accent color with underline
- Tags displayed at top of article with colored chips
- Loads articles from local storage only (offline-first)
- Handles navigation back if article not found
- Shows article title, site name, reading time, and metadata
- Uses `useWindowDimensions()` for correct responsive width

## Routing Structure

### File-Based Routing
Expo Router uses file-based routing similar to Next.js:

- `app/_layout.tsx` - Root layout with Stack navigator, AuthContext provider, registers background sync
- `app/index.tsx` - Home screen (default route `/`) with article list
- `app/article/[id].tsx` - Article detail screen with dynamic ID parameter
- `app/auth.tsx` - Authentication screen
- `app/settings.tsx` - Settings screen

## API Integration

### Backend API
The app communicates with a self-hosted backend via `lib/api.ts`:
- **Authentication**: `signIn()`, `signUp()`, `signOut()`, `getSession()`
- **Articles**: `getArticles()`, `saveArticle()`, `updateArticle()`, `deleteArticle()`
- **Bearer token auth**: Token stored in AsyncStorage, sent in Authorization header
- **User-scoped queries**: All article operations filter by authenticated user

### Article Fields
- `id` (number) - Unique identifier
- `title`, `content`, `excerpt` - Article text (content is markdown)
- `url`, `siteName`, `author` - Metadata
- `wordCount` (number) - For reading time calculation
- `tags` (string) - Comma-delimited list
- `createdAt`, `updatedAt` (timestamps)

### Local Storage
- Articles cached in AsyncStorage with key `@poche_articles_{userId}`
- Incremental sync: Only fetches new articles not already in local storage
- Offline support: Article detail view loads only from local storage

## Authentication Flow

1. App starts → AuthContext checks for existing session via `getSession()`
2. If no session → Shows Auth screen
3. User logs in/signs up → Backend authenticates, returns bearer token
4. Session stored → Token persisted in AsyncStorage
5. AuthContext updated → Navigation redirects to home
6. Background sync registered → Periodic article syncing enabled
7. Articles loaded → From local storage immediately, then synced from backend
8. User can view articles → With offline support

## UI/UX Features

### Theming
- Automatic dark/light mode detection
- Custom Poche themes (`PocheLightTheme`, `PocheDarkTheme`) defined in `_layout.tsx`
- Warm color palette: light background #FAFAF8, dark background #1C1A18
- Poche coral accent: #EF4056 (light mode), #F06B7E (dark mode)
- Theme colors: text, textSecondary, textMuted, background, card, border, divider, accent, codeBg, blockquoteBg, blockquoteBorder
- Themed components (ThemedText, ThemedView)

### Navigation
- Stack navigation for all screens
- Native transitions and animations
- Protected routes based on authentication state

## Development

### Setup
```bash
cd mobile_app
npm install
npx expo start
```

### Connecting to Local Backend
1. Start the backend with Docker: `docker compose -f docker-compose.dev.yml up`
2. Find your computer's local IP address (e.g., `192.168.1.100`)
3. Update `API_URL` in `lib/api.ts` to `http://YOUR_IP:3000`
4. Ensure your phone and computer are on the same network

### Scripts
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser

### Dependencies

Key dependencies:
- `expo` - Expo SDK
- `expo-router` - File-based routing
- `expo-blur` - Native blur effects
- `expo-image` - Optimized image component
- `expo-font` - Custom font loading
- `expo-splash-screen` - Splash screen management during font loading
- `@expo-google-fonts/bitter` - Bitter font for display/headers
- `@expo-google-fonts/source-sans-3` - Source Sans 3 font for body text
- `@react-native-async-storage/async-storage` - Local storage for articles and session
- `expo-background-task` - Background task management for article syncing
- `expo-task-manager` - Task manager for background tasks
- `expo-file-system/legacy` - Image downloading and caching for offline access
- `react-native-reanimated` - Smooth animations for article list
- `react-native-markdown-display` - Markdown rendering for article content

## State Management

- React hooks for local state (`useState`, `useEffect`, `useCallback`, `useMemo`)
- AuthContext for session management (token + user)
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
- Image error handling with graceful degradation

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

- ✅ Migrated from Supabase to self-hosted backend
- ✅ Bearer token authentication via `lib/api.ts`
- ✅ AuthContext for session management
- ✅ Markdown rendering with `react-native-markdown-display`
- ✅ Custom image rendering with error handling and size filtering
- ✅ Link styling with accent color and underline
- ✅ Offline article reading support
- ✅ Offline image caching with `expo-file-system/legacy`
- ✅ Background article syncing with expo-background-task
- ✅ Centralized article sync logic in `lib/article-sync.ts`
- ✅ Instant article loading from local storage
- ✅ Article entry animations (FadeIn) for new articles
- ✅ Article exit animations (FadeOut) for deleted articles
- ✅ Article deletion with confirmation dialog
- ✅ Modular ArticleCard component
- ✅ Incremental article syncing (only new articles)
- ✅ Network error handling with local storage fallback
- ✅ Tag management UI (add/remove tags from article cards)
- ✅ Tag filtering on homepage with tag chips
- ✅ Reading time display based on wordCount
- ✅ Cross-platform tag input modal
- ✅ Shared types and utilities folder
- ✅ Custom Poche color theme (warm tones, coral accent #EF4056)
- ✅ Tags displayed at top of article detail view
- ✅ iOS app icon asset catalog with all required sizes
- ✅ Bitter + Source Sans 3 fonts via `@expo-google-fonts` (Bitter for headers/logo, Source Sans 3 for body)
- ✅ Font weight variants: Regular (400), Medium (500), SemiBold (600), Bold (700)
- ✅ Improved authentication error messaging with Better Auth error format handling
- ✅ Session expiry caching - only refreshes session when < 3 days until expiry

## Technical Notes

### Markdown Rendering with react-native-markdown-display
The article detail view uses `react-native-markdown-display` with:
- Custom styles for all markdown elements (headings, paragraphs, code, blockquotes, etc.)
- Custom image rule with `expo-image` for optimized rendering
- Image filtering: skips invalid URLs and images < 50x50 pixels
- Error handling: failed images are hidden gracefully
- Link styling: accent color with underline, opens in browser via `Linking.openURL()`

### Image Caching Architecture
- `lib/image-cache.ts` contains utilities for extracting, downloading, and caching images
- Images are stored in `${FileSystem.documentDirectory}article-images/{userId}/{articleId}/`
- Both `index.tsx` and `background-sync.ts` use centralized `syncArticles()` function with `processImages: true`

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
