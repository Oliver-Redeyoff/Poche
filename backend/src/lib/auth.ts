import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { sendPasswordResetEmail } from './email.js';

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
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email provider
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: url,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },
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
  advanced: {
    // Disable CSRF check for API clients (mobile apps, etc.)
    // Mobile apps don't have CSRF vulnerabilities since they don't use cookies
    disableCSRFCheck: true,
  },
  trustedOrigins: ['*'], // Allow all origins - we handle security via bearer tokens
});

export type Auth = typeof auth;

