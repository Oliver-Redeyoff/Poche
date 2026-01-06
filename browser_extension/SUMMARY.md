# Poche Browser Extension - Summary

## Overview

The Poche browser extension allows users to save articles from any webpage to their Poche account. It works across Chrome, Firefox, and Safari browsers.

## Features

- **Authentication**: Email/password login and signup within the extension popup
- **Forgot Password**: Request password reset email from login screen
- **Token-Based Auth**: Bearer token authentication stored in browser extension storage
- **Article Saving**: Sends URLs to backend for server-side extraction
- **Cross-Browser Support**: Works with Chrome (Manifest V3), Firefox, and Safari
- **Saved Article Tracking**: Tracks which URLs have already been saved to prevent duplicate saves
- **Smart Button State**: "Save Article" button automatically disables and shows "Already Saved" if the current URL is already saved
- **Automatic Sync**: Syncs saved article list from backend on popup open to reflect deletions from mobile app
- **Tag Input**: Specify comma-delimited tags before saving articles
- **Shared Types**: Uses `@poche/shared` npm package for common types, utilities, and colors
- **Light/Dark Mode**: Automatic theme switching based on system preferences

## Architecture

### Technology Stack

- **Build Tool**: Vite (migrated from Webpack)
- **Language**: TypeScript
- **UI Framework**: React
- **Bundler**: Vite with `crxjs/vite-plugin` for Manifest V3
- **Backend**: Self-hosted Poche API with Better Auth
- **Storage**: Chrome/Firefox storage API for bearer token and user data persistence
- **Shared Package**: `@poche/shared` npm package for types, API helpers, and colors

### File Structure

```
browser_extension/
├── src/
│   ├── popup.tsx         # Entry point with color scheme setup
│   ├── popup.html        # Popup HTML structure
│   ├── popup.css         # Global popup styles (reset, body, buttons)
│   ├── App.tsx           # Main app component with state management
│   ├── App.css           # App wrapper styles
│   ├── background.ts     # Background service worker (TypeScript)
│   ├── vite-env.d.ts     # Vite environment type declarations
│   ├── assets/           # Static assets (icons, images)
│   ├── components/       # Extracted React components
│   │   ├── index.ts      # Barrel file for exports
│   │   ├── Header.tsx    # Header component
│   │   ├── Header.css    # Header styles
│   │   ├── StatusMessage.tsx  # Status message component
│   │   ├── StatusMessage.css  # Status message styles
│   │   ├── LoadingSpinner.tsx  # Loading spinner component
│   │   ├── LoadingSpinner.css  # Loading spinner styles
│   │   ├── AuthModeSwitch.tsx  # Auth mode switch component
│   │   ├── AuthModeSwitch.css  # Auth mode switch styles
│   │   ├── TagsInput.tsx  # Tags input component
│   │   ├── TagsInput.css  # Tags input styles
│   │   ├── LoginSection.tsx  # Login/signup/forgot password forms
│   │   ├── LoginSection.css  # Login section styles
│   │   ├── MainSection.tsx  # Main logged-in view
│   │   ├── MainSection.css  # Main section styles
│   │   ├── Logo.tsx      # Logo component
│   │   └── Logo.css      # Logo styles
│   └── lib/
│       ├── api.ts        # Backend API client (uses @poche/shared)
│       ├── types.ts      # Extension-specific types
│       └── storage.ts    # Browser storage utilities for saved articles
├── icons/                # Extension icons (16x16, 48x48, 128x128)
├── dist/                 # Built extension files (generated)
├── manifest.json         # Extension manifest (Manifest V3)
├── package.json          # Dependencies and build scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── SUMMARY.md            # This file
```

**Note**: Shared types, utilities, and colors are imported from `@poche/shared` (located at `../shared`).

## Component Architecture

### Extracted Components

Each component has its own TypeScript file and corresponding CSS file with nested styles:

| Component | Description |
|-----------|-------------|
| `Logo` | Poche logo with image and text |
| `Header` | Extension header with logo |
| `StatusMessage` | Success/error/info status messages |
| `LoadingSpinner` | Animated loading spinner |
| `AuthModeSwitch` | Toggle between sign in/sign up/forgot password |
| `TagsInput` | Tag input with chips display |
| `LoginSection` | Complete auth forms (login, signup, forgot password) |
| `MainSection` | Logged-in view with URL display and save button |

### CSS Organization

