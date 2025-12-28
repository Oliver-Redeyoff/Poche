import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { Session } from "@supabase/supabase-js"
import { StyleSheet, View, Alert, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { ThemedText } from '../components/themed-text'
import { ThemedView } from '../components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useColorScheme } from '@/hooks/use-color-scheme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ArticleCard } from '../components/article-card'
import { Article } from '../shared/types'
import { tagToColor } from '../shared/util'


export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null)
  const headerHeight = useHeaderHeight()
  const [articles, setArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const seenArticleIds = useRef<Set<number>>(new Set())
  const colorScheme = useColorScheme()
  const borderColor = useThemeColor({}, 'icon')
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const tintColor = useThemeColor({}, 'tint')

  // Calculate padding to account for header and safe area
  const topPadding = headerHeight

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    if (session) {
      // Load stored articles immediately (synchronous-like, shows right away)
      loadStoredArticles().then(() => {
        // After stored articles are loaded, sync new ones in background
        syncNewArticles()
      })
    } else {
      // Clear articles when user logs out
      setArticles([])
    }
  }, [session])

  // Storage key for articles (per user)
  function getArticlesStorageKey(): string {
    if (!session?.user) return ''
    return `@poche_articles_${session.user.id}`
  }

  // Load stored articles from AsyncStorage
  async function loadStoredArticles() {
    try {
      if (!session?.user) return
      
      const storageKey = getArticlesStorageKey()
      const storedData = await AsyncStorage.getItem(storageKey)
      
      if (storedData) {
        const storedArticles: Article[] = JSON.parse(storedData)
        setArticles(storedArticles)
        // Don't mark as seen immediately - let animations trigger first
        // They'll be marked as seen in the renderItem after animation
      }
    } catch (error) {
      console.error('Error loading stored articles:', error)
    }
  }

  // Save articles to AsyncStorage
  async function saveArticlesToStorage(articlesToSave: Article[]) {
    try {
      if (!session?.user) return
      
      const storageKey = getArticlesStorageKey()
      await AsyncStorage.setItem(storageKey, JSON.stringify(articlesToSave))
    } catch (error) {
      console.error('Error saving articles to storage:', error)
    }
  }

  // Sync new articles in the background (doesn't block UI)
  async function syncNewArticles() {
    try {
      setSyncing(true)
      if (!session?.user) {
        return
      }
      
      // Get stored article IDs
      const storageKey = getArticlesStorageKey()
      const storedData = await AsyncStorage.getItem(storageKey)
      const storedArticles: Article[] = storedData ? JSON.parse(storedData) : []
      const storedArticleIds = storedArticles.map(article => article.id)
      
      // Build query - if we have stored articles, only fetch new ones
      let query = supabase
        .from('articles')
        .select('*')
        .eq('user_id', session.user.id)
      
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
          .eq('user_id', session.user.id)
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

      if (data) {
        // Merge new articles with stored articles
        const newArticles = data || []
        const mergedArticles = [...newArticles, ...storedArticles]
          .sort((a, b) => {
            // Sort by created_time descending (newest first)
            const timeA = new Date(a.created_time || 0).getTime()
            const timeB = new Date(b.created_time || 0).getTime()
            return timeB - timeA
          })
        
        // Remove duplicates (in case of any edge cases)
        const uniqueArticles = mergedArticles.filter((article, index, self) =>
          index === self.findIndex((a) => a.id === article.id)
        )
        
        // Track which articles are new (not seen before) for animation
        // Don't mark as seen yet - let the animation trigger first
        setArticles(uniqueArticles)
        // Save merged articles back to storage
        await saveArticlesToStorage(uniqueArticles)
      } else if (storedArticles.length === 0) {
        // No new articles and no stored articles - set empty array
        setArticles([])
        await saveArticlesToStorage([])
      }
    } catch (error) {
      // Check if it's a network error
      const isNetworkError = error instanceof Error && (
        error.message.includes('Network') ||
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout')
      )
      
      // Get stored articles as fallback
      const storageKey = getArticlesStorageKey()
      const storedData = await AsyncStorage.getItem(storageKey)
      const storedArticles: Article[] = storedData ? JSON.parse(storedData) : []
      
      if (isNetworkError && storedArticles.length > 0) {
        // Network error but we have stored articles - use them
        console.log('Network error, using stored articles')
        setArticles(storedArticles)
        // Don't show error alert if we have stored articles to show
      } else if (storedArticles.length === 0) {
        // No stored articles and network failed - show error
        if (error instanceof Error) {
          Alert.alert('Error fetching articles', 'Unable to load articles. Please check your internet connection.')
        }
      } else {
        // Other error with stored articles - still show stored articles
        setArticles(storedArticles)
      }
    } finally {
      setSyncing(false)
    }
  }

  // Full refresh function (used for pull-to-refresh)
  async function getArticles() {
    try {
      setArticlesLoading(true)
      if (!session?.user) {
        throw new Error('No user on the session!')
      }
      
      // Get stored article IDs
      const storageKey = getArticlesStorageKey()
      const storedData = await AsyncStorage.getItem(storageKey)
      const storedArticles: Article[] = storedData ? JSON.parse(storedData) : []
      const storedArticleIds = storedArticles.map(article => article.id)
      
      // Build query - if we have stored articles, only fetch new ones
      let query = supabase
        .from('articles')
        .select('*')
        .eq('user_id', session.user.id)
      
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
          .eq('user_id', session.user.id)
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

      if (data) {
        // Merge new articles with stored articles
        const newArticles = data || []
        const mergedArticles = [...newArticles, ...storedArticles]
          .sort((a, b) => {
            // Sort by created_time descending (newest first)
            const timeA = new Date(a.created_time || 0).getTime()
            const timeB = new Date(b.created_time || 0).getTime()
            return timeB - timeA
          })
        
        // Remove duplicates (in case of any edge cases)
        const uniqueArticles = mergedArticles.filter((article, index, self) =>
          index === self.findIndex((a) => a.id === article.id)
        )
        
        setArticles(uniqueArticles)
        // Save merged articles back to storage
        await saveArticlesToStorage(uniqueArticles)
      } else if (storedArticles.length === 0) {
        // No new articles and no stored articles - set empty array
        setArticles([])
        await saveArticlesToStorage([])
      }
    } catch (error) {
      // Check if it's a network error
      const isNetworkError = error instanceof Error && (
        error.message.includes('Network') ||
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout')
      )
      
      // Get stored articles as fallback
      const storageKey = getArticlesStorageKey()
      const storedData = await AsyncStorage.getItem(storageKey)
      const storedArticles: Article[] = storedData ? JSON.parse(storedData) : []
      
      if (isNetworkError && storedArticles.length > 0) {
        // Network error but we have stored articles - use them
        console.log('Network error, using stored articles')
        setArticles(storedArticles)
        // Don't show error alert if we have stored articles to show
      } else if (storedArticles.length === 0) {
        // No stored articles and network failed - show error
        if (error instanceof Error) {
          Alert.alert('Error fetching articles', 'Unable to load articles. Please check your internet connection.')
        }
      } else {
        // Other error with stored articles - still show stored articles
        setArticles(storedArticles)
      }
    } finally {
      setArticlesLoading(false)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    try {
      await getArticles()
    } catch (error) {
      // Refresh errors are handled in getArticles()
      // It will fall back to stored articles if network fails
    } finally {
      setRefreshing(false)
    }
  }

  async function deleteArticle(articleId: number) {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId)

    if (error) {
      throw error
    }

    // The ArticleCard component already waits 300ms for the animation to complete
    // before calling this function, so we can remove it immediately
    // Remove article from local state
    const updatedArticles = articles.filter(article => article.id !== articleId)
    setArticles(updatedArticles)
    // Update storage
    await saveArticlesToStorage(updatedArticles)
    
    // Remove from seen articles set
    seenArticleIds.current.delete(articleId)
  }

  // Extract first image URL from HTML content
  function extractFirstImageUrl(htmlContent: string | null): string | null {
    if (!htmlContent) return null
    
    // Match img tags with src attribute
    const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
    if (imgMatch && imgMatch[1]) {
      let imageUrl = imgMatch[1]
      
      // Handle relative URLs (convert to absolute if needed)
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl
      } else if (imageUrl.startsWith('/')) {
        // If it's a relative path, we might need the article URL to make it absolute
        // For now, return as is - the Image component might handle it
        return imageUrl
      }
      
      return imageUrl
    }
    
    return null
  }

  // Extract all unique tags from articles
  function getAllTags(): string[] {
    const tagSet = new Set<string>()
    articles.forEach(article => {
      if (article.tags) {
        const tags = article.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }

  // Filter articles by selected tag
  function getFilteredArticles(): Article[] {
    if (!selectedTag) {
      return articles
    }
    return articles.filter(article => {
      if (!article.tags) return false
      const tags = article.tags.split(',').map(tag => tag.trim())
      return tags.includes(selectedTag)
    })
  }
  
  if (!session || !session.user) {
    return null // Auth is handled in _layout.tsx
  }
  
  const allTags = getAllTags()
  const filteredArticles = getFilteredArticles()

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: topPadding, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
            progressViewOffset={topPadding}
            progressBackgroundColor={backgroundColor}
          />
        }
      >
        {/* Tag Filter Section */}
        {allTags.length > 0 && (
          <View style={styles.tagFilterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagFilterContent}
            >
              <Pressable
                onPress={() => setSelectedTag(null)}
                style={[
                  styles.tagChip,
                  { 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                    opacity: selectedTag ? 0.5 : 1,
                  }
                ]}
              >
                <ThemedText style={[
                  styles.tagChipText,
                  { color: backgroundColor }
                ]}>
                  all
                </ThemedText>
              </Pressable>

              {allTags.map((tag) => {
                const isSelected = selectedTag === tag

                return (
                  <Pressable
                    key={tag}
                    onPress={() => setSelectedTag(isSelected ? null : tag)}
                    style={[
                      styles.tagChip,
                      { 
                        backgroundColor: tagToColor(tag, 0.2),
                        opacity: isSelected ? 1 : 0.5,
                        borderWidth: 1,
                        borderColor: tagToColor(tag, isSelected ? 1.0 : 0),
                      }
                    ]}
                  >
                    <ThemedText style={[
                      styles.tagChipText,
                      { color: tagToColor(tag, 1.0) }
                    ]}>
                      {tag}
                    </ThemedText>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        )}

        {articlesLoading && articles.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.loadingText}>Loading articles...</ThemedText>
          </View>
        ) : filteredArticles.length === 0 ? (
          <View style={styles.centerContent}>
            <ThemedText style={styles.emptyText}>
              {selectedTag ? `No articles with tag "${selectedTag}"` : 'No articles found'}
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: borderColor }]}>
              {selectedTag 
                ? 'Try selecting a different tag or view all articles'
                : 'Save articles from the browser extension to see them here'
              }
            </ThemedText>
          </View>
        ) : (
          filteredArticles.map((article) => {
            return (
              <ArticleCard
                key={article.id}
                article={article}
                onDelete={deleteArticle}
                extractFirstImageUrl={extractFirstImageUrl}
              />
            )
          })
        )}
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 20,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
    opacity: 0.6,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },
  tagFilterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  tagFilterContent: {
    paddingHorizontal: 4,
    gap: 6,
  },
  tagChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
