# Poche Web App

Marketing website for Poche - the read-it-later app.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
webapp/
├── public/            # Static assets
│   └── logo.png      # Poche logo
├── src/
│   ├── pages/        # Route pages
│   │   └── Home.tsx  # Marketing landing page
│   ├── App.tsx       # Router configuration
│   ├── main.tsx      # Entry point
│   └── index.css     # Global styles
├── index.html        # HTML template with SEO meta tags
└── package.json
```

## Features

- React 18 with TypeScript
- Vite for fast development
- React Router for navigation
- SEO optimized with meta tags, Open Graph, and structured data
- Responsive design
- Poche brand styling with warm color palette

## Routes

- `/` - Marketing landing page with app download links and browser extension links

