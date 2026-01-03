// API client for Poche webapp
// Uses token-based auth with localStorage

import type { Article, User } from '@poche/shared'

// Backend API URL - loaded from environment variable
// Set VITE_API_URL in .env file (see .env.example)
const API_URL = import.meta.env.VITE_API_URL
if (!API_URL) {
  throw new Error('VITE_API_URL is not set')
}

// Storage keys
const TOKEN_STORAGE_KEY = 'poche_auth_token'
const USER_STORAGE_KEY = 'poche_user'
const SESSION_EXPIRY_KEY = 'poche_session_expiry'

// Session refresh threshold (3 days in milliseconds)
const SESSION_REFRESH_THRESHOLD = 3 * 24 * 60 * 60 * 1000

// Session duration matches backend config (7 days)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000

export interface AuthResponse {
  redirect: boolean
  token: string
  user: User
}

// ============================================
// Token Storage
// ============================================

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

function storeUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

function getStoredUser(): User | null {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY)
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
  localStorage.removeItem(SESSION_EXPIRY_KEY)
}

function storeSessionExpiry(expiresAt: string): void {
  localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt)
}

function getStoredSessionExpiry(): string | null {
  try {
    return localStorage.getItem(SESSION_EXPIRY_KEY)
  } catch {
    return null
  }
}

function shouldRefreshSession(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  
  const expiryTime = new Date(expiresAt).getTime()
  const now = Date.now()
  const timeUntilExpiry = expiryTime - now
  
  // Refresh if less than 3 days until expiry or already expired
  return timeUntilExpiry < SESSION_REFRESH_THRESHOLD
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
    // Handle various error response formats from Better Auth
    const errorData = data as Record<string, unknown>
    const errorMessage = 
      errorData.error || 
      errorData.message || 
      (errorData.body && typeof errorData.body === 'object' && 'message' in errorData.body 
        ? (errorData.body as Record<string, unknown>).message 
        : null) ||
      `Request failed: ${response.status}`
    throw new Error(String(errorMessage))
  }

  return data as T
}

// ============================================
// Authentication
// ============================================

export async function signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
  }, false)

  // Store the session token and expiry
  if (response.token) {
    storeToken(response.token)
    storeUser(response.user)
    // Calculate expiry based on backend session duration (7 days)
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()
    storeSessionExpiry(expiresAt)
  }

  return response
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false)

  // Store the session token and expiry
  if (response.token) {
    storeToken(response.token)
    storeUser(response.user)
    // Calculate expiry based on backend session duration (7 days)
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()
    storeSessionExpiry(expiresAt)
  }

  return response
}

export async function signOut(): Promise<void> {
  try {
    const token = getStoredToken()
    if (token) {
      await apiRequest('/api/auth/sign-out', {
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
  await apiRequest('/api/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ 
      email,
      redirectTo: 'https://poche.to/reset-password',
    }),
  }, false)
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
    if (expiresAt) {
      const expiryTime = new Date(expiresAt).getTime()
      if (Date.now() > expiryTime) {
        // Session has expired, clear storage
        clearAuthStorage()
        return null
      }
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
      const response = await fetch(`${API_URL}/api/auth/get-session`, {
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
      const newExpiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()
      storeSessionExpiry(newExpiresAt)
      
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
  const data = await apiRequest<{ articles: Article[] }>('/api/articles')
  return data.articles
}

export async function getArticle(id: number): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(`/api/articles/${id}`)
  return data.article
}

export async function saveArticle(url: string, tags?: string): Promise<Article> {
  const data = await apiRequest<{ article: Article }>('/api/articles', {
    method: 'POST',
    body: JSON.stringify({ url, tags }),
  })
  return data.article
}

export async function updateArticle(id: number, updates: { tags?: string | null; title?: string }): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(`/api/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  return data.article
}

export async function deleteArticle(id: number): Promise<void> {
  await apiRequest(`/api/articles/${id}`, {
    method: 'DELETE',
  })
}

// Re-export types
export type { Article, User }

