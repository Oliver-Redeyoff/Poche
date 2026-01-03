# @poche/shared

Shared types and utilities for Poche applications.

## Installation

This package is installed as a local dependency in all Poche projects:

```json
{
  "dependencies": {
    "@poche/shared": "file:../shared"
  }
}
```

## Setup

Before using this package, you need to build it:

```bash
cd shared
npm install
npm run build
```

Then install dependencies in the consuming projects:

```bash
cd ../mobile_app && npm install
cd ../browser_extension && npm install
cd ../backend && npm install
cd ../webapp && npm install
```

## Usage

### Import types and utilities

```typescript
import { Article, User, AuthResponse, tagToColor } from '@poche/shared'
```

### Import specific modules

```typescript
import { Article, User } from '@poche/shared/types'
import { tagToColor } from '@poche/shared/util'
```

## Exports

### Types (`@poche/shared/types`)

| Type | Description |
|------|-------------|
| `User` | User type from Better Auth |
| `AuthResponse` | Auth response from Better Auth (token + user) |
| `Article` | Article type from backend |
| `LegacyArticle` | Legacy Supabase article type (for migration) |

### Functions (`@poche/shared/types`)

| Function | Description |
|----------|-------------|
| `convertLegacyArticle(legacy)` | Convert legacy article to new format |

### Utilities (`@poche/shared/util`)

| Function | Description |
|----------|-------------|
| `tagToColor(tag, opacity?)` | Generate consistent color for a tag |

## Development

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run dev
```

## Type Definitions

### User

```typescript
interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
}
```

### AuthResponse

```typescript
interface AuthResponse {
  redirect: boolean
  token: string
  user: User
}
```

### Article

```typescript
interface Article {
  id: number
  userId: string
  title: string | null
  content: string | null
  excerpt: string | null
  url: string | null
  siteName: string | null
  author: string | null
  wordCount: number | null
  tags: string | null
  createdAt: string
  updatedAt: string
}
```

