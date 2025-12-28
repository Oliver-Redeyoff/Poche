# Poche Browser Extension - Summary

## Overview

The Poche browser extension allows users to save articles from any webpage to their Poche account. It works across Chrome, Firefox, and Safari browsers.

## Features

- **Authentication**: Email/password login and signup within the extension popup
- **Article Parsing**: Uses Mozilla Readability to extract clean article content from web pages
- **Article Saving**: Saves parsed articles to Supabase articles table
- **Cross-Browser Support**: Works with Chrome (Manifest V3), Firefox, and Safari
- **Saved Article Tracking**: Tracks which URLs have already been saved to prevent duplicate saves
- **Smart Button State**: "Save Article" button automatically disables and shows "Already Saved" if the current URL is already saved
- **Automatic Sync**: Syncs saved article list from Supabase on popup open to reflect deletions from mobile app

## Architecture

### Technology Stack

- **Build Tool**: Webpack
- **Language**: TypeScript
- **UI Framework**: React
- **Bundler**: Webpack with TypeScript and Babel for transpilation
- **Article Parsing**: Mozilla Readability (bundled with extension)
- **Backend**: Supabase (authentication and database)
- **Storage**: Chrome/Firefox storage API for session persistence

### File Structure

```
browser_extension/
├── src/
│   ├── popup.tsx         # Main popup React component (TypeScript)
│   ├── popup.html        # Popup HTML structure
│   ├── popup.css         # Popup styles with dark mode support
│   ├── content.ts        # Content script for parsing articles (TypeScript)
│   ├── background.ts     # Background service worker (TypeScript)
│   └── lib/
│       └── supabase.ts   # Supabase client with browser storage adapter (TypeScript)
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
- Authentication (login/signup)
- Content script injection and communication
- Article parsing coordination
- Supabase article saving
- Error handling and user feedback
- **Saved article tracking**: Stores list of saved article URLs and IDs in browser storage
- **Button state management**: Updates save button state based on whether current URL is already saved
- **Article sync**: Syncs saved articles from Supabase on popup open to keep local storage in sync
- **Tag input UI**: Text input field for specifying comma-delimited list of tags before saving
- **HTML entity decoding**: Decodes HTML entities in article titles and excerpts before saving

### content.ts
Content script that runs on web pages (TypeScript):
- Listens for parse requests from popup
- Uses Mozilla Readability to extract article content
- Returns parsed article data (title, content, excerpt, length, etc.)
- Handles cross-browser API differences
- Calculates article length (character count excluding HTML)

### supabase.ts
Supabase client configuration (TypeScript):
- Custom storage adapter using browser storage API
- Works with both Chrome and Firefox APIs
- Session persistence across extension restarts
- Type-safe database queries using generated types

## How It Works

1. **User clicks extension icon** → Opens popup
2. **If not logged in** → Shows login/signup form
3. **User authenticates** → Session stored in browser storage
4. **On popup open** → Syncs saved articles from Supabase to local storage
5. **Button state checked** → If current URL is already saved, button is disabled
6. **User navigates to article** → Clicks "Save Article" button (if not already saved)
7. **Content script injected** → Parses page using Readability
8. **Article data extracted** → Title, content, metadata
9. **Article saved to Supabase** → Linked to user via user_id
10. **Article tracked locally** → URL and ID added to local storage
11. **Success feedback** → User sees confirmation message
12. **Button updates** → Button state updated to show "Already Saved"

## Database Integration

### Articles Table Schema
The extension saves articles with the following fields:
- `user_id` (string, required) - Links article to user
- `title` (string, nullable) - Article title (HTML entities decoded)
- `content` (string, nullable) - Parsed text content
- `excerpt` (string, nullable) - Article excerpt (HTML entities decoded)
- `url` (string, nullable) - Original article URL
- `siteName` (string, nullable) - Website name
- `length` (number, nullable) - Character count of article text (excluding HTML)
- `tags` (string, nullable) - Comma-delimited list of tags
- `created_time` (string, auto-generated) - Timestamp

### Authentication
- Uses Supabase Auth for email/password authentication
- Session stored in browser storage (chrome.storage.local)
- Automatic token refresh
- Session persists across browser restarts

### Saved Article Tracking
- Stores list of saved article URLs and IDs per user in browser storage
- Key format: `poche_saved_articles_{userId}`
- Synced from Supabase on popup open to reflect deletions
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
- `activeTab` - Access to current tab for article parsing
- `storage` - Store authentication session
- `scripting` - Inject content scripts
- `host_permissions: <all_urls>` - Access to all websites for article saving

## Content Security Policy

- Content scripts run in page context
- No external script loading (Readability is bundled)
- All code is bundled and self-contained

## Error Handling

- Comprehensive error messages for users
- Console logging for debugging
- Retry logic for content script communication
- Timeout handling for network operations

## Known Limitations

- Cannot save from browser internal pages (chrome://, about:, etc.) - button shows "Cannot Save This Page"
- Some pages may not parse correctly due to structure
- Requires internet connection for Supabase operations
- Safari requires additional setup and code signing for distribution
- Saved article list syncs on popup open, not in real-time

## Recent Enhancements

- ✅ Converted to React with TypeScript
- ✅ Saved article URL tracking in browser storage
- ✅ Smart save button state management
- ✅ Automatic sync of saved articles from Supabase on popup open
- ✅ Prevention of duplicate article saves
- ✅ Tag input UI for specifying tags before saving articles
- ✅ HTML entity decoding for article titles and excerpts
- ✅ Article length calculation (character count excluding HTML)
- ✅ Shared types and utilities folder for code reuse

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
