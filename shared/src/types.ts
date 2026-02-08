// Poche types - aligned with self-hosted backend (Better Auth + Drizzle)

// User type from Better Auth
export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
}

// Auth response from Better Auth
export interface AuthResponse {
  redirect: boolean
  token: string
  user: User
}

// Article reading status - derived from readingProgress
// 0 = new, 1-99 = reading, 100 = finished
export type ArticleStatus = 'new' | 'reading' | 'finished'

// Article update payload for PATCH requests
export interface ArticleUpdates {
  tags?: string | null
  title?: string
  readingProgress?: number
  isFavorite?: boolean
}

// Article type from backend
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
  // Reading progress and favorites
  readingProgress: number // 0-100 percentage (0=new, 1-99=reading, 100=finished)
  isFavorite: boolean
  startedAt: string | null // When first opened (readingProgress > 0)
  finishedAt: string | null // When finished (readingProgress = 100)
  createdAt: string
  updatedAt: string
}

// Legacy type alias for backward compatibility during migration
// Maps old Supabase field names to new backend field names
export interface LegacyArticle {
  id: number
  user_id: string
  title: string | null
  content: string | null
  excerpt: string | null
  url: string | null
  siteName: string | null
  length: number | null
  tags: string | null
  created_time: string
}

// Helper to convert legacy article to new format
export function convertLegacyArticle(legacy: LegacyArticle): Article {
  return {
    id: legacy.id,
    userId: legacy.user_id,
    title: legacy.title,
    content: legacy.content,
    excerpt: legacy.excerpt,
    url: legacy.url,
    siteName: legacy.siteName,
    author: null,
    wordCount: legacy.length,
    tags: legacy.tags,
    readingProgress: 0,
    isFavorite: false,
    startedAt: null,
    finishedAt: null,
    createdAt: legacy.created_time,
    updatedAt: legacy.created_time,
  }
}

