// API client for Poche webapp
// Uses token-based auth with localStorage

import type { Article, User, AuthResponse } from '@poche/shared'
import { 
  STORAGE_KEYS, 
  shouldRefreshSession, 
  isSessionExpired,
  calculateSessionExpiry,
  parseApiError,
  API_ENDPOINTS 
} from '@poche/shared'

// Backend API URL - loaded from environment variable
// Set VITE_API_URL in .env file (see .env.example)
const API_URL = import.meta.env.VITE_API_URL
if (!API_URL) {
  throw new Error('VITE_API_URL is not set')
}

// ============================================
// Token Storage (localStorage for web)
// ============================================

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  } catch {
    return null
  }
}

function storeToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token)
}

function storeUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

function getStoredUser(): User | null {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER)
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

function clearAuthStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY)
}

function storeSessionExpiry(expiresAt: string): void {
  localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiresAt)
}

function getStoredSessionExpiry(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY)
  } catch {
    return null
  }
}

// ============================================
// API Request Helper
// ============================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add auth token if required
  if (requiresAuth) {
    const token = getStoredToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  // Handle empty responses (like sign-out)
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}

  if (!response.ok) {
    throw new Error(parseApiError(data as Record<string, unknown>, response.status))
  }

  return data as T
}

// ============================================
// Authentication
// ============================================

export async function signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(API_ENDPOINTS.SIGN_UP, {
    method: 'POST',
    body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
  }, false)

  // Store the session token and expiry
  if (response.token) {
    storeToken(response.token)
    storeUser(response.user)
    storeSessionExpiry(calculateSessionExpiry())
  }

  return response
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(API_ENDPOINTS.SIGN_IN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false)

  // Store the session token and expiry
  if (response.token) {
    storeToken(response.token)
    storeUser(response.user)
    storeSessionExpiry(calculateSessionExpiry())
  }

  return response
}

export async function signOut(): Promise<void> {
  try {
    const token = getStoredToken()
    if (token) {
      await apiRequest(API_ENDPOINTS.SIGN_OUT, {
        method: 'POST',
        body: JSON.stringify({}), // Better Auth expects a JSON body
      }, true)
    }
  } catch (error) {
    console.error('Error signing out from server:', error)
  }
  // Always clear local storage
  clearAuthStorage()
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest(API_ENDPOINTS.REQUEST_PASSWORD_RESET, {
    method: 'POST',
    body: JSON.stringify({ 
      email,
      redirectTo: 'https://poche.to/reset-password',
    }),
  }, false)
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest(API_ENDPOINTS.RESET_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  }, false)
}

export async function deleteAccount(password: string): Promise<void> {
  await apiRequest(API_ENDPOINTS.DELETE_ACCOUNT, {
    method: 'POST',
    body: JSON.stringify({ password }),
  }, true)
  // Clear local storage after successful deletion
  clearAuthStorage()
}

export async function getSession(): Promise<AuthResponse | null> {
  try {
    const token = getStoredToken()
    const user = getStoredUser()
    const expiresAt = getStoredSessionExpiry()
    
    if (!token || !user) {
      return null
    }

    // Check if session has expired
    if (isSessionExpired(expiresAt)) {
      clearAuthStorage()
      return null
    }

    // Only refresh session if expiry is less than 3 days away
    if (!shouldRefreshSession(expiresAt)) {
      // Session is still fresh, return cached data
      return {
        redirect: false,
        user,
        token,
      }
    }

    // Verify and refresh the session via API
    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.GET_SESSION}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        // Session is invalid, clear storage
        clearAuthStorage()
        return null
      }
      
      const data = await response.json()
      
      // Update stored user and refresh expiry (session was just validated)
      if (data.user) {
        storeUser(data.user)
      }
      // Refresh expiry since session was validated by the server
      storeSessionExpiry(calculateSessionExpiry())
      
      // Return with stored token
      return {
        redirect: false,
        user: data.user || user,
        token,
      }
    } catch {
      // Network error - return cached session if we have it
      return {
        redirect: false,
        user,
        token,
      }
    }
  } catch {
    return null
  }
}

// ============================================
// Articles
// ============================================

export async function getArticles(): Promise<Article[]> {
  const data = await apiRequest<{ articles: Article[] }>(API_ENDPOINTS.ARTICLES)
  return data.articles
}

export async function getArticle(id: number): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(API_ENDPOINTS.ARTICLE(id))
  return data.article
}

export async function saveArticle(url: string, tags?: string): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(API_ENDPOINTS.ARTICLES, {
    method: 'POST',
    body: JSON.stringify({ url, tags }),
  })
  return data.article
}

export async function updateArticle(id: number, updates: { tags?: string | null; title?: string }): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(API_ENDPOINTS.ARTICLE(id), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  return data.article
}

export async function deleteArticle(id: number): Promise<void> {
  await apiRequest(API_ENDPOINTS.ARTICLE(id), {
    method: 'DELETE',
  })
}

// Re-export types
export type { Article, User, AuthResponse }
