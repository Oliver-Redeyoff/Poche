# Poche Mobile App - Summary

## Overview

The Poche mobile app is a React Native application built with Expo that allows users to view and manage their saved articles. It provides a native mobile experience for reading articles saved via the browser extension.

## Features

- **Onboarding**: First-time users see a swipeable onboarding experience explaining how to use Poche
- **Authentication**: Email/password login and signup via self-hosted backend
- **Forgot Password**: Request password reset email from auth screen
- **Account Deletion**: Delete account from account settings drawer with password confirmation (iOS Alert.prompt)
- **Tab Navigation**: Home and Library tabs with native iOS blur effects
- **Home Page**: "Continue Reading" section (in-progress articles), "New Articles" section (unread articles), and "Recently Read" section (3 most recently finished articles at 100% progress)
- **Continue Reading Rail**: Horizontally scrollable tile rail with swipe affordance (peek + edge hint + "Swipe for more" hint)
- **Library Page**: Tile grid for All Articles, Favorites, and tag-based filtering with article counts
- **Reading Progress Tracking**: Automatic scroll-based progress (0-100%) with local storage and backend sync
- **Unified Theme System**: Light, dark, and sepia themes apply consistently across all screens; `Colors` palette has 3 schemes; `useResolvedColorScheme()` hook replaces direct `useColorScheme()` for color decisions
- **Global Theme Selection**: Users choose Auto, Light, Sepia, or Dark from the reading settings drawer; persisted to AsyncStorage
- **Global Font Size**: Reading font size (14–26) in AuthContext (`appFontSize`/`setAppFontSize`), persisted to AsyncStorage (`@poche_app_font_size`); applies to article markdown
- **Bottom Drawer Component**: Reusable `BottomDrawer` component (`components/bottom-drawer.tsx`) with swipe-to-dismiss (PanResponder + Reanimated), dimmed backdrop, slide animation; used by reading settings and account settings
- **Reading Settings Drawer**: `ReadingSettingsDrawer` component (`components/reading-settings-drawer.tsx`); font size via `@react-native-community/slider` (configurable steps) and theme selector; opened from tab header (paint palette icon) and article screen (paint palette button)
- **Account Settings Drawer**: Uses `BottomDrawer`; shows signed-in email, sign out, and delete account; triggered by person icon in tab header (no separate settings screen)
- **Custom Theme**: Warm color palette with Poche coral accent (#EF4056 light, #F06B7E dark)
- **Offline Access**: Signed-in users can access articles stored locally even when offline
- **Offline Image Caching**: Images in articles are downloaded and stored locally for offline viewing
- **Offline Favicon Caching**: Favicons are downloaded during sync and saved locally per article for offline card placeholders, with extracted background colors
- **Offline Link Preview Caching**: New articles fetch Open Graph/Twitter preview images (`og:image`, `twitter:image`) and cache them locally for offline card thumbnails
- **Background Sync**: Periodic background task to sync latest articles and cache images
- **Instant Loading**: Articles from local storage appear immediately
- **Search**: Full-screen search across all articles by title, site name, tags, and content
- **Smart Data Refresh**: Screens reload from storage on focus to reflect changes made elsewhere
- **Article Animations**: Smooth entry animations for new articles and exit animations for deleted articles
- **Article Deletion**: Delete articles with confirmation dialog and smooth animations
- **Article Detail View**: Full article reading experience with markdown rendering and progress tracking
- **Tag Management**: Shared `TagList` component for adding/removing tags on article cards and article detail view (parses comma-separated tags, animated chips, iOS Alert.prompt or custom Modal on Android)
- **Reading Time**: Display estimated reading time based on article word count
- **Clear Data on Logout**: Locally stored articles are cleared when user signs out
- **Shared Types**: Uses `@poche/shared` npm package for common types, utilities, API helpers, and markdown parsing

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
- **Markdown Rendering**: Custom markdown-to-React-Native component using `@poche/shared` parsing
- **Shared Package**: `@poche/shared` npm package for types, utilities, API helpers, markdown parsing

### File Structure

```
mobile_app/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx        # Root layout (Stack navigator, AuthContext, onboarding check)
│   ├── (tabs)/            # Tab navigator group
│   │   ├── _layout.tsx    # Tab layout (Home & Library tabs, account settings drawer)
│   │   ├── index.tsx      # Home tab - Continue Reading, New Articles & Recently Read sections
│   │   └── library.tsx    # Library tab - All Articles, Favorites, Tags tiles
│   ├── articles/
│   │   └── index.tsx      # Filtered article list (by tag, favorites, or all)
│   ├── article/[id].tsx   # Article detail screen with markdown rendering & progress tracking
│   ├── search.tsx         # Full-screen search with filtering across all articles
│   ├── auth.tsx           # Authentication screen (login/signup/forgot password)
│   └── onboarding.tsx     # First-time user onboarding experience
├── components/            # React components
│   ├── button.tsx         # Unified Button component (primary, secondary, danger, ghost variants)
│   ├── segmented-control.tsx # Segmented control for mode switching
│   ├── article-card.tsx   # Article card with TagList, progress bar, delete, animations
│   ├── tag-list.tsx       # Reusable TagList component for displaying and managing tags
│   ├── bottom-drawer.tsx  # Reusable bottom sheet drawer with swipe-to-dismiss
│   ├── reading-settings-drawer.tsx # Font size slider + theme selector (uses AuthContext)
│   ├── dropdown-menu.tsx  # Reusable positioned dropdown menu component
│   ├── header.tsx         # Custom header component with logo, back button, and collapsible animation
│   ├── markdown.tsx       # Custom markdown-to-React-Native renderer (uses @poche/shared)
│   ├── themed-text.tsx    # Themed text component
│   ├── themed-view.tsx    # Themed view component
│   └── ...
├── lib/
│   ├── api.ts            # API client (uses @poche/shared helpers)
│   ├── background-sync.ts # Background task for syncing articles
│   ├── article-sync.ts   # Centralized article sync logic with reading progress updates
│   └── image-cache.ts    # Image extraction, downloading, and caching utilities
├── hooks/                # Custom React hooks
│   ├── use-article-actions.ts  # Article management hook (delete, tags, favorites)
│   ├── use-color-scheme.ts     # Re-exports useColorScheme + useResolvedColorScheme() hook
│   ├── use-color-scheme.web.ts # Web variant with hydration support
│   └── use-theme-color.ts     # Returns colors from resolved theme (light/dark/sepia)
├── constants/
│   └── theme.ts          # Colors (light/dark/sepia palettes), ResolvedColorScheme type, Fonts
├── patches/              # React Native patches (applied via patch-package)
│   └── react-native+0.81.5.patch  # iOS text rendering fix
├── metro.config.js       # Metro bundler config for @poche/shared
├── app.config.js         # Expo config with environment variables
├── eas.json              # EAS Build configuration with env vars
├── .env.example          # Example environment variables
├── package.json          # Dependencies (includes @poche/shared)
└── SUMMARY.md            # This file
```

**Note**: Shared types, utilities, and markdown parsing are imported from `@poche/shared` (located at `../shared`).

## Key Components

### app/onboarding.tsx
First-time user onboarding experience:
- Swipeable carousel with 4 slides
- Explains what Poche is, how to save articles, offline reading, and organization
- Skip button to bypass onboarding
- **Animated pagination dots**: Smooth width and color transitions using React Native Reanimated
- "Get Started" button on final slide
- Completion state saved to AsyncStorage (`@poche_onboarding_complete`)
- Beautiful iconography and typography matching app theme

### app/(tabs)/index.tsx
Home tab that:
- Displays "Continue Reading" section with in-progress articles (1-99% progress)
- Renders Continue Reading as a horizontal rail with swipe affordance cues
- Displays "New Articles" section with unread articles (0% progress)
- Displays "Recently Read" section with 3 most recently finished articles (100% progress), sorted by `updatedAt`
- Shows "all caught up" empty state only when all three sections are empty
- Uses `useFocusEffect` to reload data when tab comes into focus
- Handles article deletion and tag updates

### app/(tabs)/library.tsx
Library tab that:
- Displays tile grid with All Articles, Favorites, and tag-based filters
- Shows article counts for each tile
- Calculates tile widths dynamically based on screen size
- Navigates to filtered article list on tile press
- Uses `useFocusEffect` to reload data when tab comes into focus

### app/articles/index.tsx
Filtered article list screen:
- Receives filter type and value via URL params (all, favorites, tag)
- Displays filtered articles in a scrollable list
- Shows appropriate empty states for each filter type
- Handles article deletion and tag updates

### app/auth.tsx
Authentication screen:
- Email/password login
- Email/password signup
- **Forgot password**: Request password reset email
- Mode switch between Sign In, Sign Up, and Forgot Password
- Form validation
- Error handling
- Themed UI with dark mode support
- Redirects to home on successful authentication

### app/(tabs)/_layout.tsx
Tab layout with account and reading settings:
- Home and Library tabs with custom styling
- **Header**: Poche logo and two icon buttons — paint palette (opens `ReadingSettingsDrawer`), person (opens account settings drawer)
- **Reading settings drawer**: `ReadingSettingsDrawer` (font size + theme); triggered by paint palette icon
- **Account settings drawer**: `BottomDrawer` triggered by person icon; signed-in email, Sign Out, Delete Account
- Sign out clears local articles via `clearArticlesFromStorage(userId)` before signing out
- Delete account with password confirmation (iOS `Alert.prompt`, Android directs to web app)

### components/bottom-drawer.tsx
Reusable bottom sheet drawer component:
- `Modal` with transparent background and fade animation for backdrop
- Animated sheet slides up from bottom with drag handle
- **Swipe-to-dismiss**: `PanResponder` detects downward drag; dismisses on 60px threshold or velocity > 0.5
- `Reanimated` slide animation (250ms in, 200ms out)
- Adapts colors from current theme via `useResolvedColorScheme()` and `Colors` palette
- Handles safe area insets for bottom padding
- **Props**: `visible` (boolean), `onDismiss` (callback), `children` (ReactNode)
- Used by: `ReadingSettingsDrawer`, account settings in tab layout

### components/reading-settings-drawer.tsx
Reading settings bottom drawer (font size + theme):
- **Props**: `visible`, `onDismiss` (no font size props; uses AuthContext)
- **Font size**: `@react-native-community/slider`; steps from `FONT_SIZE_STEPS` array (e.g. 14–26), number of steps inferred from array length; value from `appFontSize`, updates via `setAppFontSize` (persisted in AuthContext)
- **Theme**: Auto/Light/Sepia/Dark options; uses `appTheme`/`setAppTheme` from `useAuth()`
- Wraps content in `BottomDrawer`; uses `Colors` and `useResolvedColorScheme()` for theming
- Opened from tab header (paint palette) and article screen (paint palette button)

### components/tag-list.tsx
Reusable TagList component for displaying and managing tags:
- Parses comma-separated tags strings
- Renders animated tags (FadeIn/FadeOut/LinearTransition from react-native-reanimated) with remove-on-tap
- "Add tag" button (+) uses iOS native `Alert.prompt` or custom Modal on Android
- `size` prop ('small' | 'default') for different visual contexts
- Handles `tagToColor` internally (from `@poche/shared`)
- Used by both `ArticleCard` and article detail view (`article/[id].tsx`)

### components/dropdown-menu.tsx
Reusable positioned dropdown menu component:
- Renders a trigger element that opens a dropdown menu on press
- **Smart positioning**: Measures trigger position with `measureInWindow`, then measures menu with `onLayout` to determine optimal placement
  - Vertical: prefers below trigger, flips above if not enough space
  - Horizontal: prefers right-aligned with trigger, flips left-aligned if it would go off-screen, clamps to edges with 8px padding
- Menu renders invisibly off-screen first (`top: -9999, opacity: 0`) to measure its actual size, then positions and reveals
- Dark/light mode adaptive colors (`#2C2C2E` dark / `#FFFFFF` light)
- Auto-inserts separators before destructive items
- **Props**: `trigger` (ReactNode), `items` (array of `DropdownMenuItem` with `key`, `label`, optional `icon`, optional `destructive`, `onPress`)
- Uses `Modal` for overlay (renders above all content, handles Android back button)
- Used by article detail view and `ArticleCard` component

### components/article-card.tsx
Article card component:
- Renders individual article card with title, site name, reading time, and optional image
- Handles navigation to article detail page
- **Image priority**: Uses `previewImageUrl` first, then first image extracted from markdown content, then favicon placeholder, then default icon
- Uses locally cached favicon placeholders (with extracted background colors) when no preview/content image exists
- **Favorite toggle**: Star icon (outline when not favorited, filled gold when favorited)
- **Dropdown menu**: Ellipsis icon opens `DropdownMenu` with Open Original, Mark as Read, Mark as Unread, and Delete (destructive) options
- Entry and exit animations using react-native-reanimated
- **Tag management**: Uses shared `TagList` component (tag logic removed from ArticleCard)
- **Reading time**: Calculates and displays reading time based on article wordCount
- **Progress bars always visible**: Shows progress bars without percentage labels in tile and default variants
- Updates parent state and storage on deletion, tag changes, favorites, and read/unread actions

### components/markdown.tsx
Custom markdown-to-React-Native renderer:
- Uses `tokenize()` and `parseInline()` from `@poche/shared` for parsing
- Renders React Native elements for all markdown block and inline types
- Custom styles for headings, paragraphs, code, blockquotes, etc.
- `renderImage` prop for custom image rendering with `expo-image`
- Image filtering: skips invalid URLs and images < 50x50 pixels
- Error handling: failed images are hidden gracefully
- `baseUrl` prop for resolving relative URLs in links
- Link styling: accent color with underline, opens in browser

### app/article/[id].tsx
Article detail screen with premium reading experience:
- Displays full article content with enhanced typography
- Uses custom `Markdown` component for rendering
- **Header actions**:
  - Favorite toggle button (star icon, gold when favorited)
  - Dropdown menu (ellipsis icon) via `DropdownMenu` component with: Open Original, Mark as Read, Mark as Unread, Delete (destructive)
- **Reading progress bar**: Animated thin progress bar below header using Reanimated `useSharedValue` + `withTiming` (300ms); fills smoothly as user scrolls
- **Collapsible header**: Header slides up and collapses when scrolling down (past 80px), reappears on scroll up; header/progress use an absolute overlay so ScrollView height does not change while collapsing
- **"Continue reading" button**: Floating pill button appears when user scrolls 15%+ above their current reading progress; uses `FadeIn`/`FadeOut` with hysteresis (shows at 15% gap, hides at 5% gap) to prevent flicker; scrolls smoothly back to progress position on press; hidden when progress is 100%; position animates in sync with collapsible header
- **Reading progress tracking**:
  - Tracks scroll position and calculates progress (0-100%)
  - Updates local storage on scroll (debounced, 5% threshold)
  - Syncs to backend with 3-second debounce
  - Immediate sync when reaching 100% progress
  - Final sync on component unmount
  - Scroll restoration uses `opacity: 0` to hide content until position is restored (instant appearance at correct position)
  - Scroll handler ignores events until restoration complete, preventing false reading progress updates
- **Custom image rendering**:
  - Filters out invalid image URLs (empty, #, data URIs)
  - Filters out low-resolution images (< 50x50 pixels)
  - Handles image load errors gracefully
  - 100% width images with preserved aspect ratio
- **Reading settings**: Uses `ReadingSettingsDrawer` (font size from AuthContext `appFontSize`, theme from `appTheme`); triggered by paint palette button in header; article typography uses `appFontSize` from `useAuth()`
- **Link styling**: Links appear in accent color with underline
- **Tag management**: Uses shared `TagList` component; `handleUpdateTags` uses `updateArticleTagsWithSync` and updates local article state
- Loads articles from local storage only (offline-first)
- Handles navigation back if article not found

### lib/api.ts
API client using `@poche/shared` helpers:
- Uses shared `API_ENDPOINTS` for endpoint definitions
- Uses shared `parseApiError()` for error handling
- Uses shared `shouldRefreshSession()`, `isSessionExpired()`, `calculateSessionExpiry()`
- Environment variable for API_URL via `app.config.js` and `expo-constants`
- Token storage in AsyncStorage

### lib/article-sync.ts
Centralized article sync logic:
- `syncArticles()` - Sync articles from backend, cache content images, cache/backfill article favicons (with background color extraction), and cache link preview images from Open Graph/Twitter metadata
- `loadArticlesFromStorage()` - Load articles from AsyncStorage
- `saveArticlesToStorage()` - Save articles to AsyncStorage
- `clearArticlesFromStorage(userId)` - Clear all locally stored articles for a user (used on logout)
- `updateReadingProgressLocal()` - Update reading progress in local storage only (for performance)
- `syncReadingProgressToBackend()` - Sync reading progress to backend API
- `updateArticleWithSync()` - Update article in both backend and local storage
- `deleteArticleWithSync(userId, articleId)` - Delete article from backend and local storage
- `updateArticleTagsWithSync(userId, articleId, tags)` - Update article tags in both backend and local storage

### hooks/use-article-actions.ts
Custom hook for article management with optimistic updates:
- `deleteArticle(articleId)` - Delete article with sync to backend
- `updateArticleTags(articleId, tags)` - Update article tags with sync
- `toggleFavorite(articleId)` - Toggle favorite status with optimistic update and rollback on error
- `markAsRead(articleId)` - Set reading progress to 100 with optimistic update and rollback on error
- `markAsUnread(articleId)` - Reset reading progress to 0 with optimistic update and rollback on error
- Used by Home, Library, Search, and Articles List screens to reduce code duplication

## Routing Structure

### File-Based Routing
Expo Router uses file-based routing similar to Next.js:

- `app/_layout.tsx` - Root layout with Stack navigator, AuthContext (session, appTheme, appFontSize), registers background sync
- `app/(tabs)/_layout.tsx` - Tab navigator with Home and Library tabs, account settings drawer
- `app/(tabs)/index.tsx` - Home tab with Continue Reading and New Articles sections
- `app/(tabs)/library.tsx` - Library tab with article filter tiles
- `app/articles/index.tsx` - Filtered article list screen
- `app/article/[id].tsx` - Article detail screen with reading progress tracking
- `app/search.tsx` - Full-screen search across all articles
- `app/auth.tsx` - Authentication screen

## API Integration

### Backend API
The app communicates with a self-hosted backend via `lib/api.ts`:
- **Authentication**: `signIn()`, `signUp()`, `signOut()`, `getSession()`
- **Forgot Password**: `forgotPassword()` - Request password reset email
- **Articles**: `getArticles()`, `saveArticle()`, `updateArticle()`, `deleteArticle()`
- **Bearer token auth**: Token stored in AsyncStorage, sent in Authorization header
- **User-scoped queries**: All article operations filter by authenticated user

### Environment Variables
API URL is configured via environment variable:

**Local Development:**
1. Create `.env` file with `API_URL=http://your-api-url`
2. `app.config.js` reads `.env` and exposes via `extra.apiUrl`
3. `lib/api.ts` reads via `expo-constants`

**EAS Builds:**
1. Set `API_URL` in `eas.json` under `build.<profile>.env`
2. EAS injects env vars during build
3. `app.config.js` reads `process.env.API_URL`

### Article Fields
- `id` (number) - Unique identifier
- `title`, `content`, `excerpt` - Article text (content is markdown)
- `url`, `siteName`, `author` - Metadata
- `wordCount` (number) - For reading time calculation
- `tags` (string) - Comma-delimited list
- `readingProgress` (number) - Reading progress 0-100%
- `isFavorite` (boolean) - Whether article is favorited
- `startedAt` (timestamp) - When first opened
- `finishedAt` (timestamp) - When finished reading
- `createdAt`, `updatedAt` (timestamps)
- `faviconLocalPath` (optional string) - Local path to cached favicon for offline placeholders
- `faviconBackgroundColor` (optional string) - Extracted color used as favicon placeholder background
- `previewImageUrl` (optional string) - Remote Open Graph/Twitter preview image URL
- `previewImageLocalPath` (optional string) - Local cached preview image path for offline cards

### Local Storage
- Articles cached in AsyncStorage with key `@poche_articles_{userId}`
- Incremental sync: Only fetches new articles not already in local storage
- Existing stored articles are backfilled with cached favicons/background colors on sync
- Offline support: Article detail view loads only from local storage
- **Cleared on logout**: `clearArticlesFromStorage()` removes all articles for user

## Onboarding Flow

1. App starts → Check `@poche_onboarding_complete` in AsyncStorage
2. If not complete → Show onboarding screens
3. User can skip or complete all slides
4. On completion → Mark as complete in AsyncStorage
5. Proceed to auth/main app flow

## Authentication Flow

1. App starts → AuthContext checks for existing session via `getSession()`
2. If onboarding incomplete → Show onboarding first
3. If no session → Shows Auth screen
3. User logs in/signs up → Backend authenticates, returns bearer token
4. Session stored → Token persisted in AsyncStorage
5. AuthContext updated → Navigation redirects to home
6. Background sync registered → Periodic article syncing enabled
7. Articles loaded → From local storage immediately, then synced from backend
8. User can view articles → With offline support
9. **User signs out** → Local articles cleared, session cleared

## UI/UX Features

### Theming
- **Unified theme system**: Three full color palettes (light, dark, sepia) in `constants/theme.ts`
- **`ResolvedColorScheme` type**: `'light' | 'dark' | 'sepia'` — the resolved scheme after applying user preference
- **Navigation themes**: `PocheLightTheme`, `PocheDarkTheme`, `PocheSepiaTheme` defined in `_layout.tsx`, each with a `resolvedScheme` property
- **`useResolvedColorScheme()` hook**: Reads `resolvedScheme` from the navigation theme (set by `ThemeProvider`); all components use this instead of system `useColorScheme()` for color decisions
- **`useThemeColor()` hook**: Updated to use resolved scheme — returns correct colors for light, dark, and sepia
- **`appTheme` state**: `'auto' | 'light' | 'sepia' | 'dark'` stored in `AuthContext`, persisted to AsyncStorage; 'auto' follows system preference
- **`appFontSize` state**: Reading font size (number, e.g. 14–26) in AuthContext, persisted to AsyncStorage (`@poche_app_font_size`); default 18; used by article markdown and `ReadingSettingsDrawer`
- Warm color palette: light background #FAFAF8, dark background #1C1A18, sepia background #F5ECD7
- Poche coral accent: #EF4056 (light mode), #F06B7E (dark mode), #D44A5C (sepia mode)
- Theme colors: text, textSecondary, textMuted, background, card, surface, border, divider, accent, accentLight, accentDark, icon, tabIconDefault, tabIconSelected, plus semantic colors
- Themed components (ThemedText, ThemedView) — both use `useThemeColor()` which resolves via navigation theme

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

### Environment Variables
Create a `.env` file:
```env
API_URL=http://localhost:3000  # or your backend URL
```

### Connecting to Local Backend
1. Start the backend with Docker: `docker compose -f docker-compose.dev.yml up`
2. Find your computer's local IP address (e.g., `192.168.1.100`)
3. Update `.env` with `API_URL=http://YOUR_IP:3000`
4. Ensure your phone and computer are on the same network

### Scripts
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `postinstall` - Automatically applies React Native patches via patch-package

### Building iOS with Patches
The app uses `buildReactNativeFromSource: true` to apply a native code patch for iOS text rendering. This means:
1. First iOS build will take significantly longer (10-20+ minutes) as React Native compiles from source
2. Subsequent builds are faster due to caching
3. To rebuild with a clean slate: `npx expo prebuild --clean && npx expo run:ios`

### Dependencies

Key dependencies:
- `expo` - Expo SDK
- `expo-router` - File-based routing
- `expo-blur` - Native blur effects
- `expo-image` - Optimized image component
- `expo-font` - Custom font loading
- `expo-splash-screen` - Splash screen management during font loading
- `expo-constants` - Access to app config and environment variables
- `@expo-google-fonts/bitter` - Bitter font for display/headers
- `@expo-google-fonts/source-sans-3` - Source Sans 3 font for body text
- `@react-native-async-storage/async-storage` - Local storage for articles and session
- `expo-background-task` - Background task management for article syncing
- `expo-task-manager` - Task manager for background tasks
- `expo-file-system/legacy` - Image downloading and caching for offline access
- `react-native-reanimated` - Smooth animations for article list
- `@poche/shared` - Shared types, utilities, API helpers, markdown parsing
- `patch-package` - Dev dependency for patching react-native source code

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

## Metro Configuration

The app uses a custom `metro.config.js` to resolve `@poche/shared` from outside the project directory:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, '../shared')];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, './node_modules'),
];
config.resolver.extraNodeModules = {
  '@poche/shared': path.resolve(__dirname, '../shared'),
};

