# Poche - Read It Later Application

## Project Overview

Poche is a "read it later" application that allows users to save articles from the web and read them later. The project consists of five main components:

1. **Backend** - Self-hosted API server for authentication and article management
2. **Mobile App** - React Native mobile application (iOS/Android) built with Expo
3. **Browser Extension** - Cross-browser extension (Chrome, Firefox, Safari) for saving articles
4. **Web App** - Marketing website with app download links, SEO optimization, and password reset page
5. **Shared** - Shared TypeScript types, utilities, and styling used across all projects

## Architecture

### Technology Stack

- **Backend**: Hono (Node.js), Better Auth with bearer plugin, Drizzle ORM, PostgreSQL
- **Mobile App**: React Native with Expo Router, custom markdown renderer
- **Browser Extension**: React with TypeScript, built with Vite
- **Web App**: React with TypeScript, Vite, React Router
- **Shared Package**: TypeScript types, utilities, colors, and markdown parsing (`@poche/shared`)
- **Authentication**: Better Auth (email/password with bearer tokens for API clients)
- **Email**: Resend for transactional emails (password reset)
- **Article Extraction**: Defuddle (server-side Node.js version, markdown output)
- **Deployment**: Docker & Docker Compose with Nginx reverse proxy
- **SSL/TLS**: Let's Encrypt via Certbot with Cloudflare DNS plugin

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
├── shared/              # Shared TypeScript package (@poche/shared)
│   ├── src/            # Source files
│   │   ├── types.ts    # User, AuthResponse, Article types
│   │   ├── util.ts     # Utility functions (tagToColor)
│   │   ├── constants.ts # Session duration, refresh threshold
│   │   ├── api.ts      # API endpoints, session helpers, error parsing
│   │   ├── markdown.ts # Markdown tokenization and parsing
│   │   ├── colors.ts   # Unified light/dark color palette
│   │   └── index.ts    # Re-exports
│   ├── package.json    # npm package config
│   └── tsconfig.json   # TypeScript config
├── backend/             # Self-hosted API server
│   ├── src/            # Source files (TypeScript)
│   │   ├── lib/        # Auth config, email service
│   │   └── routes/     # API routes
│   ├── docker-compose.yml  # Production Docker config
│   ├── docker-compose.dev.yml  # Development Docker config
│   ├── nginx.conf      # Nginx reverse proxy config
│   ├── Dockerfile      # Container build
│   └── ...
├── mobile_app/          # React Native mobile application
│   ├── app/            # Expo Router file-based routing
│   ├── components/     # React components
│   ├── lib/            # API client, sync utilities
│   ├── metro.config.js # Metro bundler config for @poche/shared
│   ├── app.config.js   # Expo config with env variables
│   └── ...
├── browser_extension/   # Browser extension for saving articles
│   ├── src/            # Source files (React/TypeScript)
│   │   ├── components/ # Extracted React components
│   │   ├── lib/        # API client, types, storage utilities
│   │   ├── App.tsx     # Main app component
│   │   └── popup.tsx   # Entry point with color scheme setup
│   ├── dist/           # Built extension files
│   └── ...
├── webapp/              # Marketing website + full app
│   ├── src/            # React source files
│   │   ├── components/ # Reusable UI components with CSS
│   │   ├── pages/      # Home, ResetPassword, app/*
│   │   ├── contexts/   # AuthContext
│   │   └── lib/        # API client
│   ├── public/         # Static assets
│   └── ...
└── SUMMARY.md          # This file
```

## Features

### Backend Features
- RESTful API for authentication and article management
- Server-side article extraction (URL → markdown via Defuddle)
- Bearer token authentication for browser extensions and mobile apps
- **Password reset**: Email-based password reset flow via Resend
- **Email service**: Transactional emails with beautiful HTML templates
- Docker Compose with Nginx reverse proxy for production deployment
- HTTPS with Let's Encrypt SSL certificates (Certbot + Cloudflare DNS)
- PostgreSQL with Drizzle ORM
- Environment-based configuration via `.env` file

### Mobile App Features
- User authentication (email/password login and signup)
- **Forgot password**: Request password reset email from login screen
- View saved articles linked to user account
- Tab-based navigation with native iOS blur effects
- Dark mode support with custom Poche color theme (warm tones, coral accent #EF4056)
- **Markdown rendering**: Custom markdown-to-React-Native component for article content
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
- **Clear data on logout**: Locally stored articles are cleared when user signs out

### Browser Extension Features
- User authentication within extension popup
- **Forgot password**: Request password reset email from login screen
- Send URLs to backend for article extraction
- Cross-browser compatibility (Chrome, Firefox, Safari)
- **Token-based auth**: Stores bearer token in browser storage
- **Saved article tracking**: Tracks which URLs have already been saved to prevent duplicate saves
- **Smart button state**: "Save Article" button is disabled and shows "Already Saved" if current URL is already saved
- **Automatic sync**: Syncs saved article list from backend on popup open
- **Tag input**: UI to specify comma-delimited list of tags before saving an article
- **Light/dark mode**: Automatic theme switching based on system preferences

### Web App Features
- Marketing landing page at `/` route
- **Password reset page**: `/reset-password` handles password reset from email links
- **Privacy policy page**: `/privacy-policy` for app store compliance
- **SEO optimized**: Meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- **App download links**: iOS App Store, Google Play Store
- **Browser extension links**: Chrome Web Store, Firefox Add-ons, Safari App Store
- **Features showcase**: Highlights key Poche features with icons and descriptions
- **How it works section**: Step-by-step guide for new users
- **Responsive design**: Mobile-first with beautiful desktop layout
- **Poche branding**: Warm color palette with coral accent (#EF4056)
- **Custom typography**: Bitter serif for headings, Source Sans 3 for body
- **Light/dark mode**: Automatic theme switching based on system preferences
- **Font Awesome icons**: Scalable vector icons throughout the app

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
- **Markdown rendering**: Custom `Markdown` component using shared parsing from `@poche/shared`
- **Custom theme**: Warm color palette with Poche coral accent (#EF4056 light, #F06B7E dark)
- **Environment variables**: API_URL configured via `.env` (local) and `eas.json` (EAS builds)
- **EAS Build**: Configured for iOS and Android production builds with environment secrets

### Browser Extension
- Built with Vite (migrated from Webpack)
- React with TypeScript for UI components
- Uses Manifest V3 for Chrome and Firefox
- **Firefox-specific manifest**: Separate `manifest.firefox.json` with `gecko.id` and `data_collection_permissions`
- Token-based authentication (bearer tokens stored in browser storage)
- Cross-browser API compatibility layer
- **Component-based architecture**: Extracted reusable components (Header, StatusMessage, LoginSection, MainSection, etc.)
- **Shared colors**: Uses `@poche/shared` color palette with dynamic CSS variables
- **Light/dark mode**: Automatic switching based on `prefers-color-scheme`

### Web App
- Built with Vite for fast development
- React 18 with TypeScript
- React Router for client-side routing
- SEO optimized with meta tags and structured data
- Custom CSS with CSS variables for theming
- Responsive design with mobile-first approach
- **Component-based architecture**: Extracted reusable components (Logo, LoadingSpinner, TagChip, AppHeader, ArticleCard, EmptyState, Markdown)
- **Shared colors**: Uses `@poche/shared` color palette with dynamic CSS variables
- **Light/dark mode**: Automatic switching based on `prefers-color-scheme`
- **Font Awesome**: Scalable vector icons via CDN

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

## Shared Package (@poche/shared)

The shared package provides common functionality across all projects:

### Types (`types.ts`)
- `User`, `AuthResponse`, `Article`, `LegacyArticle`

### Utilities (`util.ts`)
- `tagToColor()` - Generates consistent colors for tag chips

### Constants (`constants.ts`)
- `SESSION_DURATION` - 7 days in milliseconds
- `SESSION_REFRESH_THRESHOLD` - 3 days in milliseconds

### API Helpers (`api.ts`)
- `API_ENDPOINTS` - Centralized endpoint definitions
- `parseApiError()` - Consistent error message extraction
- `shouldRefreshSession()` - Check if session needs refresh
- `isSessionExpired()` - Check if session has expired
- `calculateSessionExpiry()` - Calculate new session expiry date

### Markdown Parsing (`markdown.ts`)
- `tokenize()` - Parse markdown into block tokens
- `parseInline()` - Parse inline elements (bold, italic, links, etc.)
- `isValidImageUrl()` - Validate image URLs
- `resolveUrl()` - Resolve relative URLs against base URL

### Colors (`colors.ts`)
- Unified light/dark color palette for all projects
- `colors` object with `light` and `dark` schemes
- Categories: brand, background, text, border, accent, semantic
- `getColors(scheme)` and `getColor(scheme, category, key)` helpers

## Recent Enhancements

### Shared Package
- ✅ Moved shared code to root-level `@poche/shared` npm package
- ✅ TypeScript types: User, AuthResponse, Article, LegacyArticle
- ✅ Utility functions: tagToColor
- ✅ **API helpers**: Shared API endpoints, session management, error parsing
- ✅ **Markdown parsing**: Shared tokenization and inline parsing
- ✅ **Unified colors**: Light/dark color palette for all projects
- ✅ Installed as local dependency in all 4 projects
- ✅ **No build step required**: Uses TypeScript source directly (compatible with Metro, Vite, and EAS)

### Backend
- ✅ Self-hosted API server with Hono
- ✅ Better Auth integration with bearer plugin for token-based auth
- ✅ Server-side article extraction with Defuddle (markdown output)
- ✅ **Password reset flow**: `POST /api/auth/request-password-reset`
- ✅ **Email service**: Resend integration for transactional emails
- ✅ **Password reset emails**: Beautiful HTML templates with Poche branding
- ✅ Docker & Docker Compose for easy deployment
- ✅ PostgreSQL with Drizzle ORM
- ✅ Dynamic CORS for browser extensions (chrome-extension://, moz-extension://, safari-extension://)
- ✅ Dynamic trustedOrigins in Better Auth for extension origins
- ✅ CSRF protection disabled for mobile app compatibility
- ✅ Server binds to 0.0.0.0 for local network access
- ✅ Nginx reverse proxy with HTTPS support (api.poche.to)
- ✅ Let's Encrypt SSL via Certbot with Cloudflare DNS plugin
- ✅ Environment variables loaded from `.env` file with required validation
- ✅ Default server blocks to reject unknown hostnames
- ✅ Node.js-based healthcheck (no external dependencies like wget)

### Mobile App
- ✅ Migrated from Supabase to self-hosted backend
- ✅ Bearer token authentication via `lib/api.ts`
- ✅ AuthContext for session management and navigation guards
- ✅ **Forgot password flow**: Request password reset from auth screen
- ✅ Custom markdown renderer using shared parsing from `@poche/shared`
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
- ✅ Uses `@poche/shared` package for types, utilities, API helpers, and markdown parsing
- ✅ Centralized article sync logic (`lib/article-sync.ts`)
- ✅ Bitter + Source Sans 3 fonts via `@expo-google-fonts`
- ✅ Improved authentication error messaging
- ✅ Session expiry caching (reduces API calls)
- ✅ **Environment variables**: API_URL via `.env` (local) and `eas.json` (EAS builds)
- ✅ **Metro bundler config**: Support for `@poche/shared` outside project directory
- ✅ **Clear articles on logout**: Locally stored articles cleared on sign out
- ✅ **EAS Build**: Configured for iOS App Store and Google Play distribution

### Browser Extension
- ✅ Migrated from Supabase to self-hosted backend
- ✅ Token-based authentication (bearer tokens stored in browser storage)
- ✅ Bearer token included in Authorization header for all API requests
- ✅ **Forgot password flow**: Request password reset from login screen
- ✅ Session validation with cached user data fallback
- ✅ Saved article URL tracking
- ✅ Smart save button state management
- ✅ Automatic sync of saved articles from backend
- ✅ Converted to React with TypeScript
- ✅ Tag input UI for specifying tags before saving
- ✅ Sign in/sign up mode switch UI
- ✅ Bitter + Source Sans 3 fonts via Google Fonts
- ✅ Error status popup for sign-in/sign-up failures
- ✅ Loading spinner while checking auth status
- ✅ Session expiry caching (reduces API calls)
- ✅ Uses `@poche/shared` package for types, utilities, API helpers, and colors
- ✅ **Migrated from Webpack to Vite** for faster builds
- ✅ **Component-based refactor**: Extracted Header, StatusMessage, LoadingSpinner, AuthModeSwitch, TagsInput, LoginSection, MainSection, App components
- ✅ **Scoped CSS**: Each component has its own CSS file with nested styles
- ✅ **Shared colors**: Uses `@poche/shared` color palette
- ✅ **Light/dark mode**: Automatic switching based on `prefers-color-scheme`
- ✅ **Firefox support**: Separate manifest with `gecko.id` and `data_collection_permissions`
- ✅ **Firefox build config**: `vite.firefox.config.ts` for Firefox-specific builds

### Web App
- ✅ React + TypeScript with Vite
- ✅ React Router for navigation
- ✅ Marketing landing page with hero section
- ✅ **Password reset page**: Complete flow for resetting passwords from email link
- ✅ **Privacy policy page**: `/privacy-policy` for app store compliance
- ✅ SEO optimization (meta tags, Open Graph, Twitter Cards, JSON-LD)
- ✅ App Store and Google Play download links
- ✅ Browser extension links (Chrome, Firefox, Safari)
- ✅ Features section with 6 feature cards
- ✅ "How It Works" step-by-step guide
- ✅ Call-to-action sections
- ✅ Responsive design (mobile-first)
- ✅ Custom Poche branding with warm color palette
- ✅ Bitter + Source Sans 3 typography
- ✅ Animated phone mockup in hero
- ✅ Floating background shapes for depth
- ✅ Uses `@poche/shared` package for types, utilities, and colors
- ✅ **Full app section** (`/app/*`) with sign in, sign up, forgot password
- ✅ **Articles list page** with article cards and reading time
- ✅ **Article detail page** with custom markdown rendering
- ✅ **AuthContext** for authentication state management
- ✅ **ProtectedRoute** component for authenticated routes
- ✅ **API client** with bearer token auth and environment variables
- ✅ **Build deploy script** (`npm run build:deploy`) to deploy to backend
- ✅ **Served via Nginx** at `poche.to` in production
- ✅ **Component-based refactor**: Extracted Logo, LoadingSpinner, TagChip, AppHeader, ArticleCard, EmptyState, Markdown components
- ✅ **Scoped CSS**: Each component/page has its own CSS file with nested styles
- ✅ **Font Awesome icons**: Replaced SVG icons with Font Awesome
- ✅ **Shared colors**: Uses `@poche/shared` color palette
- ✅ **Light/dark mode**: Automatic switching based on `prefers-color-scheme`

## Production Deployment

See `PRODUCTION.md` for a comprehensive guide on deploying Poche to a production server, including:
- Docker Compose setup
- SSL certificate generation with Let's Encrypt
- Nginx reverse proxy configuration
- Database migrations
- Troubleshooting guide

## Future Enhancements

Potential features to add:
- Email verification
- Article folders/categories
- Search functionality
- Article sharing
- Reading progress tracking
- Enhanced sync across devices
- Tag autocomplete/suggestions
- Bulk tag operations
- API rate limiting
- Full-text search
