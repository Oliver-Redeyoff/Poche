// API client for Poche backend
// Uses token-based auth for browser extension compatibility

// Declare browser for Firefox compatibility
declare const browser: typeof chrome;

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : browser;

// Backend API URL - change this for production
const API_URL = 'http://localhost:3000';

// Storage key for auth token
const TOKEN_STORAGE_KEY = 'poche_auth_token';
const USER_STORAGE_KEY = 'poche_user';
const SESSION_EXPIRY_KEY = 'poche_session_expiry';

// Session refresh threshold (3 days in milliseconds)
const SESSION_REFRESH_THRESHOLD = 3 * 24 * 60 * 60 * 1000;

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

// Better Auth response structure
export interface AuthResponse {
  redirect: boolean;
  token: string;
  user: User;
}

// Session duration matches backend config (7 days)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

// For compatibility with existing code
export type Session = AuthResponse;

export interface Article {
  id: number;
  userId: string;
  title: string | null;
  content: string | null;
  excerpt: string | null;
  url: string | null;
  siteName: string | null;
  author: string | null;
  wordCount: number | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  error: string;
  details?: unknown;
}

// ============================================
// Token Storage
// ============================================

async function getStoredToken(): Promise<string | null> {
  try {
    const result = await browserAPI.storage.local.get(TOKEN_STORAGE_KEY);
    return result[TOKEN_STORAGE_KEY] || null;
  } catch {
    return null;
  }
}

async function storeToken(token: string): Promise<void> {
  await browserAPI.storage.local.set({ [TOKEN_STORAGE_KEY]: token });
}

async function storeUser(user: User): Promise<void> {
  await browserAPI.storage.local.set({ [USER_STORAGE_KEY]: user });
}

async function getStoredUser(): Promise<User | null> {
  try {
    const result = await browserAPI.storage.local.get(USER_STORAGE_KEY);
    return result[USER_STORAGE_KEY] || null;
  } catch {
    return null;
  }
}

async function clearAuthStorage(): Promise<void> {
  await browserAPI.storage.local.remove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY, SESSION_EXPIRY_KEY]);
}

async function storeSessionExpiry(expiresAt: string): Promise<void> {
  await browserAPI.storage.local.set({ [SESSION_EXPIRY_KEY]: expiresAt });
}

async function getStoredSessionExpiry(): Promise<string | null> {
  try {
    const result = await browserAPI.storage.local.get(SESSION_EXPIRY_KEY);
    return result[SESSION_EXPIRY_KEY] || null;
  } catch {
    return null;
  }
}

function shouldRefreshSession(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;
  
  // Refresh if less than 3 days until expiry or already expired
  return timeUntilExpiry < SESSION_REFRESH_THRESHOLD;
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
    // Handle various error response formats from Better Auth
    const errorData = data as Record<string, unknown>;
    const errorMessage = 
      errorData.error || 
      errorData.message || 
      (errorData.body && typeof errorData.body === 'object' && 'message' in errorData.body 
        ? (errorData.body as Record<string, unknown>).message 
        : null) ||
      `Request failed: ${response.status}`;
    throw new Error(String(errorMessage));
  }

  return data as T;
}

// ============================================
// Authentication
// ============================================

export async function signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
  }, false);

  console.log('signUp response:', response);

  // Store the session token and expiry
  if (response.token) {
    await storeToken(response.token);
    await storeUser(response.user);
    // Calculate expiry based on backend session duration (7 days)
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    await storeSessionExpiry(expiresAt);
  }

  return response;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);

  console.log('signIn response:', response);

  // Store the session token and expiry
  if (response.token) {
    await storeToken(response.token);
    await storeUser(response.user);
    // Calculate expiry based on backend session duration (7 days)
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    await storeSessionExpiry(expiresAt);
  }

  return response;
}

export async function signOut(): Promise<void> {
  try {
    const token = await getStoredToken();
    if (token) {
      await apiRequest('/api/auth/sign-out', {
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

export async function getSession(): Promise<AuthResponse | null> {
  try {
    const token = await getStoredToken();
    const user = await getStoredUser();
    const expiresAt = await getStoredSessionExpiry();
    
    if (!token || !user) {
      return null;
    }

    // Check if session has expired
    if (expiresAt) {
      const expiryTime = new Date(expiresAt).getTime();
      if (Date.now() > expiryTime) {
        // Session has expired, clear storage
        await clearAuthStorage();
        return null;
      }
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
      const response = await fetch(`${API_URL}/api/auth/get-session`, {
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
      const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
      await storeSessionExpiry(expiresAt);
      
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
  const data = await apiRequest<{ articles: Article[] }>('/api/articles');
  return data.articles;
}

export async function getArticle(id: number): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(`/api/articles/${id}`);
  return data.article;
}

export async function saveArticle(url: string, tags?: string): Promise<Article> {
  const data = await apiRequest<{ article: Article }>('/api/articles', {
    method: 'POST',
    body: JSON.stringify({ url, tags }),
  });
  return data.article;
}

export async function updateArticle(id: number, updates: { tags?: string | null; title?: string }): Promise<Article> {
  const data = await apiRequest<{ article: Article }>(`/api/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.article;
}

export async function deleteArticle(id: number): Promise<void> {
  await apiRequest(`/api/articles/${id}`, {
    method: 'DELETE',
  });
}

// Export API URL for configuration
export { API_URL };
