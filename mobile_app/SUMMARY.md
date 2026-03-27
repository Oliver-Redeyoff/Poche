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
- **Continue Reading Rail**: Horizontally scrollable tile rail with peeked next card and snap scrolling
- **Library Page**: Tile grid for All Articles, Favorites, and tag-based filtering with article counts
- **Reading Progress Tracking**: Automatic scroll-based progress (0-100%) with local storage and backend sync; progress also saved when TTS playback is closed
- **Unified Theme System**: Light, dark, and sepia themes apply consistently across all screens; `Colors` palette has 3 schemes; `useResolvedColorScheme()` hook replaces direct `useColorScheme()` for color decisions
- **Global Theme Selection**: Users choose Auto, Light, Sepia, or Dark from the reading settings drawer; persisted to AsyncStorage
- **Global Font Size**: Reading font size (14–26) in AuthContext (`appFontSize`/`setAppFontSize`), persisted to AsyncStorage (`@poche_app_font_size`); applies to article markdown
- **Bottom Drawer Component**: Reusable `BottomDrawer` component (`components/bottom-drawer.tsx`) with swipe-to-dismiss (PanResponder + Reanimated), dimmed backdrop, slide animation; `onFullyDismissed` callback fires after modal animation completes (iOS `onDismiss`); used by reading settings and account settings
- **Reading Settings Drawer**: `ReadingSettingsDrawer` component (`components/reading-settings-drawer.tsx`); font size via `@react-native-community/slider` (configurable steps) and theme selector; opened from tab header (paint palette icon) and article screen (paint palette button)
- **Account Settings Drawer**: Uses `BottomDrawer`; shows signed-in user info with inline "Poche+" badge (premium) or "Upgrade to Premium" button, article usage progress bar (hidden for premium), sign out, and delete account; triggered by person icon in tab header
- **Premium subscription (iOS)**: RevenueCat integration via `react-native-purchases` + `react-native-purchases-ui`; native paywall via `RevenueCatUI.presentPaywall()`; entitlement `poche_plus`; paywall shown on 403 article limit error or from account settings Upgrade button; SDK configured in `_layout.tsx` with `logIn`/`logOut` tied to auth state; **RC SDK is the source of truth for `isPremium`** — `getCustomerInfo()` checks `poche_plus` entitlement on login; DB `activeSubscription` is only used server-side for enforcement
- **Sync progress bar**: 2px bar below the header in the tab layout; pulses opacity (full-width) while waiting for the API response ('fetching'), fills left-to-right as favicons/images download per-article ('processing'), then fades out on completion; implemented with React Native's built-in `Animated` API; `useSyncProgress()` hook (module-level pub/sub in `article-sync.ts`) feeds the component without prop drilling
- **Instant article display**: Articles appear in the UI as soon as the API call returns new articles; favicon, image, and link-preview processing happens in a fire-and-forget background IIFE with per-article progress reporting via `_setSyncState`; `onProcessingComplete` callback patches only enriched image/favicon fields into current UI state to avoid overwriting concurrent user edits
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
- **Share intent (Save to Poche)**: Share a web page from Safari (iOS) or system share sheet (Android) to Poche. **iOS**: Share Extension "Save to Poche" reads token and API URL from App Group, POSTs URL to backend, sets "just saved" flag, opens app; app checks flag on cold start and when returning to foreground (AppState), syncs and shows "Saved to Poche". **Android**: App receives share and opens with `poche://share?url=...` (in-app save from share route not yet implemented). Root layout writes/clears share credentials (iOS) and registers `share` route.
- **Neural TTS (Listen)**: On-device text-to-speech via Sherpa-ONNX using the Piper VITS model (`vits-piper-en_US-hfc_female-medium-int8`). Model bundled as a zip asset, extracted on first use. Uses `react-native-sherpa-onnx@^0.3.7` with CoreML provider for Apple Neural Engine acceleration and `numThreads: 4`. Headphones FAB in article starts playback from the beginning (FAB hidden when header is collapsed or TTS is active). Player bar shows article thumbnail, title, and author; tapping the left side navigates to the article. Controls: play/pause and speed (0.75×–2×). Article is marked as read (progress = 100%) only when playback fully completes — no intermediate progress updates from TTS.
- **TTS fast start**: Rolling-window chunked generation — generates exactly 3 segments per chunk (~1–3s to first audio). While chunk N plays, chunk N+1 is generated silently in the background using the alternating WAV slot (`tts-sherpa-{chunkNum % 2}.wav`). When chunk N finishes, chunk N+1 plays immediately (no gap) and chunk N+2 generation begins. Only the first chunk shows the spinner; subsequent chunks are invisible to the user. Gap handling: if background gen hasn't finished when the current chunk ends, playback parks at the chunk boundary; when the WAV completes it detects the gap and resumes. The rendezvous between `didJustFinish` and `onWavReady` is race-condition-free because both run on the JS thread.
- **TTS player bar layout**: Single unified row for non-installing state: `[article info (flex:1)] [play slot] [speed] [×]`. The play slot is a fixed 34×34 container holding both the `CircularProgress` ring and the play/pause button overlaid — only their opacity changes, so no layout shift when generation finishes. Cross-fade is driven by `generatingAnim` (Animated.Value, 250ms, native driver): loader fades out, button fades in; `pointerEvents` swaps so the invisible element can't receive touches. Speed button has fixed `width: 36` to prevent layout shift across speed values. Installing state shows `[spinner + label (flex:1)] [×]` in the same row structure.
- **TTS generating UI**: `CircularProgress` ring uses a two-semicircle clip technique (no SVG) with solid D-shaped fills and a center hole. Progress is `generationProgress + 0.25` (native 0–1 offset by ¼ for an optimistic head-start), animated with a 1500ms ease. `stopAnimation()` is called before each new `Animated.timing` to prevent animation pile-up on rapid progress updates.
- **TTS background audio**: `setAudioModeAsync` params (`playsInSilentMode: true, shouldPlayInBackground: true`) so audio continues when the app is backgrounded mid-playback. Requires `audio` in `UIBackgroundModes` in `ios/Poche/Info.plist` — the simulator ignores this but real devices enforce it (was missing despite being declared in `app.json`, which only applies during `expo prebuild`).
- **TTS lock screen / Control Center**: `expo-media-control` (plugin in `app.json`, `enableBackgroundAudio: false` since background modes are already set) shows the article title, author, and `previewImageUrl` thumbnail in the iOS Now Playing card on the lock screen and in Control Center. Play/pause commands from the lock screen, Control Center, and headphones are wired back into the TTS context via `addListener`. Managed in `tts-context.tsx`: `enableMediaControls({ capabilities: [Command.PLAY, Command.PAUSE] })` on start, `updateMetadata` + `updatePlaybackState` on each state change, `disableMediaControls` on close. Duration estimated from `article.wordCount / 2.5` seconds.

