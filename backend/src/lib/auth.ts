import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email provider
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  plugins: [
    bearer(), // Enable bearer token authentication for API clients
  ],
  trustedOrigins: (request) => {
    // Get origin from request headers
    const origin = request?.headers?.get('origin');
    
    // Mobile apps don't send an Origin header, so allow requests without one
    if (!origin) {
      return ['*']; // Allow requests with no origin (mobile apps, Postman, etc.)
    }
    
    const origins: string[] = [
      'http://localhost:3000',
      'http://localhost:8081', // Expo
    ];
    
    // Allow chrome extensions
    if (origin.startsWith('chrome-extension://')) {
      origins.push(origin);
    }
    // Allow firefox extensions
    if (origin.startsWith('moz-extension://')) {
      origins.push(origin);
    }
    // Allow safari extensions
    if (origin.startsWith('safari-extension://')) {
      origins.push(origin);
    }
    // Allow any localhost port
    if (origin.startsWith('http://localhost:')) {
      origins.push(origin);
    }
    // Allow requests from any IP (for mobile development)
    if (origin.match(/^http:\/\/\d+\.\d+\.\d+\.\d+(:\d+)?$/)) {
      origins.push(origin);
    }
    
    return origins;
  },
});

export type Auth = typeof auth;

