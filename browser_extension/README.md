# Poche Browser Extension

A cross-browser extension for saving articles to read later using Poche.

## Features

- ✅ Login/Signup with Supabase authentication
- ✅ Parse webpages using Mozilla Readability
- ✅ Save articles to Supabase articles table
- ✅ Works with Chrome, Firefox, and Safari

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. For specific browsers:
```bash
npm run build:chrome
npm run build:firefox
npm run build:safari
```

## Installation

### Chrome/Edge
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` or `chrome` folder

### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `manifest.json` from the `dist` or `firefox` folder

### Safari
1. Enable Safari Developer menu (Preferences > Advanced)
2. Open "Extension Builder"
3. Import the extension from the `safari` folder

## Development

Watch mode for development:
```bash
npm run dev
```

## Structure

- `src/popup.js` - Main popup logic and UI
- `src/popup.html` - Popup HTML
- `src/popup.css` - Popup styles
- `src/content.js` - Content script for parsing articles
- `src/background.js` - Background service worker
- `src/lib/supabase.js` - Supabase client configuration
- `manifest.json` - Extension manifest

## Notes

- The extension uses Manifest V3 for Chrome/Firefox compatibility
- Safari may require additional configuration
- Make sure your Supabase RLS policies allow users to insert their own articles
- You'll need to create icon files (see ICONS.md)
- The articles table should have columns: `user_id`, `title`, `content`, `html_content`, `url`, `excerpt`, `site_name`, `created_time`

## Database Schema

Your Supabase `articles` table should have at minimum:

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  html_content TEXT,
  url TEXT NOT NULL,
  excerpt TEXT,
  site_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own articles
CREATE POLICY "Users can insert their own articles"
ON articles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own articles
CREATE POLICY "Users can view their own articles"
ON articles FOR SELECT
USING (auth.uid() = user_id);
```