- **`popup.css`**: Global reset, body, and button styles only
- **`App.css`**: App wrapper styles
- **Component CSS**: Each component has scoped styles in its own `.css` file
- **Nested Selectors**: All CSS uses nested selectors for better encapsulation
- **Dynamic Color Variables**: Colors are set via JavaScript based on `prefers-color-scheme`

### Entry Point (`popup.tsx`)

The entry point handles:
1. Importing colors from `@poche/shared`
2. Detecting system color scheme via `prefers-color-scheme`
3. Setting CSS variables on `document.documentElement`
4. Listening for color scheme changes
5. Rendering the `App` component

## Key Components

### App.tsx
Main application component:
- Session state management (user, token, loading)
- Status message handling
- Authentication flow coordination
- Conditionally renders `LoginSection` or `MainSection`

### LoginSection.tsx
Handles all authentication forms:
- Sign in form
- Sign up form
- Forgot password form
- Mode switching via `AuthModeSwitch`
- Form validation and error handling

### MainSection.tsx
Logged-in user view:
- Displays current page URL
- Save article button with state management
- Tags input for specifying article tags
- Shows "Already Saved" when URL is in saved list
- Sign out button

### lib/api.ts
Backend API client using `@poche/shared`:
- Uses shared `API_ENDPOINTS` for endpoint definitions
- Uses shared `parseApiError()` for error handling
- Uses shared `shouldRefreshSession()`, `isSessionExpired()`, `calculateSessionExpiry()`
- Token and user data storage in browser extension storage API

### lib/storage.ts
Browser storage utilities:
- `getSavedArticlesStorageKey(userId)` - Generate storage key
- `getSavedArticles(userId)` - Get saved articles from storage
- `saveArticleToStorage(userId, url, id)` - Save article to storage
- `syncSavedArticlesFromBackend(userId, articles)` - Sync from backend
- `checkIfUrlIsSaved(userId, url)` - Check if URL is already saved

### lib/types.ts
Extension-specific TypeScript types:
- `SavedArticles` - Map of URL to article ID
- `StatusType` - 'success' | 'error' | 'info' | 'loading'
- `AuthMode` - 'signin' | 'signup' | 'forgot'
- Component props interfaces

## How It Works

1. **User clicks extension icon** → Opens popup
2. **popup.tsx initializes** → Sets up color scheme, renders App
3. **App checks auth** → Validates session via API
4. **If not logged in** → Shows LoginSection
5. **User authenticates** → Bearer token stored in browser storage
6. **On popup open** → Syncs saved articles from backend to local storage
7. **Button state checked** → If current URL is already saved, button is disabled
8. **User navigates to article** → Clicks "Save Article" button (if not already saved)
9. **URL sent to backend** → Backend extracts article using Defuddle
10. **Article saved** → Backend stores in PostgreSQL
11. **Article tracked locally** → URL and ID added to local storage
12. **Success feedback** → User sees confirmation message
13. **Button updates** → Button state updated to show "Already Saved"

## Light/Dark Mode

The extension implements automatic light/dark mode based on system preferences:

1. **`popup.tsx`** imports colors from `@poche/shared`
2. On initial load, checks `prefers-color-scheme` media query
3. Sets CSS variables on `document.documentElement` based on color scheme
4. Adds event listener for `change` event to update colors when system theme changes
5. All CSS uses these CSS variables for colors

```typescript
// In popup.tsx
import { colors } from '@poche/shared'

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function applyColorScheme(isDark: boolean) {
  const scheme = isDark ? 'dark' : 'light'
  const c = colors[scheme]
  document.documentElement.style.setProperty('--color-brand-primary', c.brand.primary)
  // ... set all color variables
}

applyColorScheme(mediaQuery.matches)
mediaQuery.addEventListener('change', (e) => applyColorScheme(e.matches))
```

## Backend Integration

### Authentication Flow
1. User enters email/password
2. Extension calls `POST /api/auth/sign-in/email` or `POST /api/auth/sign-up/email`
3. Backend (Better Auth with bearer plugin) returns session with `token`
4. Extension stores token and user data in `chrome.storage.local`
5. All subsequent API calls include `Authorization: Bearer <token>` header
6. Session validation on popup open - if invalid, clears local storage and shows login

**Note**: Cookie-based auth doesn't work for browser extensions due to cross-origin restrictions. Bearer tokens stored in extension storage are the solution.

