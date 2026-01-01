import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './lib/auth.js';
import articlesRoutes from './routes/articles.js';
import type { Session, User } from 'better-auth';

// Type for authenticated context
type AppContext = {
  Variables: {
    user: User;
    session: Session;
  };
};

const app = new Hono<AppContext>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return 'http://localhost:3000';
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost:')) return origin;
    
    // Allow chrome extensions
    if (origin.startsWith('chrome-extension://')) return origin;
    
    // Allow firefox extensions
    if (origin.startsWith('moz-extension://')) return origin;
    
    // Allow safari extensions
    if (origin.startsWith('safari-extension://')) return origin;
    
    // Add your production domains here
    // if (origin === 'https://your-app.com') return origin;
    
    return 'http://localhost:3000';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    name: 'Poche API',
    version: '1.0.0',
    status: 'healthy',
  });
});

// Better Auth handler - handles all /api/auth/* routes
app.on(['GET', 'POST'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw);
});

// Auth middleware for protected routes
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  c.set('session', session.session);
  await next();
};

// Protected API routes
app.use('/api/articles/*', authMiddleware);
app.route('/api/articles', articlesRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Start server
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0'; // Bind to all interfaces for external access

console.log(`🚀 Poche API server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname, // Allow connections from any IP (not just localhost)
}, (info) => {
  console.log(`✅ Server is running on http://${hostname}:${info.port}`);
  console.log(`📚 API endpoints:`);
  console.log(`   GET  /                    - Health check`);
  console.log(`   POST /api/auth/sign-up    - Create account`);
  console.log(`   POST /api/auth/sign-in    - Sign in`);
  console.log(`   POST /api/auth/sign-out   - Sign out`);
  console.log(`   GET  /api/auth/session    - Get current session`);
  console.log(`   GET  /api/articles        - List articles`);
  console.log(`   POST /api/articles        - Save article from URL`);
  console.log(`   GET  /api/articles/:id    - Get article`);
  console.log(`   PATCH /api/articles/:id   - Update article`);
  console.log(`   DELETE /api/articles/:id  - Delete article`);
});

export default app;

