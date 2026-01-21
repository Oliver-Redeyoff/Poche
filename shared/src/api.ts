// Shared API utilities for Poche applications

// ============================================
// Constants
// ============================================

// Session refresh threshold (3 days in milliseconds)
export const SESSION_REFRESH_THRESHOLD = 3 * 24 * 60 * 60 * 1000

// Session duration matches backend config (7 days)
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000

// Storage keys (shared naming convention)
export const STORAGE_KEYS = {
  TOKEN: 'poche_auth_token',
  USER: 'poche_user',
  SESSION_EXPIRY: 'poche_session_expiry',
} as const

// ============================================
// Helper Functions
// ============================================

/**
 * Determines if a session should be refreshed based on expiry time
 * Returns true if:
 * - No expiry is set
 * - Less than SESSION_REFRESH_THRESHOLD until expiry
 * - Session has already expired
 */
export function shouldRefreshSession(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  
  const expiryTime = new Date(expiresAt).getTime()
  const now = Date.now()
  const timeUntilExpiry = expiryTime - now
  
  // Refresh if less than 3 days until expiry or already expired
  return timeUntilExpiry < SESSION_REFRESH_THRESHOLD
}

/**
 * Checks if a session has expired
 */
export function isSessionExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  
  const expiryTime = new Date(expiresAt).getTime()
  return Date.now() > expiryTime
}

/**
 * Calculates a new session expiry timestamp
 */
export function calculateSessionExpiry(): string {
  return new Date(Date.now() + SESSION_DURATION).toISOString()
}

/**
 * Parses error message from various API response formats (Better Auth compatible)
 */
export function parseApiError(data: Record<string, unknown>, status: number): string {
  return String(
    data.error || 
    data.message || 
    (data.body && typeof data.body === 'object' && 'message' in data.body 
      ? (data.body as Record<string, unknown>).message 
      : null) ||
    `Request failed: ${status}`
  )
}

/**
 * API endpoints used across all clients
 */
export const API_ENDPOINTS = {
  // Auth
  SIGN_UP: '/api/auth/sign-up/email',
  SIGN_IN: '/api/auth/sign-in/email',
  SIGN_OUT: '/api/auth/sign-out',
  GET_SESSION: '/api/auth/get-session',
  REQUEST_PASSWORD_RESET: '/api/auth/request-password-reset',
  RESET_PASSWORD: '/api/auth/reset-password',
  DELETE_ACCOUNT: '/api/auth/delete-user',
  
  // Articles
  ARTICLES: '/api/articles',
  ARTICLE: (id: number) => `/api/articles/${id}`,
} as const

