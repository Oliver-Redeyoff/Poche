# Poche Backend - Summary

## Overview

The Poche backend is a self-hosted API server that handles authentication and article management. It replaces Supabase with a lightweight, self-hosted solution using Hono, Better Auth, Drizzle ORM, and PostgreSQL.

## Features

- **Authentication**: Email/password authentication with bearer token support
- **Password Reset**: Email-based password reset flow via Resend
- **Email Service**: Transactional emails with beautiful HTML templates
- **Article Extraction**: Server-side article parsing using Defuddle (URL → markdown)
- **RESTful API**: Full CRUD operations for articles
- **Docker Support**: Easy deployment with Docker Compose
- **Type Safety**: Full TypeScript with Drizzle ORM
- **Shared Types**: Uses `@poche/shared` package for common types

## Architecture

### Technology Stack

- **Framework**: Hono (lightweight Node.js web framework)
- **Authentication**: Better Auth with bearer plugin
- **Email**: Resend for transactional emails (password reset)
- **Database**: PostgreSQL with Drizzle ORM
- **Article Extraction**: Defuddle (Node.js version for markdown output)
- **Shared Types**: `@poche/shared` npm package
- **Runtime**: Node.js 20
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx with HTTPS
- **SSL/TLS**: Let's Encrypt via Certbot with Cloudflare DNS plugin

### File Structure

```
backend/
├── src/
│   ├── index.ts              # Main Hono server entry point
│   ├── db/
│   │   ├── index.ts          # Drizzle ORM client
│   │   ├── schema.ts         # Database schema definitions
│   │   └── migrations/       # Database migrations
│   ├── lib/
│   │   ├── auth.ts           # Better Auth configuration
│   │   ├── email.ts          # Email service (Resend)
│   │   └── article-extractor.ts  # Defuddle article extraction
│   └── routes/
│       └── articles.ts       # Article API routes
├── docker-compose.yml        # Production Docker config (API + PostgreSQL + Nginx)
├── docker-compose.dev.yml    # Development Docker config
├── nginx.conf                # Nginx reverse proxy config (HTTPS for api.poche.to)
├── Dockerfile                # Container build
├── drizzle.config.ts         # Drizzle Kit configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── env.example.txt           # Example environment variables
└── SUMMARY.md                # This file
```

## Database Schema

### Better Auth Tables

#### `user`
- `id` (text, primary key)
- `name` (text, required)
- `email` (text, unique, required)
- `emailVerified` (boolean, default false)
- `image` (text, nullable)
- `createdAt`, `updatedAt` (timestamps)

#### `session`
- `id` (text, primary key)
- `token` (text, unique) - Bearer token for API authentication
- `expiresAt` (timestamp)
- `userId` (text, foreign key to user)
- `ipAddress`, `userAgent` (metadata)
- `createdAt`, `updatedAt` (timestamps)

#### `account`
- `id` (text, primary key)
- `accountId`, `providerId` (text)
- `userId` (text, foreign key to user)
- `accessToken`, `refreshToken`, `idToken` (text, nullable)
- `password` (text, nullable) - Hashed password for email/password auth
- `createdAt`, `updatedAt` (timestamps)

#### `verification`
- `id` (text, primary key)
- `identifier`, `value` (text)
- `expiresAt` (timestamp)

### Application Tables

#### `articles`
- `id` (integer, auto-generated primary key)
- `userId` (text, foreign key to user, cascade delete)
- `title` (text, nullable)
- `content` (text, nullable) - Markdown content from Defuddle
- `excerpt` (text, nullable)
- `url` (text, nullable) - Original article URL
- `siteName` (text, nullable)
- `author` (text, nullable)
- `wordCount` (integer, nullable)
- `tags` (text, nullable) - Comma-delimited tags
- `createdAt`, `updatedAt` (timestamps)

## API Endpoints

### Health Check
- `GET /` - Returns API status and version

### Authentication (Better Auth)
- `POST /api/auth/sign-up/email` - Create account
- `POST /api/auth/sign-in/email` - Sign in (returns session with bearer token)
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/get-session` - Validate session
- `POST /api/auth/request-password-reset` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token

### Articles (Protected)
All article endpoints require `Authorization: Bearer <token>` header.

- `GET /api/articles` - List all articles for authenticated user
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Save article from URL
  - Body: `{ url: string, tags?: string }`
  - Backend fetches URL and extracts content with Defuddle
- `PATCH /api/articles/:id` - Update article (tags, title)
- `DELETE /api/articles/:id` - Delete article

## Authentication Flow

### Bearer Token Authentication

1. Client sends credentials to `/api/auth/sign-in/email`
2. Better Auth validates credentials and creates session
3. Response includes `session.token` (bearer token)
4. Client stores token locally (browser storage, AsyncStorage, etc.)
5. All subsequent requests include `Authorization: Bearer <token>` header
6. Backend validates token via Better Auth's bearer plugin

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:*` (any port for development)
- `chrome-extension://*` (Chrome extensions)
- `moz-extension://*` (Firefox extensions)
- `safari-extension://*` (Safari extensions)