## Architecture

### Technology Stack

- **Framework**: React Native with Expo SDK ~55
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Navigation**: Expo Router with Stack navigator; standard `Tabs` from `expo-router` for the Home/Library tab bar
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
│   ├── _layout.tsx        # Root layout (Stack navigator, AuthContext, TtsProvider, onboarding check)
│   ├── (tabs)/            # Tab navigator group
│   │   ├── _layout.tsx    # Tab layout (Home & Library tabs, account settings drawer, TTS overlay)
│   │   ├── (home)/
│   │   │   └── library.tsx  # Home tab - Continue Reading, New Articles & Recently Read sections
│   │   └── (library)/
│   │       └── library.tsx  # Library tab - All Articles, Favorites, Tags tiles
│   ├── article/
│   │   └── [id].tsx       # Article detail screen (root Stack — full-screen, tab bar hidden)
│   ├── articles/
│   │   └── library.tsx      # Filtered article list (by tag, favorites, or all)
│   ├── search.tsx         # Full-screen search with filtering across all articles
│   ├── share.tsx          # Share deep-link route (redirects to onboarding/auth/tabs)
│   ├── auth.tsx           # Authentication screen (login/signup/forgot password)
│   └── onboarding.tsx     # First-time user onboarding experience
├── components/            # React components
│   ├── button.tsx         # Unified Button component (primary, secondary, danger, ghost variants)
│   ├── segmented-control.tsx # Segmented control for mode switching
│   ├── article-card.tsx   # Article card with TagList, progress bar, delete, animations
│   ├── tag-list.tsx       # Reusable TagList component for displaying and managing tags
│   ├── bottom-drawer.tsx  # Reusable bottom sheet drawer with swipe-to-dismiss
│   ├── reading-settings-drawer.tsx # Font size slider + theme selector (uses AuthContext)
│   ├── dropdown-menu.tsx  # Reusable native context menu wrapper
│   ├── header.tsx         # Custom header component with logo, back button, and collapsible animation
│   ├── markdown.tsx       # Custom markdown-to-React-Native renderer (uses @poche/shared)
│   ├── tts-player-bar.tsx # TTS playback controls bar — uses useTtsContext() directly; single unified row with fixed 34×34 play slot that cross-fades between CircularProgress (generating) and play/pause button (playing) via generatingAnim; article info tappable (navigates to article); speed button fixed width 36; close button always rightmost; returns null when TTS inactive
│   ├── themed-text.tsx    # Themed text component
│   ├── themed-view.tsx    # Themed view component
│   └── ...
├── lib/
│   ├── api.ts            # API client (uses @poche/shared helpers)
│   ├── background-sync.ts # Background task for syncing articles
│   ├── article-sync.ts   # Centralized article sync logic with reading progress updates
│   ├── image-cache.ts    # Image extraction, downloading, and caching utilities
│   ├── model-manager.ts  # TTS model lifecycle (check, install from bundle, get paths, delete)
│   ├── sherpa-tts-engine.ts # Singleton wrapper around react-native-sherpa-onnx (Kokoro, CoreML); optional onProgress callback (0.0–1.0 from chunk.progress)
│   └── tts-extract.ts    # Extracts TtsSegments from tokenized markdown (maps token index → text)
├── contexts/
│   └── tts-context.tsx   # Global TTS context (TtsProvider, useTtsContext) — all TTS logic lives here; persists across navigation; rolling-window chunked generation (CHUNK_SIZE=3, alternating WAV slots); sherpaPlayChunkRef plays a chunk and schedules the next via scheduleNextChunkGenerationRef; exposes isGenerating/generationProgress (spinner only on chunk 0); marks article read (progress=100) on natural completion only
├── hooks/                # Custom React hooks
│   ├── use-article-actions.ts  # Article management hook (delete, tags, favorites)
│   ├── use-color-scheme.ts     # Re-exports useColorScheme + useResolvedColorScheme() hook
│   ├── use-color-scheme.web.ts # Web variant with hydration support
│   └── use-theme-color.ts     # Returns colors from resolved theme (light/dark/sepia)
├── constants/
│   └── theme.ts          # Colors (light/dark/sepia palettes), ResolvedColorScheme type, Fonts
├── patches/              # React Native patches (applied via patch-package)
│   └── react-native+0.83.2.patch  # iOS text rendering fix (epsilon rounding for usedRectForTextContainer)
├── ios/
│   ├── Poche/            # Main app target
│   │   ├── PendingShareModule.swift  # Native module: getShareExtensionJustSaved, setShareCredentials, clearShareCredentials (App Group)
│   │   └── PendingShareModule.m      # Objective-C bridge for PendingShareModule
│   └── ShareExtension/   # iOS Share Extension ("Save to Poche")
│       ├── ShareViewController.swift # Share UI (spinner + status), POST to API, open app
│       ├── Info.plist
│       └── ShareExtension.entitlements  # App Group group.org.name.Poche
├── metro.config.js       # Metro bundler config for @poche/shared
├── app.config.js         # Expo config with environment variables
├── eas.json              # EAS Build configuration with env vars
├── .env.example          # Example environment variables
├── package.json          # Dependencies (includes @poche/shared)
├── SHARE_FEATURE_REVIEW.md  # Review of share-intent code and Android gap
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

