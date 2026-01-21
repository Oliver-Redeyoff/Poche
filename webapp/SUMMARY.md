# Poche Web App - Summary

## Overview

The Poche web app is a marketing website that showcases the Poche "read it later" application. It provides information about features, download links for mobile apps, and browser extension installation links. It also handles authentication flows like password reset and includes a full article reading application.

## Features

- **Marketing Landing Page**: Hero section, features showcase, download links
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- **App Download Links**: iOS App Store, Google Play Store
- **Browser Extension Links**: Chrome Web Store, Firefox Add-ons, Safari App Store
- **Password Reset Page**: Handles password reset flow from email links
- **Full App Section**: Sign in, sign up, article list, article detail reading
- **Responsive Design**: Mobile-first with beautiful desktop layout
- **Poche Branding**: Warm color palette with coral accent (#EF4056)
- **Light/Dark Mode**: Automatic theme switching based on `prefers-color-scheme`
- **Font Awesome Icons**: Scalable vector icons throughout the app

## Architecture

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: CSS with CSS variables for theming (dynamic light/dark mode)
- **Typography**: Bitter (display/headings) + Source Sans 3 (body)
- **Icons**: Font Awesome (free tier via CDN)
- **Shared Types/Colors**: `@poche/shared` npm package (local)

### File Structure

```
webapp/
├── src/
│   ├── main.tsx           # React entry point with color scheme setup
│   ├── App.tsx            # React Router routes with ProtectedRoute
│   ├── index.css          # Global styles with CSS variables (base only)
│   ├── vite-env.d.ts      # Vite environment type declarations
│   ├── lib/
│   │   └── api.ts         # API client for backend
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── components/
│   │   ├── Logo.tsx       # Logo component
│   │   ├── Logo.css       # Logo styles
│   │   ├── LoadingSpinner.tsx  # Loading spinner component
│   │   ├── LoadingSpinner.css  # Loading spinner styles
│   │   ├── TagChip.tsx    # Tag chip component
│   │   ├── TagChip.css    # Tag chip styles
│   │   ├── AppHeader.tsx  # App header component
│   │   ├── AppHeader.css  # App header styles
│   │   ├── ArticleCard.tsx  # Article card component
│   │   ├── ArticleCard.css  # Article card styles
│   │   ├── EmptyState.tsx # Empty state component
│   │   ├── EmptyState.css # Empty state styles
│   │   ├── Markdown.tsx   # Custom markdown renderer
│   │   └── Markdown.css   # Markdown styles
│   └── pages/
│       ├── Home.tsx       # Marketing landing page
│       ├── Home.css       # Home page styles
│       ├── ResetPassword.tsx  # Password reset page
│       ├── ResetPassword.css  # Reset password styles
│       └── app/
│           ├── Auth.tsx   # Sign in/sign up/forgot password
│           ├── Auth.css   # Auth page styles
│           ├── Articles.tsx   # Article list
│           ├── Articles.css   # Articles page styles
│           ├── ArticleDetail.tsx  # Article detail view
│           └── ArticleDetail.css  # Article detail styles
├── public/
│   └── logo.png           # Poche logo
├── index.html             # HTML template with Font Awesome CDN
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── .env.example           # Example environment variables
└── SUMMARY.md             # This file
```

## Component Architecture

### Reusable Components

Each component has its own TypeScript file and corresponding CSS file with nested styles:

| Component | Description |
|-----------|-------------|
| `Logo` | Poche logo with image and text |
| `LoadingSpinner` | Animated loading spinner (small, default, large sizes) |
| `TagChip` | Tag display chip (static or button, active state, small size) |
| `AppHeader` | Fixed header with logo, accepts children for right-side content |
| `ArticleCard` | Article card with title, meta, tags, delete button |
| `EmptyState` | Empty/loading/error state display with icon |
| `Markdown` | Custom markdown renderer using `@poche/shared` parsing |

### CSS Organization

- **`index.css`**: Global CSS variables, reset styles, button styles only
- **Component CSS**: Each component has scoped styles in its own `.css` file
- **Page CSS**: Each page has its own `.css` file for page-specific styles
- **Nested Selectors**: All CSS uses nested selectors for better encapsulation
- **Dynamic Color Variables**: Colors are set via JavaScript based on `prefers-color-scheme`

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Marketing landing page |
| `/reset-password` | `ResetPassword` | Password reset form |
| `/privacy-policy` | `PrivacyPolicy` | Privacy policy for app store compliance |
| `/app/auth` | `AuthPage` | Sign in, sign up, forgot password |
| `/app` | `ArticlesPage` | List of saved articles (protected) |
| `/app/article/:id` | `ArticleDetailPage` | Article detail with markdown rendering (protected) |

## Pages

### Home (`/`)

Marketing landing page with:
- **Navigation**: Fixed header with blur effect, logo, and section links
- **Hero Section**: Animated background shapes, headline, CTA buttons, phone mockup
- **Features Section**: 6 feature cards with Font Awesome icons
- **Download Section**: iOS App Store and Google Play download cards
- **Extensions Section**: Chrome, Firefox, Safari extension cards
- **How It Works**: 3-step guide (Install, Save, Read)
- **CTA Section**: Final call-to-action
- **Footer**: Brand info, product links, resources links

### App Section (`/app/*`)

The webapp includes a full article reading application similar to the mobile app:

#### Auth (`/app/auth`)
- Email/password sign in and sign up
- Forgot password flow (sends reset email)
- Mode switching between forms
- Redirects to articles list on success

#### Articles (`/app`)
- Protected route (requires authentication)
- Lists all saved articles using `ArticleCard` component
- Tag filtering using `TagChip` components
- Article cards with title, site name, reading time
- Click to view article detail
- Delete articles with confirmation
- Sign out button in header

#### Article Detail (`/app/article/:id`)
- Protected route (requires authentication)
- Full article reading experience
- Custom `Markdown` renderer
- Tags displayed as chips
- Link back to articles list
- Loading and error states

### Reset Password (`/reset-password`)

Password reset page that handles:
- **Token from URL**: Reads `token` query parameter from email link
- **Error handling**: Handles `error=INVALID_TOKEN` from Better Auth callback
- **Form validation**: Minimum 8 characters, password confirmation
- **API integration**: Calls `POST /api/auth/reset-password` on backend
- **States**: Idle, loading, success, error

### Privacy Policy (`/privacy-policy`)

Privacy policy page for app store compliance:
- **Data collection disclosure**: What data is collected (email, saved articles)
- **Data usage**: How the data is used
- **Third-party sharing**: No sharing with third parties
- **Data retention**: How long data is stored
- **User rights**: How to request data deletion
- **Contact information**: How to reach support

## Styling

### Color System

Colors are loaded from `@poche/shared` and set as CSS variables dynamically in `main.tsx`:

```typescript
import { colors } from '@poche/shared'

// Set colors based on system preference
const scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
const c = colors[scheme]

document.documentElement.style.setProperty('--color-brand-primary', c.brand.primary)
// ... etc
```

### CSS Variables

```css
:root {
  /* Brand Colors (set dynamically) */
  --color-brand-primary: #EF4056;
  --color-brand-light: #FF6B7A;
  --color-brand-dark: #D62E43;
  
  /* Background Colors */
  --color-bg-primary: #FDF8F5;
  --color-bg-secondary: #F5EBE4;
  --color-bg-tertiary: #FFFBF9;
  
  /* Text Colors */
  --color-text-primary: #2D2926;
  --color-text-secondary: #4A4543;
  --color-text-tertiary: #8B8280;
  --color-text-quaternary: #C4BFBC;
  
  /* Border Colors */
  --color-border-primary: #E8D5C4;
  --color-border-secondary: #C4BFBC;
  --color-border-focus: #EF4056;
  
  /* Typography */
  --font-display: 'Bitter', Georgia, serif;
  --font-body: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Design System

- **Spacing**: xs (0.5rem), sm (1rem), md (1.5rem), lg (2.5rem), xl (4rem), 2xl (6rem)
- **Border Radius**: sm (6px), md (12px), lg (20px), xl (32px)
- **Shadows**: sm, md, lg, glow (coral)
- **Buttons**: Primary (coral), Secondary (transparent with border), Large variant

### Responsive Breakpoints

- **1024px**: Hero grid becomes single column
- **768px**: Navigation links hidden, features grid single column
- **480px**: Reduced spacing, smaller phone mockup

## Development

### Setup

```bash
cd webapp
npm install
npm run dev
```

### Scripts

- `npm run dev` - Start Vite development server (port 3001)
- `npm run build` - Build for production
- `npm run build:deploy` - Build and deploy to backend (`../backend/web_app_dist`)
- `npm run preview` - Preview production build

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:3000  # Development
# VITE_API_URL=https://api.poche.to  # Production
```

Environment variables prefixed with `VITE_` are exposed to the client via `import.meta.env`.

## Light/Dark Mode

The webapp implements automatic light/dark mode based on system preferences:

1. **`main.tsx`** imports colors from `@poche/shared`
2. On initial load, checks `prefers-color-scheme` media query
3. Sets CSS variables on `document.documentElement` based on color scheme
4. Adds event listener for `change` event to update colors when system theme changes
5. All CSS uses these CSS variables for colors

```typescript
// In main.tsx
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function applyColorScheme(isDark: boolean) {
  const scheme = isDark ? 'dark' : 'light'
  const c = colors[scheme]
  // Set all CSS variables...
}

applyColorScheme(mediaQuery.matches)
mediaQuery.addEventListener('change', (e) => applyColorScheme(e.matches))
```

## Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "@poche/shared": "file:../shared"
}
```

**Note**: Shared types, utilities, and colors are imported from `@poche/shared` (located at `../shared`).

## Recent Enhancements

- ✅ React + TypeScript with Vite
- ✅ React Router for navigation
- ✅ Marketing landing page with hero section
- ✅ Features section with 6 feature cards
- ✅ Download section for iOS and Android
- ✅ Extensions section for Chrome, Firefox, Safari
- ✅ "How It Works" step-by-step guide
- ✅ CTA sections
- ✅ Responsive design (mobile-first)
- ✅ Custom Poche branding with warm color palette
- ✅ Bitter + Source Sans 3 typography
- ✅ Animated phone mockup in hero
- ✅ Floating background shapes for depth
- ✅ Password reset page with full flow
- ✅ **Privacy policy page**: `/privacy-policy` for app store compliance
- ✅ Token validation and error handling
- ✅ Success and error states for password reset
- ✅ Uses `@poche/shared` package for types and utilities
- ✅ **Full app section** with sign in, sign up, forgot password
- ✅ **Articles list page** with article cards
- ✅ **Article detail page** with markdown rendering
- ✅ **AuthContext** for authentication state management
- ✅ **ProtectedRoute** component for authenticated routes
- ✅ **API client** (`lib/api.ts`) with bearer token auth
- ✅ **Custom Markdown component** for article rendering
- ✅ **Environment variables** via Vite (`VITE_API_URL`)
- ✅ **Build deploy script** (`npm run build:deploy`)
- ✅ **Served via nginx** at `poche.to` in production
- ✅ **Component-based refactor**: Extracted Logo, LoadingSpinner, TagChip, AppHeader, ArticleCard, EmptyState, Markdown
- ✅ **Scoped CSS**: Each component/page has its own CSS file with nested styles
- ✅ **Font Awesome icons**: Replaced SVG icons with Font Awesome
- ✅ **Shared colors**: Uses `@poche/shared` color palette
- ✅ **Light/dark mode**: Automatic switching based on `prefers-color-scheme`
- ✅ **Shared markdown parsing**: Uses tokenization from `@poche/shared`

## Future Enhancements

Potential features:
- Terms of Service page
- Blog section
- Documentation/Help pages
- User testimonials
- Pricing page (if applicable)
- Analytics integration
- Contact form
