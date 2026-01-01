# Poche - Read It Later Application

## Project Overview

Poche is a "read it later" application that allows users to save articles from the web and read them later. The project consists of three main components:

1. **Backend** - Self-hosted API server for authentication and article management
2. **Mobile App** - React Native mobile application (iOS/Android) built with Expo
3. **Browser Extension** - Cross-browser extension (Chrome, Firefox, Safari) for saving articles

## Architecture

### Technology Stack

- **Backend**: Hono (Node.js), Better Auth with bearer plugin, Drizzle ORM, PostgreSQL
- **Mobile App**: React Native with Expo Router, react-native-markdown-display
- **Browser Extension**: React with TypeScript, built with Webpack
- **Authentication**: Better Auth (email/password with bearer tokens for API clients)
- **Article Extraction**: Defuddle (server-side Node.js version, markdown output)
- **Deployment**: Docker & Docker Compose

### Database Schema

The project uses a PostgreSQL database with the following main tables:

#### `user` table (Better Auth)
- `id` (string, primary key)
- `name` (string) - Display name
- `email` (string, unique)
- `emailVerified` (boolean)
- `image` (string, nullable)
- `createdAt`, `updatedAt` (timestamps)

#### `session` table (Better Auth)
- `id` (string, primary key)
- `token` (string, unique) - Bearer token
- `expiresAt` (timestamp)
- `userId` (string, foreign key)
- `ipAddress`, `userAgent` (metadata)

#### `articles` table
- `id` (integer, auto-generated)
- `userId` (string, foreign key to user)
- `title` (string, nullable) - Article title
- `content` (string, nullable) - Parsed markdown content
- `excerpt` (string, nullable) - Article excerpt
- `url` (string, nullable) - Original article URL
- `siteName` (string, nullable) - Website name
- `author` (string, nullable) - Article author
- `wordCount` (integer, nullable) - Word count for reading time
- `tags` (string, nullable) - Comma-delimited list of tags
- `createdAt`, `updatedAt` (timestamps)

### Authentication