### app/(tabs)/(home)/library.tsx
Home tab that:
- Displays "Continue Reading" section with in-progress articles (1-99% progress)
- Renders Continue Reading as a horizontal rail with peek + snap behavior
- Displays "New Articles" section with unread articles (0% progress)
- Displays "Recently Read" section with 3 most recently finished articles (100% progress), sorted by `updatedAt`
- Shows "all caught up" empty state only when all three sections are empty
- Uses `useFocusEffect` to reload data when tab comes into focus
- Handles article deletion and tag updates

### app/(tabs)/(library)/library.tsx
Library tab that:
- Displays tile grid with All Articles, Favorites, and tag-based filters
- Shows article counts for each tile
- Calculates tile widths dynamically based on screen size
- Navigates to filtered article list on tile press
- Uses `useFocusEffect` to reload data when tab comes into focus

### app/articles/library.tsx
Filtered article list screen:
- Receives filter type and value via URL params (all, favorites, tag)
- Displays filtered articles in a scrollable list
- Shows appropriate empty states for each filter type
- Handles article deletion and tag updates

### app/share.tsx
Share deep-link route (opened when user shares to Poche via `poche://share`):
- Shows a spinner and redirects to `/onboarding`, `/auth`, or `/(tabs)` based on `hasCompletedOnboarding` and `session`
- No URL handling; on iOS the Share Extension saves the article before opening the app

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
- Home and Library tabs via standard `Tabs` from `expo-router`
- **Header**: Poche logo and two icon buttons — paint palette (opens `ReadingSettingsDrawer`), person (opens account settings drawer)
- **SyncProgressBar**: Absolutely positioned 2px bar rendered below the header; uses React Native's built-in `Animated` API (not Reanimated); pulses opacity at full width during 'fetching', fills as a progress bar during 'processing', fades out on 'done'; `pointerEvents="none"` ensures it never intercepts touches
- **TTS overlay**: When `tts.isActive`, an absolute-positioned bar appears above the standard tab bar (`bottom: insets.bottom + 49`) with `TtsPlayerBar` controls
- **Reading settings drawer**: `ReadingSettingsDrawer` (font size + theme); triggered by paint palette icon
- **Account settings drawer**: `BottomDrawer` triggered by person icon; signed-in user info with inline "Poche+" badge (if `poche_plus` entitlement active, styled with `Bitter_700Bold` `+`) or "Upgrade to Premium" button (iOS only), article usage progress bar (hidden for premium), Sign Out, Delete Account
- **Upgrade flow**: "Upgrade to Premium" sets `paywallAfterDismiss` ref and closes drawer; `onFullyDismissed` presents `RevenueCatUI.presentPaywall()` after drawer animation; updates `isPremium` state on success
- Sign out clears local articles via `clearArticlesFromStorage(userId)` and calls `Purchases.logOut()` before signing out
- Delete account with password confirmation (iOS `Alert.prompt`, Android directs to web app)