This is handled both in Hono's CORS middleware and Better Auth's `trustedOrigins` configuration.

## Docker Deployment

### Development

```bash
# Start with hot-reloading
docker compose -f docker-compose.dev.yml up

# Run database migrations
docker compose -f docker-compose.dev.yml exec api npm run db:generate
docker compose -f docker-compose.dev.yml exec api npm run db:push
```

### Production

Production uses Docker Compose with three services:
- **db**: PostgreSQL 16 (Alpine)
- **api**: Poche backend API (Node.js 20 Alpine)
- **nginx**: Reverse proxy with HTTPS (api.poche.to)

#### 1. Create `.env` file

All environment variables are required (no defaults). Create a `.env` file in the backend directory:

```env
# Database
POSTGRES_USER=poche
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=poche

# Auth
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=https://api.poche.to

# Server
PORT=3000
```

#### 2. Set up SSL certificates with Certbot

Using Cloudflare DNS plugin for Let's Encrypt:

```bash
# Install certbot with Cloudflare plugin
sudo snap install --classic certbot
sudo snap set certbot trust-plugin-with-root=ok
sudo snap install certbot-dns-cloudflare

# Create Cloudflare credentials file
sudo mkdir -p /etc/letsencrypt
sudo nano /etc/letsencrypt/cloudflare.ini
# Add: dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN
sudo chmod 600 /etc/letsencrypt/cloudflare.ini

# Get certificate
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d api.poche.to
```

#### 3. Start services

```bash
docker compose up -d --build
```

#### 4. Run database migrations

```bash
docker compose exec api npm run db:push
```

#### 5. Set up auto-renewal hook

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
echo '#!/bin/bash
docker restart poche-nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/restart-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-nginx.sh
```

## NPM Scripts

- `npm run dev` - Start development server with tsx watch
- `npm run build` - Compile TypeScript to dist/
- `npm start` - Run production server from dist/
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:dev:studio` - Open Drizzle Studio for dev database
- `npm run db:prod:studio` - Open Drizzle Studio for production database

## Key Implementation Details

### Article Extraction

The `article-extractor.ts` module uses Defuddle's Node.js version to:
1. Fetch the URL content
2. Parse HTML with JSDOM
3. Extract readable content as markdown
4. Return title, content, excerpt, author, wordCount, siteName

### Better Auth Configuration

Located in `src/lib/auth.ts`:
- Uses Drizzle adapter for PostgreSQL
- Email/password authentication enabled
- Bearer plugin for token-based auth (critical for extensions)
- 7-day session expiration
- Dynamic trusted origins for browser extensions

### Middleware Stack

1. Logger - Request logging
2. CORS - Cross-origin request handling with dynamic origin validation
3. Auth Middleware - Validates bearer token for protected routes

## Known Considerations

- **Schema Setup**: Database schema must be pushed manually with `npm run db:push`
- **Email Verification**: Currently disabled (`requireEmailVerification: false`)
- **Browser Extensions**: Require bearer token auth (cookies don't work cross-origin)
- **CORS**: Extensions have dynamic origins that must be validated at runtime
- **SSL Certificates**: Let's Encrypt certs expire every 90 days; Certbot auto-renews
- **Environment Variables**: All required in production (uses `${VAR:?error}` syntax)
- **DNS**: Ensure `api.poche.to` points to the server before starting services
- **Cloudflare**: If using Cloudflare proxy, set SSL mode to "Full (strict)"

## Nginx Configuration

The `nginx.conf` file configures the reverse proxy:

- **HTTPS on port 443** with TLSv1.2/1.3
- **HTTP to HTTPS redirect** on port 80
- **Default server blocks** to reject requests for unknown hostnames (returns 444)
- **Proxy headers** for proper client IP forwarding
- **WebSocket support** for real-time features

SSL certificates are mounted from `/etc/letsencrypt` (Let's Encrypt directory).

## Recent Fixes

- ✅ Added bearer plugin to Better Auth for token-based authentication
- ✅ Dynamic CORS origin validation for browser extensions
- ✅ Dynamic trustedOrigins for Better Auth to accept extension origins
- ✅ Token storage in extension's local storage instead of cookies
- ✅ Nginx reverse proxy with HTTPS support
- ✅ Let's Encrypt SSL via Certbot with Cloudflare DNS plugin
- ✅ Environment variables loaded from `.env` file with required validation
- ✅ Removed dotenv dependency (not needed in production with Docker)
- ✅ Node.js-based healthcheck (replaces wget which isn't in Alpine)
- ✅ Default server blocks to reject unknown hostnames
- ✅ **Password reset flow**: `sendResetPassword` callback in Better Auth
- ✅ **Email service**: Resend integration (`src/lib/email.ts`)
- ✅ **Password reset emails**: Beautiful HTML templates with Poche branding
- ✅ Uses `@poche/shared` package for common types

## Future Enhancements

- Email verification flow
- API rate limiting
- Full-text search for articles
- Automatic database migration on startup
