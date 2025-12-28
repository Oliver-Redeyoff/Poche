import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { Session } from "@supabase/supabase-js"
import { StyleSheet, View, Alert, ScrollView, FlatList, Pressable, ActivityIndicator, RefreshControl, Modal } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { ThemedText } from '../components/themed-text'
import { ThemedView } from '../components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated'

interface Article {
  id: number
  title?: string | null
  content?: string | null
  url?: string
  created_time?: string
  created_at?: string
  [key: string]: any
}

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()
  const headerHeight = useHeaderHeight()
  const [articles, setArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [deletingArticleId, setDeletingArticleId] = useState<number | null>(null)
  const seenArticleIds = useRef<Set<number>>(new Set())
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
            const timeA = new Date(a.created_time || a.created_at || 0).getTime()
            const timeB = new Date(b.created_time || b.created_at || 0).getTime()
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
            const timeA = new Date(a.created_time || a.created_at || 0).getTime()
            const timeB = new Date(b.created_time || b.created_at || 0).getTime()
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
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Start deletion animation
              setDeletingArticleId(articleId)
              
              // Wait for animation to complete (300ms)
              await new Promise(resolve => setTimeout(resolve, 300))
              
              const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', articleId)

              if (error) {
                throw error
              }

              // Remove article from local state after animation
              const updatedArticles = articles.filter(article => article.id !== articleId)
              setArticles(updatedArticles)
              // Update storage
              await saveArticlesToStorage(updatedArticles)
              
              // Remove from seen articles set
              seenArticleIds.current.delete(articleId)
              
              // Clear deleting state
              setDeletingArticleId(null)
            } catch (error) {
              // Reset deleting state on error
              setDeletingArticleId(null)
              if (error instanceof Error) {
                Alert.alert('Error deleting article', error.message)
              }
            }
          },
        },
      ]
    )
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
  
  if (!session || !session.user) {
    return null // Auth is handled in _layout.tsx
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: topPadding }}
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
        {articlesLoading && articles.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.loadingText}>Loading articles...</ThemedText>
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.centerContent}>
            <ThemedText style={styles.emptyText}>No articles found</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: borderColor }]}>
              Save articles from the browser extension to see them here
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={articles}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item, index }) => {
              const imageUrl = extractFirstImageUrl(item.content || null)
              const isNewArticle = !seenArticleIds.current.has(item.id)
              const isDeleting = deletingArticleId === item.id
              
              // Mark as seen after render
              if (isNewArticle) {
                setTimeout(() => {
                  seenArticleIds.current.add(item.id)
                }, 0)
              }
              
              return (
                <Animated.View 
                  style={styles.articleCardWrapper}
                  entering={isNewArticle ? FadeInDown.duration(500).delay(Math.min(index * 30, 300)) : undefined}
                  exiting={isDeleting ? FadeOut.duration(300) : undefined}
                >
                  {/* Top part of article card */}
                  <Pressable
                    onPress={() => router.push(`/article/${item.id}`)}
                    style={({ pressed }) => [
                      styles.articleCard,
                      { borderColor, backgroundColor },
                      pressed && styles.articleCardPressed,
                    ]}
                  >
                    <View style={styles.articleCardContent}>
                      <View style={styles.articleCardText}>
                        {item.title && (
                          <ThemedText type="defaultSemiBold" style={styles.articleTitle}>
                            {item.title}
                          </ThemedText>
                        )}
                        {item.siteName && (
                          <ThemedText style={[styles.articleUrl, { color: textColor }]}>
                            {item.siteName}
                          </ThemedText>
                        )}
                        {(item.created_at || item.created_time) && (
                          <ThemedText style={[styles.articleDate, { color: borderColor }]}>
                            {new Date(item.created_at || item.created_time || '').toLocaleDateString()}
                          </ThemedText>
                        )}
                      </View>

                      {imageUrl && (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.articleImage}
                          contentFit="cover"
                          transition={200}
                          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                        />
                      )}

                    </View>
                  </Pressable>

                  {/* Bottom part of article card */}
                  <Pressable
                    onPress={() => deleteArticle(item.id)}
                    style={styles.menuButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="red" />
                  </Pressable>
                </Animated.View>
              )
            }}
          />
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
  articleCardWrapper: {
    position: 'relative',
    marginHorizontal: 12,
    // marginBottom: 12,
  },
  articleCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 120, 120, 0.15)',
  },
  articleCardPressed: {
    opacity: 0.7,
  },
  articleCardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  articleCardText: {
    flex: 1,
    minWidth: 0, // Allows text to shrink when image is present
  },
  articleImage: {
    width: 100,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  articleTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  articleUrl: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  articleDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  },
})