### components/bottom-drawer.tsx
Reusable bottom sheet drawer component:
- `Modal` with transparent background and fade animation for backdrop
- Animated sheet slides up from bottom with drag handle
- **Swipe-to-dismiss**: `PanResponder` detects downward drag; dismisses on 60px threshold or velocity > 0.5
- `Reanimated` slide animation (250ms in, 200ms out)
- Adapts colors from current theme via `useResolvedColorScheme()` and `Colors` palette
- Handles safe area insets for bottom padding
- **Props**: `visible` (boolean), `onDismiss` (callback), `onFullyDismissed?` (fires after iOS modal animation fully completes via `Modal.onDismiss`), `children` (ReactNode)
- `onFullyDismissed` used to safely present native RevenueCat paywall after drawer is gone (avoids view controller hierarchy conflict where presenting a native VC while the React Native Modal is still in the hierarchy causes immediate dismissal)
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
Reusable native context menu wrapper:
- Uses `@expo/ui/swift-ui` `ContextMenu` on native with `Host`, `ContextMenu.Trigger`, `ContextMenu.Items`, `Button`, and `Divider`
- Supports `openOnLongPress` via `activationMethod` (`longPress` vs `singlePress`)
- Renders SF Symbol icons via icon mapping and marks destructive actions with `role="destructive"`
- **Props**: `trigger` (ReactNode), `items` (array of `DropdownMenuItem` with `key`, `label`, optional `icon`, optional `destructive`, `onPress`), `openOnLongPress?`
- Used by article detail view and `ArticleCard` component

