# Poche Shared Package - Summary

## Overview

The `@poche/shared` package contains TypeScript types and utility functions that are shared across all Poche projects (backend, mobile app, browser extension, and web app). This centralizes common code to ensure consistency and reduce duplication.

## Features

- **TypeScript Types**: User, AuthResponse, Article, LegacyArticle interfaces
- **Utility Functions**: `tagToColor()` for consistent tag coloring
- **Local npm Package**: Installed via `file:../shared` in each project
- **Type Safety**: Ensures consistent types across all projects

## Installation

Each project references the shared package as a local dependency in `package.json`:

```json
{
  "dependencies": {
    "@poche/shared": "file:../shared"
  }
}
```

After adding the dependency, run `npm install` in each project directory.

## File Structure

```
shared/
├── src/
│   ├── index.ts      # Re-exports all types and utilities
│   ├── types.ts      # TypeScript interfaces
│   └── util.ts       # Utility functions
├── package.json      # npm package configuration
├── tsconfig.json     # TypeScript configuration
├── README.md         # Package documentation
└── SUMMARY.md        # This file
```

## Types

### User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### AuthResponse

```typescript
interface AuthResponse {
  session: {
    id: string;
    token: string;
    expiresAt: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  user: User | null;
}
```

### Article

```typescript
interface Article {
  id: number;
  userId: string;
  title: string | null;
  content: string | null;
  excerpt: string | null;
  url: string | null;
  siteName: string | null;
  author: string | null;
  wordCount: number | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### LegacyArticle

For backward compatibility with older data structures:

```typescript
interface LegacyArticle {
  id: number;
  user_id: string;
  title: string | null;
  content: string | null;
  excerpt: string | null;
  url: string | null;
  site_name: string | null;
  author: string | null;
  word_count: number | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}
```

## Utility Functions

### tagToColor

Generates a consistent color for a given tag string. Uses a hash function to ensure the same tag always gets the same color.

```typescript
function tagToColor(tag: string): string
```

**Usage:**

```typescript
import { tagToColor } from '@poche/shared';

const color = tagToColor('technology'); // Returns a hex color like '#FF6B6B'
```

**Color Palette:**
The function uses a curated palette of 12 colors that work well in both light and dark modes:
- `#FF6B6B` - Coral
- `#4ECDC4` - Teal
- `#45B7D1` - Sky Blue
- `#96CEB4` - Sage
- `#FFEAA7` - Butter
- `#DDA0DD` - Plum
- `#98D8C8` - Mint
- `#F7DC6F` - Gold
- `#BB8FCE` - Lavender
- `#85C1E9` - Light Blue
- `#F8B500` - Amber
- `#82E0AA` - Spring Green

## Usage in Projects

### Mobile App

```typescript
import { Article, User, tagToColor } from '@poche/shared';

// Use types for state
const [articles, setArticles] = useState<Article[]>([]);

// Use utility for tag colors
const backgroundColor = tagToColor('travel');
```

### Browser Extension

```typescript
import { Article, AuthResponse, tagToColor } from '@poche/shared';

// Use types for API responses
const response: AuthResponse = await signIn(email, password);

// Use utility for tag chips
tags.map(tag => (
  <span style={{ backgroundColor: tagToColor(tag) }}>{tag}</span>
));
```

### Backend

```typescript
import { Article, User } from '@poche/shared';

// Use types for API responses and database operations
function getArticles(userId: string): Promise<Article[]> {
  // ...
}
```

### Web App

```typescript
import { User } from '@poche/shared';

// Use types for user data
const [user, setUser] = useState<User | null>(null);
```

## Development

### Building

The package doesn't require a build step for local development - TypeScript is resolved directly from source files. However, for production deployment, you can compile TypeScript:

```bash
cd shared
npx tsc
```

### Adding New Types

1. Add the type definition to `src/types.ts`
2. Export it from `src/index.ts`
3. Run `npm install` in consuming projects to update

### Adding New Utilities

1. Add the function to `src/util.ts` (or create a new file)
2. Export it from `src/index.ts`
3. Run `npm install` in consuming projects to update

## Configuration

### package.json

```json
{
  "name": "@poche/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

## Recent Enhancements

- ✅ Created centralized shared package at root level
- ✅ Moved types from individual project `shared/` folders
- ✅ TypeScript interfaces: User, AuthResponse, Article, LegacyArticle
- ✅ Utility functions: tagToColor
- ✅ Configured as local npm package (`file:../shared`)
- ✅ Installed in all 4 projects (mobile app, browser extension, backend, web app)
- ✅ Updated imports across all projects to use `@poche/shared`

## Future Enhancements

Potential additions:
- API error types
- Validation utilities
- Date formatting utilities
- Reading time calculation utility
- Article serialization/deserialization helpers
- Shared constants (API endpoints, storage keys)

