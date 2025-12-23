# Installation Guide

## Prerequisites

1. Node.js and npm installed
2. Your Supabase project configured with the articles table

## Setup Steps

### 1. Install Dependencies

```bash
cd browser_extension
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This creates a `dist` folder with all the compiled files.

### 3. Install in Your Browser

#### Chrome/Edge (Chromium-based)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension should now appear in your extensions list

#### Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to the `dist` folder and select `manifest.json`
5. The extension should now be loaded

#### Safari

Safari requires additional setup:

1. Enable the Develop menu: Safari > Preferences > Advanced > "Show Develop menu"
2. Open Safari > Develop > Extension Builder
3. Click the "+" button and select "Add Extension..."
4. Navigate to the `dist` folder and select it
5. Click "Run" to enable the extension

**Note:** Safari extensions require code signing for distribution. For development, you may need to enable "Allow Unsigned Extensions" in Safari preferences.

## Usage

1. Click the Poche extension icon in your browser toolbar
2. If not logged in, enter your email and password to sign in or sign up
3. Navigate to any article you want to save
4. Click the extension icon again
5. Click "Save Article" to save the current page
6. The article will be parsed and saved to your Supabase articles table

## Troubleshooting

### Extension not loading
- Make sure you've built the extension with `npm run build`
- Check the browser console for errors
- Verify the manifest.json is valid

### Authentication not working
- Check that your Supabase URL and key are correct in `src/lib/supabase.js`
- Verify your Supabase project has authentication enabled
- Check browser console for authentication errors

### Article parsing fails
- Some pages may not parse correctly due to their structure
- Check the browser console for Readability errors
- Try a different article to test

### Articles not saving
- Verify your Supabase articles table exists
- Check RLS policies allow users to insert their own articles
- Verify the table has the required columns: `user_id`, `title`, `content`, `url`, etc.

## Development

For development with auto-rebuild:

```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