### API Endpoints Used
- `POST /api/auth/sign-up/email` - Create account
- `POST /api/auth/sign-in/email` - Sign in
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/get-session` - Validate session
- `POST /api/auth/request-password-reset` - Request password reset email
- `GET /api/articles` - List saved articles
- `POST /api/articles` - Save article from URL
- `PATCH /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Articles Table Schema
The backend stores articles with the following fields:
- `userId` (string, required) - Links article to user
- `title` (string, nullable) - Article title
- `content` (string, nullable) - Parsed markdown content
- `excerpt` (string, nullable) - Article excerpt
- `url` (string, nullable) - Original article URL
- `siteName` (string, nullable) - Website name
- `author` (string, nullable) - Article author
- `wordCount` (integer, nullable) - Word count for reading time
- `tags` (string, nullable) - Comma-delimited list of tags
- `createdAt`, `updatedAt` (timestamps)

### Saved Article Tracking
- Stores list of saved article URLs and IDs per user in browser storage
- Key format: `poche_saved_articles_{userId}`
- Synced from backend on popup open to reflect deletions
- Used to disable save button for already-saved URLs

## Build Process

### Development
```bash
npm install          # Install dependencies
npm run dev          # Watch mode for development
npm run build        # Production build
```

### Browser-Specific Builds
```bash
npm run build:chrome   # Build for Chrome
npm run build:firefox   # Build for Firefox
npm run build:safari    # Build for Safari
```

### Icon Generation
```bash
npm run icons        # Generate placeholder icons
```

## Installation

### Chrome/Edge
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `manifest.json` from `dist` folder

### Safari
1. Enable Develop menu in Safari preferences
2. Open Safari > Develop > Extension Builder
3. Import extension from `safari` folder

## Permissions

The extension requires:
- `activeTab` - Access to current tab URL
- `storage` - Store authentication token and saved articles
- `scripting` - Inject content scripts (if needed)
- `host_permissions: <all_urls>` - Access to all websites for reading URLs

## Content Security Policy

- No external script loading
- All code is bundled and self-contained
- API calls to backend only

## Error Handling

- Comprehensive error messages for users
- Console logging for debugging
- Token refresh/expiration handling
- Network error recovery

## Known Limitations

- Cannot save from browser internal pages (chrome://, about:, etc.) - button shows "Cannot Save This Page"
- Some pages may not extract correctly due to structure
- Requires internet connection for API operations
- Safari requires additional setup and code signing for distribution
- Saved article list syncs on popup open, not in real-time

## Recent Enhancements

- ✅ Migrated from Supabase to self-hosted backend
- ✅ Token-based authentication (bearer tokens)
- ✅ Removed client-side article parsing (now done server-side)
- ✅ Sign in/sign up mode switch UI
- ✅ **Forgot password flow**: Request password reset from login screen
- ✅ Converted to React with TypeScript
- ✅ Saved article URL tracking in browser storage
- ✅ Smart save button state management
- ✅ Automatic sync of saved articles from backend on popup open
- ✅ Prevention of duplicate article saves
- ✅ Tag input UI for specifying tags before saving articles
- ✅ Uses `@poche/shared` package for types and utilities
- ✅ Bitter + Source Sans 3 fonts via Google Fonts
- ✅ Error status popup for sign-in/sign-up failures with meaningful messages
- ✅ Loading spinner while checking auth status (prevents auth UI flash)
- ✅ Session expiry caching - only refreshes session when < 3 days until expiry
- ✅ **Migrated from Webpack to Vite** for faster builds and modern tooling
- ✅ Asset handling with Vite imports (images bundled correctly)
- ✅ **Component-based refactor**: Extracted Header, StatusMessage, LoadingSpinner, AuthModeSwitch, TagsInput, LoginSection, MainSection, Logo, App components
- ✅ **Scoped CSS**: Each component has its own CSS file with nested styles
- ✅ **Lib organization**: Separated types and storage utilities into `lib/` folder
- ✅ **Shared API helpers**: Uses `@poche/shared` for API endpoints, error parsing, session management
- ✅ **Shared colors**: Uses `@poche/shared` color palette
- ✅ **Light/dark mode**: Automatic switching based on `prefers-color-scheme`

## Future Enhancements

Potential improvements:
- Real-time sync of saved articles (not just on popup open)
- Article preview before saving
- Batch article saving
- Tag autocomplete/suggestions
- Reading time estimation display
- Article thumbnail extraction
- Tag color customization
- Bulk tag operations
- Offline support with sync queue
