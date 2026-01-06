// API client for Poche backend
// Uses token-based auth with AsyncStorage for React Native

import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import type { Article, User, AuthResponse } from '@poche/shared'
import { 
  shouldRefreshSession, 
  isSessionExpired,
  calculateSessionExpiry,
  parseApiError,
  API_ENDPOINTS 
} from '@poche/shared'

// Backend API URL - loaded from environment variable via app.config.js
// Set API_URL in .env file (see .env.example)
const API_URL = Constants.expoConfig?.extra?.apiUrl
if (!API_URL) {
  throw new Error('API_URL is not set. Create a .env file with API_URL=http://your-api-url')
}

// Storage keys (React Native convention uses @ prefix)
const TOKEN_STORAGE_KEY = '@poche_auth_token'
const USER_STORAGE_KEY = '@poche_user'
const SESSION_EXPIRY_KEY = '@poche_session_expiry'

// ============================================
// Configuration
// ============================================

let apiUrl = API_URL

export function setApiUrl(url: string): void {
  apiUrl = url
}

export function getApiUrl(): string {
  return apiUrl
}

// ============================================
// Token Storage (AsyncStorage for React Native)
// ============================================

async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

async function storeToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token)
}

async function storeUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

async function getStoredUser(): Promise<User | null> {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY)
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

async function clearAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY, SESSION_EXPIRY_KEY])
}

async function storeSessionExpiry(expiresAt: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_EXPIRY_KEY, expiresAt)
}

async function getStoredSessionExpiry(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_EXPIRY_KEY)
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
    const token = await getStoredToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
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
    await storeToken(response.token)
    await storeUser(response.user)
    await storeSessionExpiry(calculateSessionExpiry())
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
    await storeToken(response.token)
    await storeUser(response.user)
    await storeSessionExpiry(calculateSessionExpiry())
  }

  return response
}

export async function signOut(): Promise<void> {
  try {
    const token = await getStoredToken()
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
  await clearAuthStorage()
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

export async function getSession(): Promise<AuthResponse | null> {
  try {
    const token = await getStoredToken()
    const user = await getStoredUser()
    const expiresAt = await getStoredSessionExpiry()
    
    if (!token || !user) {
      return null
    }

    // Check if session has expired
    if (isSessionExpired(expiresAt)) {
      await clearAuthStorage()
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
      const response = await fetch(`${apiUrl}${API_ENDPOINTS.GET_SESSION}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        // Session is invalid, clear storage
        await clearAuthStorage()
        return null
      }
      
      const data = await response.json()
      
      // Update stored user and refresh expiry (session was just validated)
      if (data.user) {
        await storeUser(data.user)
      }
      // Refresh expiry since session was validated by the server
      await storeSessionExpiry(calculateSessionExpiry())
      
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

// Export for configuration
export { API_URL }

// Re-export types
export type { Article, User, AuthResponse }
