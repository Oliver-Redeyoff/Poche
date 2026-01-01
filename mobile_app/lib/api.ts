// API client for Poche backend
// Uses token-based auth with AsyncStorage for React Native

import AsyncStorage from '@react-native-async-storage/async-storage'

// Backend API URL - change this for production
// For local development on a physical device, use your computer's IP address
// For iOS simulator, use 'http://localhost:3000'
// For Android emulator, use 'http://10.0.2.2:3000'
const API_URL = 'http://192.168.1.234:3000'

// Storage keys
const TOKEN_STORAGE_KEY = '@poche_auth_token'
const USER_STORAGE_KEY = '@poche_user'

// Types
export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  redirect: boolean
  token: string
  user: User
}

export interface Article {
  id: number
  userId: string
  title: string | null
  content: string | null
  excerpt: string | null
  url: string | null
  siteName: string | null
  author: string | null
  wordCount: number | null
  tags: string | null
  createdAt: string
  updatedAt: string
}

interface ApiError {
  error: string
  details?: unknown
}

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
// Token Storage
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
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY])
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
    throw new Error((data as ApiError).error || `Request failed: ${response.status}`)
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

  // Store the session token
  if (response.token) {
    await storeToken(response.token)
    await storeUser(response.user)
  }

  return response
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false)

  // Store the session token
  if (response.token) {
    await storeToken(response.token)
    await storeUser(response.user)
  }

  return response
}

export async function signOut(): Promise<void> {
  try {
    const token = await getStoredToken()
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
  await clearAuthStorage()
}

export async function getSession(): Promise<AuthResponse | null> {
  try {
    const token = await getStoredToken()
    const user = await getStoredUser()
    
    if (!token || !user) {
      return null
    }

    // Verify the session is still valid by calling the API
    try {
      const response = await fetch(`${apiUrl}/api/auth/get-session`, {
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
      
      // Update stored user in case it changed
      if (data.user) {
        await storeUser(data.user)
      }
      
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

// Export for configuration
export { API_URL }

