# Poche Browser Extension - Summary

## Overview

The Poche browser extension allows users to save articles from any webpage to their Poche account. It works across Chrome, Firefox, and Safari browsers.

## Features

- **Authentication**: Email/password login and signup within the extension popup
- **Token-Based Auth**: Bearer token authentication stored in browser extension storage
- **Article Saving**: Sends URLs to backend for server-side extraction
- **Cross-Browser Support**: Works with Chrome (Manifest V3), Firefox, and Safari
- **Saved Article Tracking**: Tracks which URLs have already been saved to prevent duplicate saves
- **Smart Button State**: "Save Article" button automatically disables and shows "Already Saved" if the current URL is already saved
- **Automatic Sync**: Syncs saved article list from backend on popup open to reflect deletions from mobile app
- **Tag Input**: Specify comma-delimited tags before saving articles

## Architecture

### Technology Stack

- **Build Tool**: Webpack
- **Language**: TypeScript
- **UI Framework**: React
- **Bundler**: Webpack with TypeScript and Babel for transpilation
- **Backend**: Self-hosted Poche API with Better Auth
- **Storage**: Chrome/Firefox storage API for bearer token and user data persistence

### File Structure

```
browser_extension/
├── src/
│   ├── popup.tsx         # Main popup React component (TypeScript)
│   ├── popup.html        # Popup HTML structure
│   ├── popup.css         # Popup styles with dark mode support
│   ├── background.ts     # Background service worker (TypeScript)
│   └── lib/
│       └── api.ts        # Backend API client (auth, articles)
├── shared/               # Shared types and utilities
│   ├── types.tsx         # TypeScript types (Article, Database, etc.)
│   └── util.ts           # Utility functions (tagToColor, etc.)
├── icons/                # Extension icons (16x16, 48x48, 128x128)
├── dist/                 # Built extension files (generated)
├── manifest.json         # Extension manifest (Manifest V3)
├── package.json          # Dependencies and build scripts
├── tsconfig.json         # TypeScript configuration
├── webpack.config.js     # Webpack configuration
└── SUMMARY.md            # This file
```

## Key Components

### popup.tsx
Main extension React component (TypeScript):
- Authentication (login/signup with mode switch)
- Article saving via backend API
- Error handling and user feedback
- **Saved article tracking**: Stores list of saved article URLs and IDs in browser storage
- **Button state management**: Updates save button state based on whether current URL is already saved
- **Article sync**: Syncs saved articles from backend on popup open to keep local storage in sync
- **Tag input UI**: Text input field for specifying comma-delimited list of tags before saving

### api.ts
Backend API client (TypeScript):
- Token-based authentication (bearer tokens)
- Sign up, sign in, sign out, get session
- Article CRUD operations (list, save, update, delete)
- Token and user data storage in browser extension storage API
- Automatic bearer token inclusion in `Authorization` header for all API requests
- Session validation with fallback to cached user data for offline scenarios

### background.ts
Background service worker (TypeScript):
- Handles extension lifecycle events
- Manages cross-tab communication

## How It Works

1. **User clicks extension icon** → Opens popup
2. **If not logged in** → Shows login/signup form with mode switch
3. **User authenticates** → Bearer token stored in browser storage
4. **On popup open** → Syncs saved articles from backend to local storage
5. **Button state checked** → If current URL is already saved, button is disabled
6. **User navigates to article** → Clicks "Save Article" button (if not already saved)
7. **URL sent to backend** → Backend extracts article using Defuddle
8. **Article saved** → Backend stores in PostgreSQL
9. **Article tracked locally** → URL and ID added to local storage
10. **Success feedback** → User sees confirmation message
11. **Button updates** → Button state updated to show "Already Saved"

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
- ✅ Converted to React with TypeScript
- ✅ Saved article URL tracking in browser storage
- ✅ Smart save button state management
- ✅ Automatic sync of saved articles from backend on popup open
- ✅ Prevention of duplicate article saves
- ✅ Tag input UI for specifying tags before saving articles
- ✅ Shared types and utilities folder for code reuse
- ✅ Noto Sans font via Google Fonts for consistent typography
- ✅ Error status popup for sign-in/sign-up failures with meaningful messages
- ✅ Loading spinner while checking auth status (prevents auth UI flash)
- ✅ Session expiry caching - only refreshes session when < 3 days until expiry

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
