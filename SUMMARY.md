# Poche - Read It Later Application

## Project Overview

Poche is a "read it later" application that allows users to save articles from the web and read them later. The project consists of two main components:

1. **Mobile App** - React Native mobile application (iOS/Android) built with Expo
2. **Browser Extension** - Cross-browser extension (Chrome, Firefox, Safari) for saving articles

Both components use **Supabase** for authentication and data storage.

## Architecture

### Technology Stack

- **Backend/Database**: Supabase (PostgreSQL database with authentication)
- **Mobile App**: React Native with Expo Router
- **Browser Extension**: Vanilla JavaScript with Webpack
- **Authentication**: Supabase Auth (email/password)
- **Article Parsing**: Mozilla Readability

### Database Schema

The project uses a Supabase database with the following main tables:

#### `articles` table
- `id` (number, auto-generated)
- `user_id` (string, foreign key to auth.users)
- `title` (string, nullable)
- `content` (string, nullable) - parsed article text content
- `created_time` (string, auto-generated)

#### `profiles` table
- `id` (string, foreign key to auth.users)
- `username` (string, nullable)
- `full_name` (string, nullable)
- `avatar_url` (string, nullable)
- `website` (string, nullable)
- `updated_at` (string, nullable)

### Authentication

- Email/password authentication via Supabase
- Row Level Security (RLS) policies ensure users can only access their own articles
- Session management with automatic token refresh

## Project Structure

```
Poche/
├── mobile_app/          # React Native mobile application
│   ├── app/            # Expo Router file-based routing
│   ├── components/     # React components
│   ├── lib/            # Supabase client configuration
│   └── ...
├── browser_extension/   # Browser extension for saving articles
│   ├── src/            # Source files
│   ├── dist/           # Built extension files
│   └── ...
└── SUMMARY.md          # This file
```

## Features

### Mobile App Features
- User authentication (email/password login and signup)
- View saved articles linked to user account
- User profile management
- Tab-based navigation with native iOS blur effects
- Dark mode support
- **Offline article access**: Signed-in users can access articles stored locally even when offline
- **Background article sync**: Periodic background task to sync latest articles from database
- **Instant article loading**: Articles from local storage appear immediately on homepage, with new articles synced in background
- **Article animations**: Smooth entry animations for new articles and exit animations for deleted articles
- **Article deletion**: Delete articles with confirmation dialog and smooth animations
- **Article detail view**: Full article reading experience with offline support

### Browser Extension Features
- User authentication within extension popup
- Parse web pages using Mozilla Readability
- Save articles to Supabase articles table
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Automatic content extraction from web pages
- **Saved article tracking**: Tracks which URLs have already been saved to prevent duplicate saves
- **Smart button state**: "Save Article" button is disabled and shows "Already Saved" if current URL is already saved
- **Automatic sync**: Syncs saved article list from Supabase on popup open to reflect deletions from mobile app

## Workflow

1. **User logs in** to either the mobile app or browser extension
2. **User browses the web** and finds an article they want to save
3. **User clicks the browser extension** icon
4. **Extension parses the article** using Mozilla Readability
5. **Article is saved** to Supabase articles table with user_id
6. **User can view saved articles** in the mobile app

## Development

### Mobile App
- Built with Expo SDK ~54
- Uses Expo Router for file-based routing
- TypeScript for type safety
- Supabase client configured with AsyncStorage for session persistence
- **Local storage**: Articles stored in AsyncStorage for offline access
- **Background tasks**: Uses `expo-background-task` for periodic article syncing
- **Animations**: Uses `react-native-reanimated` for smooth article list animations

### Browser Extension
- Built with Webpack
- Uses Manifest V3 for Chrome/Firefox
- Bundles Mozilla Readability for article parsing
- Cross-browser API compatibility layer

## Configuration

### Supabase Configuration
- Project URL: `https://ixpfqquzduzwktjaumtn.supabase.co`
- Authentication enabled with email/password
- RLS policies configured for articles and profiles tables

### Security
- Row Level Security (RLS) enabled on articles table
- Users can only insert/view their own articles
- Authentication required for all operations

## Recent Enhancements

### Mobile App
- ✅ Offline article reading support
- ✅ Background article syncing
- ✅ Instant article loading from local storage
- ✅ Article entry and exit animations
- ✅ Article deletion with confirmation
- ✅ Modular ArticleCard component

### Browser Extension
- ✅ Saved article URL tracking
- ✅ Smart save button state management
- ✅ Automatic sync of saved articles from Supabase

## Future Enhancements

Potential features to add:
- Article organization (tags, folders)
- Search functionality
- Article sharing
- Reading progress tracking
- Enhanced sync across devices

