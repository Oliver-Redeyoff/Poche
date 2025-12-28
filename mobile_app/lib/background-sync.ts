import * as TaskManager from 'expo-task-manager'
import * as BackgroundTask from 'expo-background-task'
import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BACKGROUND_SYNC_TASK = 'background-article-sync'

interface Article {
  id: number
  title?: string | null
  content?: string | null
  url?: string
  created_time: string
}

// Get storage key for articles (per user)
function getArticlesStorageKey(userId: string): string {
  return `@poche_articles_${userId}`
}

// Background task function that syncs articles
async function syncArticlesInBackground() {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || !session.user) {
      console.log('Background sync: No user session')
      return BackgroundTask.BackgroundTaskResult.Failed
    }

    const userId = session.user.id
    const storageKey = getArticlesStorageKey(userId)
    
    // Get stored article IDs
    const storedData = await AsyncStorage.getItem(storageKey)
    const storedArticles: Article[] = storedData ? JSON.parse(storedData) : []
    const storedArticleIds = storedArticles.map(article => article.id)
    
    // Build query - if we have stored articles, only fetch new ones
    let query = supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
    
    // If we have stored articles, only fetch articles not in storage
    if (storedArticleIds.length > 0) {
      query = query.not('id', 'in', `(${storedArticleIds.join(',')})`)
    }
    
    // Apply ordering after filters
    query = query.order('created_time', { ascending: false })
    
    let { data, error } = await query

    // If the "not in" query fails, fallback to fetching all and filtering client-side
    if (error && storedArticleIds.length > 0) {
      console.warn('Background sync: Not-in query failed, falling back to fetch-all approach:', error)
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

    if (data && data.length > 0) {
      // Merge new articles with stored articles
      const newArticles = data || []
      const mergedArticles = [...newArticles, ...storedArticles]
        .sort((a, b) => {
          // Sort by created_time descending (newest first)
          const timeA = new Date(a.created_time || 0).getTime()
          const timeB = new Date(b.created_time || 0).getTime()
          return timeB - timeA
        })
      
      // Remove duplicates
      const uniqueArticles = mergedArticles.filter((article, index, self) =>
        index === self.findIndex((a) => a.id === article.id)
      )
      
      // Save merged articles back to storage
      await AsyncStorage.setItem(storageKey, JSON.stringify(uniqueArticles))
      
      console.log(`Background sync: Synced ${newArticles.length} new article(s)`)
      return BackgroundTask.BackgroundTaskResult.Success
    } else {
      console.log('Background sync: No new articles')
      return BackgroundTask.BackgroundTaskResult.Success
    }
  } catch (error) {
    console.error('Background sync error:', error)
    return BackgroundTask.BackgroundTaskResult.Failed
  }
}

// Define the background task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  const result = await syncArticlesInBackground()
  return result
})

// Register background task
export async function registerBackgroundSync() {
  try {
    // Check if background tasks are available (not available in Expo Go)
    const status = await BackgroundTask.getStatusAsync()
    
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      console.log('Background tasks are not available (likely running in Expo Go)')
      return
    }

    // Check if task is already registered by trying to get status
    // If it fails, the task is not registered
    try {
      await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15, // 15 minutes (minimum allowed)
      })
      console.log('Background sync task registered')
    } catch (error: any) {
      // If task is already registered, that's okay
      if (error?.message?.includes('already registered') || error?.code === 'TASK_ALREADY_REGISTERED') {
        console.log('Background sync task already registered')
      } else if (error?.message?.includes('not been configured') || error?.message?.includes('UIBackgroundModes')) {
        // Background tasks not configured (Expo Go or missing config)
        console.log('Background tasks not configured - requires development build')
      } else {
        throw error
      }
    }
  } catch (error: any) {
    // Gracefully handle errors - background tasks may not be available in Expo Go
    if (error?.message?.includes('not been configured') || 
        error?.message?.includes('UIBackgroundModes') ||
        error?.message?.includes('Expo Go')) {
      console.log('Background sync not available (Expo Go or missing configuration)')
    } else {
      console.error('Error registering background sync:', error)
    }
  }
}

// Unregister background task
export async function unregisterBackgroundSync() {
  try {
    const status = await BackgroundTask.getStatusAsync()
    if (status === BackgroundTask.BackgroundTaskStatus.Available) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK)
      console.log('Background sync task unregistered')
    } else {
      console.log('Background tasks not available, skipping unregister')
    }
  } catch (error: any) {
    // Gracefully handle errors - background tasks may not be available
    if (error?.message?.includes('not been configured') || 
        error?.message?.includes('UIBackgroundModes')) {
      console.log('Background sync not available, skipping unregister')
    } else {
      console.error('Error unregistering background sync:', error)
    }
  }
}

// Check background task status
export async function getBackgroundSyncStatus() {
  try {
    const status = await BackgroundTask.getStatusAsync()
    return { status, isAvailable: status === BackgroundTask.BackgroundTaskStatus.Available }
  } catch (error) {
    console.error('Error getting background sync status:', error)
    return { status: null, isAvailable: false }
  }
}