### components/article-card.tsx
Article card component:
- Renders individual article card with title, site name, reading time, and optional image
- Handles navigation to article detail page
- **Image priority**: Uses `previewImageUrl` first, then first image extracted from markdown content, then favicon placeholder, then default icon
- Uses locally cached favicon placeholders (with extracted background colors) when no preview/content image exists
- **Favorite toggle**: Star icon (outline when not favorited, filled gold when favorited)
- **Dropdown menu**: Ellipsis icon opens `DropdownMenu` with Open Original, Mark as Read, Mark as Unread, and Delete (destructive) options
- **Long-press actions**: Card root uses `openOnLongPress` so pressing and holding any card opens actions directly
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
- **Reading progress bar**: Thin 3px bar fixed below the article header (inside `topOverlay`); fills to scroll-based reading progress (0–100%)
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
- **Sync progress pub/sub**: Module-level `_syncState` + `_syncListeners` set; `_setSyncState()` broadcasts to all listeners; `useSyncProgress()` React hook subscribes and returns current `SyncProgressState`
- `SyncStatus` — `'idle' | 'fetching' | 'processing' | 'done'`
- `SyncProgressState` — `{ status: SyncStatus, progress: number }` (progress is 0–1)
- `syncArticles()` — fetches new articles, merges + saves immediately so UI can render, then fires a background IIFE that processes favicons/images/previews per-article with granular progress reporting; accepts `onProcessingComplete` callback; uses `_setSyncState` throughout to drive `SyncProgressBar`
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

- `app/_layout.tsx` - Root layout with Stack navigator, AuthContext (session, appTheme, appFontSize), TtsProvider (global TTS state), registers background sync, Share Extension credentials (iOS), share "just saved" check on init and AppState foreground
- `app/(tabs)/_layout.tsx` - Tab navigator with Home and Library tabs, account settings drawer, global TTS overlay above tab bar
- `app/(tabs)/(home)/library.tsx` - Home tab with Continue Reading and New Articles sections
- `app/(tabs)/(library)/library.tsx` - Library tab with article filter tiles
- `app/article/[id].tsx` - Article detail screen with reading progress tracking and TTS (pushed onto root Stack — full-screen, tab bar hidden)
- `app/articles/library.tsx` - Filtered article list screen
- `app/search.tsx` - Full-screen search across all articles
- `app/share.tsx` - Share deep-link route (redirects by auth state)
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
API URL and RevenueCat key are configured via environment variables:

**Local Development:**
1. Create `.env` file with `API_URL=http://your-api-url` and `REVENUECAT_IOS_KEY=appl_...`
2. `app.config.js` reads `.env` and exposes via `extra.apiUrl` and `extra.revenueCatIosKey`
3. `lib/api.ts` / `app/_layout.tsx` read via `expo-constants`

