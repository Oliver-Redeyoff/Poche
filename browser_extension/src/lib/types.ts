// Type definitions for the browser extension

export interface SavedArticles {
  urls: string[]
  ids: number[]
}

export type StatusType = 'info' | 'success' | 'error'

export type AuthMode = 'signin' | 'signup' | 'forgot'

// Re-export types and helpers from shared
export type { Article, User, AuthResponse, ArticleUpdates, ArticleStatus } from '@poche/shared'
export { getArticleStatus } from '@poche/shared'