- Email/password authentication via Better Auth
- Bearer token authentication for API clients (browser extensions, mobile apps)
- Better Auth's bearer plugin enables token-based auth alongside cookies
- Session tokens stored in browser extension storage (`chrome.storage.local`) and mobile app AsyncStorage
- Cookie-based auth doesn't work for browser extensions due to cross-origin restrictions
- CSRF protection disabled for mobile app compatibility (mobile apps don't send Origin header)
- Row Level Security equivalent through user-scoped queries

## Project Structure

```
Poche/
├── backend/             # Self-hosted API server
│   ├── src/            # Source files (TypeScript)
│   ├── docker-compose.yml  # Production Docker config
│   ├── docker-compose.dev.yml  # Development Docker config
│   ├── Dockerfile      # Container build
│   └── ...
├── mobile_app/          # React Native mobile application
│   ├── app/            # Expo Router file-based routing
│   ├── components/     # React components
│   ├── lib/            # API client, utilities
│   ├── shared/         # Shared types and utilities
│   └── ...
├── browser_extension/   # Browser extension for saving articles
│   ├── src/            # Source files (React/TypeScript)
│   ├── shared/         # Shared types and utilities
│   ├── dist/           # Built extension files
│   └── ...
└── SUMMARY.md          # This file
```

## Features

### Backend Features
- RESTful API for authentication and article management
- Server-side article extraction (URL → markdown via Defuddle)
- Bearer token authentication for browser extensions and mobile apps
- Docker support for easy deployment
- PostgreSQL with Drizzle ORM

### Mobile App Features
- User authentication (email/password login and signup)
- View saved articles linked to user account
- Tab-based navigation with native iOS blur effects
- Dark mode support with custom Poche color theme (warm tones, coral accent #EF4056)
- **Markdown rendering**: Uses `react-native-markdown-display` for article content
- **Smart image handling**: Filters invalid URLs, low-resolution images (< 50x50), with error handling
- **Link styling**: Links appear in accent color with underline
- **Offline article access**: Articles stored locally in AsyncStorage
- **Offline image caching**: Images downloaded and stored locally for offline viewing
- **Background article sync**: Periodic background task to sync latest articles and cache images
- **Instant article loading**: Articles from local storage appear immediately
- **Article animations**: Smooth entry/exit animations for articles
- **Article deletion**: Delete articles with confirmation dialog
- **Tag management**: Add and remove tags from articles directly from article cards
- **Tag filtering**: Filter articles by tag using tag chips at the top of the homepage
- **Reading time**: Display estimated reading time based on article word count

### Browser Extension Features
- User authentication within extension popup
- Send URLs to backend for article extraction
- Cross-browser compatibility (Chrome, Firefox, Safari)
- **Token-based auth**: Stores bearer token in browser storage
- **Saved article tracking**: Tracks which URLs have already been saved to prevent duplicate saves
- **Smart button state**: "Save Article" button is disabled and shows "Already Saved" if current URL is already saved
- **Automatic sync**: Syncs saved article list from backend on popup open
- **Tag input**: UI to specify comma-delimited list of tags before saving an article

## Workflow

1. **User logs in** to either the mobile app or browser extension
2. **User browses the web** and finds an article they want to save
3. **User clicks the browser extension** icon
4. **Extension sends URL** to backend API
5. **Backend extracts article** using Defuddle (server-side, outputs markdown)
6. **Article saved** to PostgreSQL with userId
7. **User views saved articles** in the mobile app (markdown rendered) or extension

## Development

### Backend
- Built with Hono framework
- Uses Better Auth for authentication with bearer plugin
- Drizzle ORM for type-safe database queries
- Docker Compose for development and production
- Hot-reloading in development mode
- Binds to `0.0.0.0` for mobile app access on local network

### Mobile App
- Built with Expo SDK ~54
- Uses Expo Router for file-based routing
- TypeScript for type safety
- **API client**: `lib/api.ts` handles all backend communication
- **AuthContext**: Manages session state and navigation guards
- **Local storage**: Articles stored in AsyncStorage for offline access
- **Image caching**: Uses `expo-file-system/legacy` to download and cache article images locally
- **Background tasks**: Uses `expo-background-task` for periodic article syncing and image caching
- **Animations**: Uses `react-native-reanimated` for smooth article list animations
- **Markdown rendering**: Uses `react-native-markdown-display` with custom image and link handling
- **Custom theme**: Warm color palette with Poche coral accent (#EF4056 light, #F06B7E dark)

### Browser Extension
- Built with Webpack
- React with TypeScript for UI components
- Uses Manifest V3 for Chrome/Firefox
- Token-based authentication (bearer tokens stored in browser storage)
- Cross-browser API compatibility layer

## Configuration

### Backend Configuration
- Environment variables for database URL, auth secret, port
- CORS configured for browser extensions and localhost
- Better Auth configured with `trustedOrigins: ['*']` for mobile app compatibility

### Security
- Bearer token authentication for all protected endpoints
- User-scoped database queries (users can only access their own articles)
- CORS restrictions for API access
- Session expiration and refresh

## Recent Enhancements

### Backend
- ✅ Self-hosted API server with Hono
- ✅ Better Auth integration with bearer plugin for token-based auth
- ✅ Server-side article extraction with Defuddle (markdown output)
- ✅ Docker & Docker Compose for easy deployment
- ✅ PostgreSQL with Drizzle ORM
- ✅ Dynamic CORS for browser extensions (chrome-extension://, moz-extension://, safari-extension://)
- ✅ Dynamic trustedOrigins in Better Auth for extension origins
- ✅ CSRF protection disabled for mobile app compatibility
- ✅ Server binds to 0.0.0.0 for local network access

### Mobile App
- ✅ Migrated from Supabase to self-hosted backend
- ✅ Bearer token authentication via `lib/api.ts`
- ✅ AuthContext for session management and navigation guards
- ✅ Markdown rendering with `react-native-markdown-display`
- ✅ Custom image rendering with expo-image
- ✅ Image filtering (invalid URLs, low-resolution < 50x50)
- ✅ Image error handling with graceful degradation
- ✅ Link styling with accent color and underline
- ✅ Offline article reading support
- ✅ Offline image caching with `expo-file-system/legacy`
- ✅ Background article syncing with image caching
- ✅ Instant article loading from local storage
- ✅ Article entry and exit animations
- ✅ Article deletion with confirmation
- ✅ Modular ArticleCard component
- ✅ Tag management (add/remove tags from article cards)
- ✅ Tag filtering on homepage
- ✅ Reading time display based on article word count
- ✅ Custom Poche color theme (warm tones, coral accent)
- ✅ Shared types and utilities folder
- ✅ Centralized article sync logic (`lib/article-sync.ts`)

### Browser Extension
- ✅ Migrated from Supabase to self-hosted backend
- ✅ Token-based authentication (bearer tokens stored in browser storage)
- ✅ Bearer token included in Authorization header for all API requests
- ✅ Session validation with cached user data fallback
- ✅ Saved article URL tracking
- ✅ Smart save button state management
- ✅ Automatic sync of saved articles from backend
- ✅ Converted to React with TypeScript
- ✅ Tag input UI for specifying tags before saving
- ✅ Sign in/sign up mode switch UI

## Future Enhancements

Potential features to add:
- Email verification and password reset
- Article folders/categories
- Search functionality
- Article sharing
- Reading progress tracking
- Enhanced sync across devices
- Tag autocomplete/suggestions
- Bulk tag operations
- API rate limiting
- Full-text search