module.exports = config;
```

## Recent Enhancements

- ✅ Migrated from Supabase to self-hosted backend
- ✅ Bearer token authentication via `lib/api.ts`
- ✅ AuthContext for session management
- ✅ **Forgot password flow**: Request password reset from auth screen
- ✅ Custom markdown renderer using shared parsing from `@poche/shared`
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
- ✅ Uses `@poche/shared` package for types, utilities, API helpers, markdown parsing
- ✅ Custom Poche color theme (warm tones, coral accent #EF4056)
- ✅ Tags displayed at top of article detail view
- ✅ iOS app icon asset catalog with all required sizes
- ✅ Bitter + Source Sans 3 fonts via `@expo-google-fonts`
- ✅ Font weight variants: Regular (400), Medium (500), SemiBold (600), Bold (700)
- ✅ Improved authentication error messaging with Better Auth error format handling
- ✅ Session expiry caching - only refreshes session when < 3 days until expiry
- ✅ React Native iOS text rendering patch for Fabric new architecture
- ✅ patch-package setup for maintaining React Native patches
- ✅ buildReactNativeFromSource enabled for applying native code patches
- ✅ **Environment variables**: API_URL via `.env` (local) and `eas.json` (EAS builds)
- ✅ **Metro bundler config**: Support for `@poche/shared` outside project directory
- ✅ **Clear articles on logout**: `clearArticlesFromStorage()` function
- ✅ **Shared API helpers**: Uses `@poche/shared` for endpoints, error parsing, session management
- ✅ **Shared markdown parsing**: Uses `@poche/shared` for tokenization and inline parsing
- ✅ **EAS Build**: Configured for iOS App Store and Google Play distribution
- ✅ **Store submissions**: iOS App Store and Google Play
- ✅ **Account deletion**: Delete account from account settings drawer with Alert.prompt (iOS)
- ✅ **Onboarding experience**: First-time user onboarding with swipeable slides
- ✅ **Animated onboarding dots**: Smooth pagination dot transitions using React Native Reanimated
- ✅ **Unified Button component**: Reusable button with primary, secondary, danger, ghost variants
- ✅ **SegmentedControl component**: Reusable mode switcher for auth screens
- ✅ **Favorite toggle**: Star icon on article cards and detail view with optimistic updates
- ✅ **Open original article**: External link button in article detail header
- ✅ **useArticleActions hook**: Consolidated article management (delete, tags, favorites) with optimistic updates
- ✅ **TagList component**: Self-contained reusable component for tag display/management (parsing, animated chips, add/remove, size prop)
- ✅ **ArticleCard simplification**: Tag logic moved to TagList; `tagToColor` no longer imported in ArticleCard
- ✅ **Article detail updates**: TagList integration, delete button in header, improved scroll restoration (opacity: 0), removed unused imports
- ✅ **Recently Read section**: Home tab shows 3 most recently finished articles (100% progress), sorted by `updatedAt`
- ✅ **All caught up logic**: Empty state only when Continue Reading, New Articles, and Recently Read are all empty
- ✅ **DropdownMenu component**: Reusable positioned dropdown with smart placement (above/below, left/right aligned), dark mode, auto-separators before destructive items
- ✅ **Article detail dropdown**: Header includes Open Original, Mark as Read, Mark as Unread, Delete
- ✅ **ArticleCard dropdown**: Ellipsis dropdown replaces direct delete button, includes Open Original, Mark as Read, Mark as Unread, Delete
- ✅ **Mark as Read**: Sets reading progress to 100, available in article detail and article cards via `useArticleActions` hook
- ✅ **Mark as Unread**: Resets reading progress to 0, available in article detail and article cards via `useArticleActions` hook
- ✅ **Icon mappings**: Added ellipsis, book.closed icons to `icon-symbol.tsx`
- ✅ **Reading progress bar**: Animated Reanimated bar below header (`useSharedValue` + `withTiming` 300ms), resets on mark-as-unread
- ✅ **Collapsible header**: `hidden` prop on Header component; slides up + fades out via Reanimated (250ms); preserves safe area inset height; driven by scroll direction detection in article screen (10px threshold, only after 80px scroll)
- ✅ **Absolute header overlay**: Article header/progress are overlaid (absolute) to keep ScrollView layout stable while collapsing
- ✅ **Continue reading button**: Floating pill below header; appears 15%+ above progress with hysteresis (hides at 5%); animated position tracks header collapse; hidden at 100% progress
- ✅ **Continue Reading horizontal rail**: Home tab Continue Reading section uses horizontal tiles with swipe affordance hints
- ✅ **Favicon placeholders**: Article cards use cached local favicon + extracted background color when no article image is available
- ✅ **Link preview caching**: `syncArticles()` fetches and caches `og:image`/`twitter:image` metadata per new article
- ✅ **Article card thumbnail priority**: `previewImageUrl` first, then markdown content image, then favicon, then default icon
- ✅ **Always-visible card progress bars**: Card progress bars now always render without percentage text
- ✅ **Unified theme system**: `Colors` palette expanded with `sepia` scheme; `ResolvedColorScheme` type; `useResolvedColorScheme()` hook reads from navigation theme's `resolvedScheme` property; all components migrated from `useColorScheme()` + `Colors[colorScheme]` to `useResolvedColorScheme()` + `Colors[resolvedScheme]`
- ✅ **Global theme selection**: `appTheme` (`'auto' | 'light' | 'sepia' | 'dark'`) in AuthContext, persisted to AsyncStorage; navigation `ThemeProvider` uses resolved theme (`PocheLightTheme`, `PocheDarkTheme`, `PocheSepiaTheme`)
- ✅ **BottomDrawer component**: Reusable bottom sheet (`components/bottom-drawer.tsx`) with Modal, swipe-to-dismiss (PanResponder + Reanimated), dimmed backdrop, slide animation, theme-aware colors
- ✅ **ReadingSettingsDrawer component**: Separate component with font size slider (`@react-native-community/slider`, configurable `FONT_SIZE_STEPS`) and theme selector; uses `appFontSize`/`setAppFontSize` and `appTheme`/`setAppTheme` from AuthContext; opened from tab header (paint palette) and article (paint palette button)
- ✅ **Global font size**: `appFontSize`/`setAppFontSize` in AuthContext (`app/_layout.tsx`), persisted to AsyncStorage; article screen uses `appFontSize` for markdown styles
- ✅ **Tab header**: Paint palette icon (reading settings) and person icon (account settings)
- ✅ **Account settings drawer**: Uses `BottomDrawer` in tab layout; person icon trigger; sign out + delete account (replaces separate `settings.tsx` screen)
- ✅ **Sepia theme**: Full color palette (text #3D3229, background #F5ECD7, card #EDE3CA, accent #D44A5C) with navigation theme and `Colors.sepia` palette

## Technical Notes

### Custom Markdown Renderer
The article detail view uses a custom `Markdown` component (`components/markdown.tsx`) that uses parsing from `@poche/shared`:

**Shared Parsing (`@poche/shared`):**
- `tokenize()` - Parse markdown into block tokens
- `parseInline()` - Parse inline elements
- `isValidImageUrl()` - Validate image URLs
- `resolveUrl()` - Resolve relative URLs

**Supported Elements:**
- Block elements: Headings (h1-h6), paragraphs, code blocks, blockquotes, lists, horizontal rules, tables, images
- Inline elements: Bold, italic, strikethrough, inline code, links, inline images

**Features:**
- Custom styles for all markdown elements
- `renderImage` prop for custom image rendering
- Image filtering: skips invalid URLs and images < 50x50 pixels
- Error handling: failed images are hidden gracefully
- Link styling: accent color with underline

### Image Caching Architecture
- `lib/image-cache.ts` contains utilities for extracting, downloading, and caching images
- Content images are stored in `${FileSystem.cacheDirectory}poche_images/{userId}/{articleId}/`
- Favicons are stored in `${FileSystem.documentDirectory}poche_favicons/{userId}/{articleId}/` and colorized placeholders are derived from generated thumbhash averages
- Link preview images are stored in `${FileSystem.documentDirectory}poche_link_previews/{userId}/{articleId}/`
- Both `index.tsx` and `background-sync.ts` use centralized `syncArticles()` function

### React Native iOS Text Rendering Patch
A patch is applied to React Native to fix a text cut-off issue on iOS with the new architecture (Fabric).

**The Problem**: When using `lineHeight` styles on iOS with React Native's new Fabric renderer, text can get truncated/cut off in certain cases due to floating-point rounding issues in text measurement.

**The Fix**: The patch modifies `RCTTextLayoutManager.mm` to add a small epsilon (0.001) to text size calculations.

**Configuration**:
- Patch file: `patches/react-native+0.81.5.patch`
- Applied automatically via `postinstall` script using `patch-package`
- Requires `buildReactNativeFromSource: true` in `app.json` experiments

## Future Enhancements

Potential features:
- Article organization (folders/categories)
- Article sharing
- Push notifications for new articles
- Article editing
- Enhanced sync conflict resolution
- Tag autocomplete/suggestions
- Bulk tag operations
- Tag colors customization
