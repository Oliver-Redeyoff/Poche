// API client for Poche backend
// Uses token-based auth for browser extension compatibility

import type { Article, User, AuthResponse } from '@poche/shared'
import { 
  STORAGE_KEYS, 
  shouldRefreshSession, 
  isSessionExpired,
  calculateSessionExpiry,
  parseApiError,
  API_ENDPOINTS 
} from '@poche/shared'

// Declare browser for Firefox compatibility
declare const browser: typeof chrome;

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : browser;

// Backend API URL - loaded from environment variable
// Set VITE_API_URL in .env file (see .env.example)
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('VITE_API_URL is not set')
}

// For compatibility with existing code
export type Session = AuthResponse;

// ============================================
// Token Storage (chrome.storage.local for extensions)
// ============================================

async function getStoredToken(): Promise<string | null> {
  try {
    const result = await browserAPI.storage.local.get(STORAGE_KEYS.TOKEN);
    return result[STORAGE_KEYS.TOKEN] || null;
  } catch {
    return null;
  }
}

async function storeToken(token: string): Promise<void> {
  await browserAPI.storage.local.set({ [STORAGE_KEYS.TOKEN]: token });
}

async function storeUser(user: User): Promise<void> {
  await browserAPI.storage.local.set({ [STORAGE_KEYS.USER]: user });
}

async function getStoredUser(): Promise<User | null> {
  try {
    const result = await browserAPI.storage.local.get(STORAGE_KEYS.USER);
    return result[STORAGE_KEYS.USER] || null;
  } catch {
    return null;
  }
}

async function clearAuthStorage(): Promise<void> {
  await browserAPI.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER, STORAGE_KEYS.SESSION_EXPIRY]);
}

async function storeSessionExpiry(expiresAt: string): Promise<void> {
  await browserAPI.storage.local.set({ [STORAGE_KEYS.SESSION_EXPIRY]: expiresAt });
}

async function getStoredSessionExpiry(): Promise<string | null> {
  try {
    const result = await browserAPI.storage.local.get(STORAGE_KEYS.SESSION_EXPIRY);
    return result[STORAGE_KEYS.SESSION_EXPIRY] || null;
  } catch {
    return null;
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
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = await getStoredToken();
    console.log('token', token);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // Handle empty responses (like sign-out)
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(parseApiError(data as Record<string, unknown>, response.status));
  }

  return data as T;
}

// ============================================
// Authentication
// ============================================

export async function signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(API_ENDPOINTS.SIGN_UP, {
    method: 'POST',
    body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
  }, false);

  console.log('signUp response:', response);

  // Store the session token and expiry
  if (response.token) {
    await storeToken(response.token);
    await storeUser(response.user);
    await storeSessionExpiry(calculateSessionExpiry());
  }

  return response;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(API_ENDPOINTS.SIGN_IN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);

  console.log('signIn response:', response);

  // Store the session token and expiry
  if (response.token) {
    await storeToken(response.token);
    await storeUser(response.user);
    await storeSessionExpiry(calculateSessionExpiry());
  }

  return response;
}

export async function signOut(): Promise<void> {
  try {
    const token = await getStoredToken();
    if (token) {
      await apiRequest(API_ENDPOINTS.SIGN_OUT, {
        method: 'POST',
        body: JSON.stringify({}), // Better Auth expects a JSON body
      }, true);
    }
  } catch (error) {
    console.error('Error signing out from server:', error);
  }
  // Always clear local storage
  await clearAuthStorage();
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest(API_ENDPOINTS.REQUEST_PASSWORD_RESET, {
    method: 'POST',
    body: JSON.stringify({ 
      email,
      redirectTo: 'http://localhost:3001/reset-password',
    }),
  }, false);
}

export async function getSession(): Promise<AuthResponse | null> {
  try {
    const token = await getStoredToken();
    const user = await getStoredUser();
    const expiresAt = await getStoredSessionExpiry();
    
    if (!token || !user) {
      return null;
    }

    // Check if session has expired
    if (isSessionExpired(expiresAt)) {
      await clearAuthStorage();
      return null;
    }

    // Only refresh session if expiry is less than 3 days away
    if (!shouldRefreshSession(expiresAt)) {
      // Session is still fresh, return cached data
      return {
        redirect: false,
        user,
        token,
      };
    }

    // Verify and refresh the session via API
    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.GET_SESSION}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        // Session is invalid, clear storage
        await clearAuthStorage();
        return null;
      }
      
      const data = await response.json();
      
      // Update stored user and refresh expiry (session was just validated)
      if (data.user) {
        await storeUser(data.user);
      }
      // Refresh expiry since session was validated by the server
      await storeSessionExpiry(calculateSessionExpiry());
      
      // Return with stored token since get-session may not return it
      return {
        redirect: false,
        user: data.user || user,
        token,
      };
    } catch {
      // Network error - return cached session if we have it
      return {
        redirect: false,
        user,
        token,
      };
    }
  } catch {
    return null;
  }
}

// ============================================
// Articles
// ============================================

export async function getArticles(): Promise<Article[]> {
  const data = await apiRequest<{ articles: Article[] }>(API_ENDPOINTS.ARTICLES);
  return data.articles;
}

export async function getArticle(id: number): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(API_ENDPOINTS.ARTICLE(id));
  return data.article;
}

export async function saveArticle(url: string, tags?: string): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(API_ENDPOINTS.ARTICLES, {
    method: 'POST',
    body: JSON.stringify({ url, tags }),
  });
  return data.article;
}

export async function updateArticle(id: number, updates: { tags?: string | null; title?: string }): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(API_ENDPOINTS.ARTICLE(id), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.article;
}

export async function deleteArticle(id: number): Promise<void> {
  await apiRequest(API_ENDPOINTS.ARTICLE(id), {
    method: 'DELETE',
  });
}


