import { supabase } from './supabase'
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
 * Fetch new articles from Supabase that aren't already in storage
 */
export async function fetchNewArticlesFromSupabase(
  userId: string,
  storedArticleIds: number[]
): Promise<Article[]> {
  // Build query - if we have stored articles, only fetch new ones
  let query = supabase
    .from('articles')
    .select('*')
    .eq('user_id', userId)
  
  // If we have stored articles, only fetch articles not in storage
  // Supabase PostgREST syntax for "not in"
  if (storedArticleIds.length > 0) {
    query = query.not('id', 'in', `(${storedArticleIds.join(',')})`)
  }
  
  // Apply ordering after filters
  query = query.order('created_time', { ascending: false })
  
  let { data, error } = await query

  // If the "not in" query fails, fallback to fetching all and filtering client-side
  if (error && storedArticleIds.length > 0) {
    console.warn('Not-in query failed, falling back to fetch-all approach:', error)
    // Fallback: fetch all articles and filter client-side
    const { data: allData, error: allError } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .order('created_time', { ascending: false })
    
    if (allError) {
      throw allError
    }
    
    // Filter out stored articles client-side
    data = allData?.filter(article => !storedArticleIds.includes(article.id)) || []
    error = null
  } else if (error) {
    throw error
  }

  return data || []
}

/**
 * Merge new articles with stored articles and sort by created_time
 */
export function mergeAndSortArticles(newArticles: Article[], storedArticles: Article[]): Article[] {
  const merged = [...newArticles, ...storedArticles]
    .sort((a, b) => {
      // Sort by created_time descending (newest first)
      const timeA = new Date(a.created_time || 0).getTime()
      const timeB = new Date(b.created_time || 0).getTime()
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
    
    // Fetch new articles from Supabase
    const newArticles = await fetchNewArticlesFromSupabase(userId, storedArticleIds)
    
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

