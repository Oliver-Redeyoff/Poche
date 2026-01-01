import { getArticles as fetchArticlesFromApi, deleteArticle as deleteArticleApi, updateArticle as updateArticleApi } from './api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Article } from '../shared/types'
import { processArticlesImages } from './image-cache'

/**
 * Get storage key for articles (per user)
 */
export function getArticlesStorageKey(userId: string): string {
  return `@poche_articles_${userId}`
}

/**
 * Load articles from AsyncStorage
 */
export async function loadArticlesFromStorage(userId: string): Promise<Article[]> {
  try {
    const storageKey = getArticlesStorageKey(userId)
    const storedData = await AsyncStorage.getItem(storageKey)
    
    if (storedData) {
      return JSON.parse(storedData) as Article[]
    }
    
    return []
  } catch (error) {
    console.error('Error loading articles from storage:', error)
    return []
  }
}

/**
 * Save articles to AsyncStorage
 */
export async function saveArticlesToStorage(userId: string, articles: Article[]): Promise<void> {
  try {
    const storageKey = getArticlesStorageKey(userId)
    await AsyncStorage.setItem(storageKey, JSON.stringify(articles))
  } catch (error) {
    console.error('Error saving articles to storage:', error)
    throw error
  }
}

/**
 * Fetch new articles from backend that aren't already in storage
 */
export async function fetchNewArticlesFromBackend(
  userId: string,
  storedArticleIds: number[]
): Promise<Article[]> {
  // Fetch all articles from backend
  const allArticles = await fetchArticlesFromApi()
  
  // Filter out articles that are already in storage
  if (storedArticleIds.length > 0) {
    return allArticles.filter(article => !storedArticleIds.includes(article.id))
  }
  
  return allArticles
}

/**
 * Merge new articles with stored articles and sort by createdAt
 */
export function mergeAndSortArticles(newArticles: Article[], storedArticles: Article[]): Article[] {
  const merged = [...newArticles, ...storedArticles]
    .sort((a, b) => {
      // Sort by createdAt descending (newest first)
      const timeA = new Date(a.createdAt || 0).getTime()
      const timeB = new Date(b.createdAt || 0).getTime()
      return timeB - timeA
    })
  
  // Remove duplicates (in case of any edge cases)
  return merged.filter((article, index, self) =>
    index === self.findIndex((a) => a.id === article.id)
  )
}

/**
 * Sync articles: fetch new ones, process images, merge, and save
 */
export async function syncArticles(
  userId: string,
  options: {
    processImages?: boolean
  } = {}
): Promise<{
  newArticles: Article[]
  allArticles: Article[]
  error?: Error
}> {
  try {
    // Load stored articles
    const storedArticles = await loadArticlesFromStorage(userId)
    const storedArticleIds = storedArticles.map(article => article.id)
    
    // Fetch new articles from backend
    const newArticles = await fetchNewArticlesFromBackend(userId, storedArticleIds)
    
    if (newArticles.length === 0) {
      return {
        newArticles: [],
        allArticles: storedArticles,
      }
    }
    
    // Process images for new articles if requested
    let processedNewArticles = newArticles
    if (options.processImages) {
      processedNewArticles = await processArticlesImages(newArticles, userId)
    }
    
    // Merge and sort articles
    const allArticles = mergeAndSortArticles(processedNewArticles, storedArticles)
    
    // Save to storage
    await saveArticlesToStorage(userId, allArticles)
    
    return {
      newArticles: processedNewArticles,
      allArticles,
    }
  } catch (error) {
    console.error('Error syncing articles:', error)
    return {
      newArticles: [],
      allArticles: await loadArticlesFromStorage(userId), // Return stored articles as fallback
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Delete article from backend and local storage
 */
export async function deleteArticleWithSync(userId: string, articleId: number): Promise<void> {
  // Delete from backend
  await deleteArticleApi(articleId)
  
  // Remove from local storage
  const articles = await loadArticlesFromStorage(userId)
  const updatedArticles = articles.filter(article => article.id !== articleId)
  await saveArticlesToStorage(userId, updatedArticles)
}

/**
 * Update article tags in backend and local storage
 */
export async function updateArticleTagsWithSync(userId: string, articleId: number, tags: string): Promise<void> {
  // Update in backend
  await updateArticleApi(articleId, { tags: tags || null })
  
  // Update in local storage
  const articles = await loadArticlesFromStorage(userId)
  const updatedArticles = articles.map(article => 
    article.id === articleId 
      ? { ...article, tags: tags || null }
      : article
  )
  await saveArticlesToStorage(userId, updatedArticles)
}
