// Type definitions for the browser extension

export interface SavedArticles {
  urls: string[]
  ids: number[]
}

export type StatusType = 'info' | 'success' | 'error'

export type AuthMode = 'signin' | 'signup' | 'forgot'

// Re-export types from shared
export type { Article, User, AuthResponse } from '@poche/shared'

