# Poche Backend

A self-hosted backend API for the Poche "read it later" application. Built with Hono, Better Auth, Drizzle ORM, and Defuddle.

## Features

- **Authentication**: Email/password authentication with Better Auth
- **Article Extraction**: Server-side article parsing with Defuddle (outputs Markdown)
- **PostgreSQL Database**: Persistent storage with Drizzle ORM
- **RESTful API**: Clean API for mobile app and browser extension
- **Docker Ready**: Easy deployment with Docker Compose

## Tech Stack

- **Framework**: [Hono](https://hono.dev/) - Fast, lightweight web framework
- **Authentication**: [Better Auth](https://better-auth.com/) - TypeScript-first auth library
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Article Parsing**: [Defuddle](https://github.com/kepano/defuddle) - Extract content from web pages

---

## Quick Start with Docker (Recommended)

### Development

```bash
# Start PostgreSQL + API with hot reload
npm run docker:dev

# Or build and start fresh
npm run docker:dev:build

# Stop containers
npm run docker:dev:down
```

The API will be available at `http://localhost:3000`.

### Production

1. Create a `.env` file with your production settings:

```bash
# Required
POSTGRES_USER=poche
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=poche
BETTER_AUTH_SECRET=your-very-long-secret-key-at-least-32-characters
BETTER_AUTH_URL=https://your-api-domain.com

# Optional
PORT=3000
NODE_ENV=production
```

2. Start the containers:

```bash
# Build and start in detached mode
npm run docker:prod:build

# View logs
npm run docker:logs

# Stop containers
npm run docker:prod:down
```

### Database Migrations with Docker

```bash
# Connect to the running API container and run migrations
docker compose exec api npm run db:push
```

---

## Manual Setup (Without Docker)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
cp env.example.txt .env
```

Edit `.env` with your values:

```env
# Database - PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/poche

# Server port
PORT=3000

# Better Auth - generate a secure secret (min 32 chars)
BETTER_AUTH_SECRET=your-very-long-secret-key-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Set Up Database

Make sure PostgreSQL is running, then push the schema:

```bash
npm run db:push
```

Or generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

---

## API Endpoints

### Health Check

```
GET /
```

### Authentication (Better Auth)

```
POST /api/auth/sign-up/email   - Create account
POST /api/auth/sign-in/email   - Sign in
POST /api/auth/sign-out        - Sign out
GET  /api/auth/session         - Get current session
```

### Articles (Protected - requires authentication)

```
GET    /api/articles       - List all articles
POST   /api/articles       - Save article from URL
GET    /api/articles/:id   - Get single article
PATCH  /api/articles/:id   - Update article (tags, etc.)
DELETE /api/articles/:id   - Delete article
```

### Example: Save Article

```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -d '{"url": "https://example.com/article", "tags": "tech,news"}'
```

Response:

```json
{
  "article": {
    "id": 1,
    "userId": "user_123",
    "url": "https://example.com/article",
    "title": "Article Title",
    "content": "# Article Title\n\nMarkdown content...",
    "excerpt": "Article excerpt...",
    "siteName": "example.com",
    "wordCount": 1500,
    "tags": "tech,news",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:dev` | Start development containers |
| `npm run docker:dev:build` | Build and start dev containers |
| `npm run docker:dev:down` | Stop development containers |
| `npm run docker:prod` | Start production containers |
| `npm run docker:prod:build` | Build and start production containers |
| `npm run docker:prod:down` | Stop production containers |
| `npm run docker:logs` | View API logs |

---

## Database Management

```bash
# Push schema changes to database (development)
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

---

## Production Deployment

### Using Docker on a VPS

1. SSH into your VPS (Hetzner, DigitalOcean, etc.)

2. Install Docker:
```bash
curl -fsSL https://get.docker.com | sh
```

3. Clone your repository and navigate to the backend folder

4. Create your `.env` file with production values

5. Start the containers:
```bash
docker compose up -d --build
```

6. Set up a reverse proxy (nginx, Caddy) for HTTPS

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Cost Estimate

| Provider | VPS | PostgreSQL | Total |
|----------|-----|------------|-------|
| Hetzner CX22 | €3.79/mo | Included (Docker) | ~$4/mo |
| DigitalOcean | $6/mo | Included (Docker) | ~$6/mo |
| Railway | N/A | ~$5/mo | ~$7/mo |

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema definitions
│   ├── lib/
│   │   ├── auth.ts           # Better Auth configuration
│   │   └── article-extractor.ts  # Defuddle integration
│   └── routes/
│       └── articles.ts       # Article API routes
├── Dockerfile                # Production Docker image
├── docker-compose.yml        # Production Docker Compose
├── docker-compose.dev.yml    # Development Docker Compose
├── drizzle.config.ts         # Drizzle Kit configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## Migrating from Supabase

To migrate your existing Supabase data:

1. Export articles from Supabase
2. Update the mobile app and browser extension to use the new API URL
3. Import articles to the new database

The article schema is similar to Supabase, with these changes:
- `length` → `wordCount` (now stores word count from Defuddle)
- `content` now stores Markdown instead of HTML
- Authentication uses Better Auth sessions instead of Supabase Auth
