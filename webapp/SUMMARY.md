# Poche Web App - Summary

## Overview

The Poche web app is a marketing website that showcases the Poche "read it later" application. It provides information about features, download links for mobile apps, and browser extension installation links. It also handles authentication flows like password reset.

## Features

- **Marketing Landing Page**: Hero section, features showcase, download links
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- **App Download Links**: iOS App Store, Google Play Store
- **Browser Extension Links**: Chrome Web Store, Firefox Add-ons, Safari App Store
- **Password Reset Page**: Handles password reset flow from email links
- **Responsive Design**: Mobile-first with beautiful desktop layout
- **Poche Branding**: Warm color palette with coral accent (#EF4056)

## Architecture

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: CSS with CSS variables for theming
- **Typography**: Bitter (display/headings) + Source Sans 3 (body)
- **Shared Types**: `@poche/shared` npm package (local)

### File Structure

```
webapp/
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # React Router routes
│   ├── index.css          # Global styles with CSS variables
│   └── pages/
│       ├── Home.tsx       # Marketing landing page
│       └── ResetPassword.tsx  # Password reset page
├── public/
│   └── logo.png           # Poche logo
├── index.html             # HTML template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
└── SUMMARY.md             # This file
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Marketing landing page |
| `/reset-password` | `ResetPassword` | Password reset form |

## Pages

### Home (`/`)

Marketing landing page with:
- **Navigation**: Fixed header with blur effect, logo, and section links
- **Hero Section**: Animated background shapes, headline, CTA buttons, phone mockup
- **Features Section**: 6 feature cards (Save from Anywhere, Read Offline, Distraction-Free, Organize with Tags, Cross-Platform, Self-Hosted Option)
- **Download Section**: iOS App Store and Google Play download cards
- **Extensions Section**: Chrome, Firefox, Safari extension cards
- **How It Works**: 3-step guide (Install, Save, Read)
- **CTA Section**: Final call-to-action
- **Footer**: Brand info, product links, resources links

### Reset Password (`/reset-password`)

Password reset page that handles:
- **Token from URL**: Reads `token` query parameter from email link
- **Error handling**: Handles `error=INVALID_TOKEN` from Better Auth callback
- **Form validation**: Minimum 8 characters, password confirmation
- **API integration**: Calls `POST /api/auth/reset-password` on backend
- **States**: Idle, loading, success, error

#### URL Parameters

| Parameter | Description |
|-----------|-------------|
| `token` | Reset token from Better Auth (required for form) |
| `error` | Error code from callback (e.g., `INVALID_TOKEN`) |

#### API Call

```typescript
POST https://api.poche.to/api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-url",
  "newPassword": "user-new-password"
}
```

## Styling

### CSS Variables

```css
:root {
  /* Brand Colors */
  --poche-coral: #EF4056;
  --poche-coral-light: #FF6B7A;
  --poche-coral-dark: #D62E43;
  
  /* Warm Neutrals */
  --cream: #FDF8F5;
  --cream-dark: #F5EBE4;
  --warm-white: #FFFBF9;
  --charcoal: #2D2926;
  --charcoal-light: #4A4543;
  --warm-gray: #8B8280;
  
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

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Configuration

The `ResetPassword` page has an `API_URL` constant that should be updated for different environments:
- Development: `http://localhost:3000`
- Production: `https://api.poche.to`

## Password Reset Flow

1. User requests password reset from browser extension or mobile app
2. Request includes `redirectTo: 'https://poche.to/reset-password'`
3. Backend sends email with link to Better Auth callback
4. User clicks email link → Better Auth validates token
5. Better Auth redirects to `https://poche.to/reset-password?token={token}`
6. User enters new password on webapp
7. Webapp calls `POST /api/auth/reset-password` with token and new password
8. On success, user can sign in with new password

## Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "@poche/shared": "file:../shared"
}
```

**Note**: Shared types and utilities are imported from `@poche/shared` (located at `../shared`).

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
- ✅ Token validation and error handling
- ✅ Success and error states for password reset
- ✅ Uses `@poche/shared` package for types

## Future Enhancements

Potential features:
- Privacy Policy page
- Terms of Service page
- Blog section
- Documentation/Help pages
- User testimonials
- Pricing page (if applicable)
- Analytics integration
- Contact form