**EAS Builds:**
1. Set `API_URL` and `REVENUECAT_IOS_KEY` in `eas.json` under `build.<profile>.env`
2. EAS injects env vars during build
3. `app.config.js` reads `process.env.API_URL` and `process.env.REVENUECAT_IOS_KEY`

Note: `REVENUECAT_IOS_KEY` is a public iOS SDK key (safe to commit). The webhook secret (`REVENUECAT_WEBHOOK_SECRET`) lives only in the backend `.env` and must never be committed.

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
10. **Share from Safari (iOS)** → User taps Share → "Save to Poche" → Extension POSTs URL to API, sets "just saved" flag, opens app → App (on init or when coming to foreground) calls `getShareExtensionJustSaved()`, syncs, shows "Saved to Poche"

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
- `react-native-purchases` - RevenueCat SDK for iOS in-app purchases
- `react-native-purchases-ui` - RevenueCat native paywall UI (`RevenueCatUI.presentPaywall()`)
- `react-native-sherpa-onnx-offline-tts` - Neural TTS synthesis (Sherpa-ONNX / Piper VITS) → WAV file; requires iOS 16.0
- `expo-audio` - WAV file playback with completion callbacks (replaced expo-av which was SDK 55 incompatible)
- `react-native-zip-archive` - Model zip extraction (SSZipArchive; requires raw paths, no `file://` scheme)
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
- **Share Extension** ("Save to Poche"): App Group `group.org.name.Poche` for token/API URL and "just saved" flag; extension POSTs to `/api/articles` and opens app with `poche://share`; `PendingShareModule` (Swift + ObjC) bridges App Group to JS

