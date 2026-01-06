// Storage utilities for saved articles tracking

import * as api from './api'
import type { SavedArticles } from './types'

// Declare browser for Firefox compatibility
declare const browser: typeof chrome

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : browser

// Storage key for saved articles (per user)
export function getSavedArticlesStorageKey(userId: string): string {
  return `poche_saved_articles_${userId}`
}

// Get saved articles from storage
export async function getSavedArticles(userId: string): Promise<SavedArticles> {
  try {
    const storageKey = getSavedArticlesStorageKey(userId)
    const result = await browserAPI.storage.local.get(storageKey)
    return result[storageKey] || { urls: [], ids: [] }
  } catch (error) {
    console.error('Error getting saved articles:', error)
    return { urls: [], ids: [] }
  }
}

// Save article URL and ID to storage
export async function saveArticleToStorage(userId: string, articleId: number, url: string): Promise<void> {
  try {
    const storageKey = getSavedArticlesStorageKey(userId)
    const saved = await getSavedArticles(userId)
    
    if (url && !saved.urls.includes(url)) {
      saved.urls.push(url)
    }
    if (articleId && !saved.ids.includes(articleId)) {
      saved.ids.push(articleId)
    }
    
    await browserAPI.storage.local.set({ [storageKey]: saved })
  } catch (error) {
    console.error('Error saving article to storage:', error)
  }
}

// Sync saved articles from backend
export async function syncSavedArticlesFromBackend(userId: string): Promise<void> {
  try {
    const articles = await api.getArticles()
    
    const urls = articles
      .map(article => article.url)
      .filter((url): url is string => url !== null)
    const ids = articles.map(article => article.id)
    
    const storageKey = getSavedArticlesStorageKey(userId)
    await browserAPI.storage.local.set({ [storageKey]: { urls, ids } })
    
    console.log(`Synced ${urls.length} article(s) from backend`)
  } catch (error) {
    console.error('Error syncing articles:', error)
  }
}

// Check if current URL is already saved
export async function checkIfUrlIsSaved(userId: string, url: string): Promise<boolean> {
  try {
    const saved = await getSavedArticles(userId)
    return saved.urls.includes(url)
  } catch (error) {
    console.error('Error checking if URL is saved:', error)
    return false
  }
}