### Android
- Material Design elements
- **Share target**: App appears in share sheet for `text/plain`; MainActivity rewrites intent to `poche://share?url=...`. In-app save from share route not yet implemented (see SHARE_FEATURE_REVIEW.md).
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
- ✅ **DropdownMenu component**: Reusable native context menu wrapper using `@expo/ui/swift-ui` on native
- ✅ **Article detail dropdown**: Header includes Open Original, Mark as Read, Mark as Unread, Delete
- ✅ **ArticleCard dropdown**: Ellipsis dropdown replaces direct delete button, includes Open Original, Mark as Read, Mark as Unread, Delete
- ✅ **Long-press card menu**: Article cards open actions on long press using `openOnLongPress`
- ✅ **Mark as Read**: Sets reading progress to 100, available in article detail and article cards via `useArticleActions` hook
- ✅ **Mark as Unread**: Resets reading progress to 0, available in article detail and article cards via `useArticleActions` hook
- ✅ **Icon mappings**: Added ellipsis, book.closed icons to `icon-symbol.tsx`
- ✅ **Reading progress bar**: Animated Reanimated bar below header (`useSharedValue` + `withTiming` 300ms), resets on mark-as-unread
- ✅ **Collapsible header**: `hidden` prop on Header component; slides up + fades out via Reanimated (250ms); preserves safe area inset height; driven by scroll direction detection in article screen (10px threshold, only after 80px scroll)
- ✅ **Absolute header overlay**: Article header/progress are overlaid (absolute) to keep ScrollView layout stable while collapsing
- ✅ **Continue reading button**: Floating pill below header; appears 15%+ above progress with hysteresis (hides at 5%); animated position tracks header collapse; hidden at 100% progress
- ✅ **Continue Reading horizontal rail**: Home tab Continue Reading section uses horizontal tiles with peek + snap behavior
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
- ✅ **Share intent (Save to Poche)**: iOS Share Extension with status UI ("Saving to Poche…", "Saved!", "Opening Poche…", "No link found"); extension saves via API using token/API URL from App Group; native `PendingShareModule` (getShareExtensionJustSaved, setShareCredentials, clearShareCredentials); `share.tsx` route; "just saved" check on cold start and when app comes to foreground (AppState). Android: share target opens app with `poche://share?url=...` (in-app save not yet implemented — see SHARE_FEATURE_REVIEW.md).
- ✅ **RevenueCat monetization (iOS)**: `react-native-purchases` + `react-native-purchases-ui`; `Purchases.configure({ apiKey })` in `_layout.tsx` init; `Purchases.logIn(userId)` on auth, `Purchases.logOut()` on sign-out; `RevenueCatUI.presentPaywall()` for native paywall; entitlement ID `poche_plus`; paywall triggered on 403 "Article limit reached" error and from account settings Upgrade button; `paywallAfterDismiss` ref + `onFullyDismissed` callback pattern prevents view controller hierarchy conflicts
- ✅ **BottomDrawer `onFullyDismissed`**: New prop forwarded to `Modal.onDismiss` (fires on iOS after modal animation fully completes); enables safe native VC presentation after drawer is fully dismissed
- ✅ **Standard Tabs**: Tab bar uses `Tabs` from `expo-router`; previous `NativeTabs` (unstable-native-tabs) removed due to missing `minimizeBehavior` support in react-native-screens
- ✅ **Global TTS context**: All TTS logic lives in `contexts/tts-context.tsx`; `TtsProvider` wraps root layout so TTS state persists across navigation; `setContent()` synchronously updates `segmentsRef.current`; `setAudioModeAsync` for background audio; marks article read (progress=100) only on natural playback completion — `close()` no longer saves progress
- ✅ **Global TTS player bar**: `TtsPlayerBar` rendered as absolute overlay in `(tabs)/_layout.tsx` above standard tab bar; article screen shows its own inline `TtsPlayerBar` (only when TTS active — returns null otherwise); zero props; play/pause and speed controls only (no skip)
- ✅ **TTS listen FAB**: Single headphones `Pressable` FAB in article screen starts playback from the beginning; FAB hidden when header is collapsed or TTS is active
- ✅ **Instant article display**: `syncArticles()` now shows articles immediately after API response; background IIFE handles per-article favicon/image/link-preview processing with granular progress; `onProcessingComplete` callback patches only enriched fields into UI state to avoid overwriting concurrent edits
- ✅ **Sync progress bar**: `SyncProgressBar` component in tab `_layout.tsx`; 2px bar below header; opacity pulse during 'fetching', fill progress during 'processing', fade-out on done; built with React Native built-in `Animated` (not Reanimated) to avoid native tab conflicts; `useSyncProgress()` hook in `article-sync.ts` uses module-level pub/sub (no prop drilling)
- ✅ **`processSingleArticleFavicon` / `processSingleArticleLinkPreview`**: New per-article functions in `lib/image-cache.ts` enabling per-article progress tracking during background sync (replaces batch-only approach)
- ✅ **Neural TTS engine**: `react-native-sherpa-onnx-offline-tts` with Piper VITS model `vits-piper-en_US-hfc_female-medium-int8` (Sherpa-only, no system voice fallback); auto-installs on first "Listen" tap with spinner UI; generation token pattern cancels stale async ops; `tts-player-bar.tsx` UI; reading progress bar moved to article header overlay; iOS deployment target 16.0; metro config bundles `.zip` assets; TTS state lives in global `TtsProvider`
- ✅ **Theme color hooks**: All components use `useThemeColor({}, 'colorName')` and `useResolvedColorScheme()` instead of raw `useTheme().colors.*`; tab bar `backgroundColor` and `borderTopColor` sourced from theme; `Colors` palette is the single source of truth for all three schemes (light, dark, sepia)

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
- Both `library.tsx` and `background-sync.ts` use centralized `syncArticles()` function

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
- **Android share**: Save article when app opens via share intent (read `url` in `share.tsx`, call `saveArticle` when logged in)
- Article organization (folders/categories)
- Article sharing
- Push notifications for new articles
- Article editing
- Enhanced sync conflict resolution
- Tag autocomplete/suggestions
- Bulk tag operations
- Tag colors customization
