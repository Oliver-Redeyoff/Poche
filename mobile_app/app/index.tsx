import { useState, useEffect, useRef } from "react"
import { StyleSheet, View, Alert, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { ThemedText } from '../components/themed-text'
import { ThemedView } from '../components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { ArticleCard } from '../components/article-card'
import { Article } from '../shared/types'
import { tagToColor } from '../shared/util'
import { useAuth } from './_layout'
import { 
  loadArticlesFromStorage, 
  saveArticlesToStorage, 
  syncArticles,
  deleteArticleWithSync,
  updateArticleTagsWithSync
} from '../lib/article-sync'


export default function HomeScreen() {
  const { session } = useAuth()
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
    if (session?.user) {
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

  // Load stored articles from AsyncStorage
  async function loadStoredArticles() {
    try {
      if (!session?.user) return
      
      const storedArticles = await loadArticlesFromStorage(session.user.id)
      setArticles(storedArticles)
      // Don't mark as seen immediately - let animations trigger first
      // They'll be marked as seen in the renderItem after animation
    } catch (error) {
      console.error('Error loading stored articles:', error)
    }
  }

  // Sync new articles in the background (doesn't block UI)
  async function syncNewArticles() {
    try {
      setSyncing(true)
      if (!session?.user) {
        return
      }
      
      // Sync articles with image processing enabled
      const result = await syncArticles(session.user.id, { processImages: true })
      
      if (result.error) {
        // Check if it's a network error
        const isNetworkError = result.error.message.includes('Network') ||
          result.error.message.includes('fetch') ||
          result.error.message.includes('Failed to fetch') ||
          result.error.message.includes('network') ||
          result.error.message.includes('ECONNREFUSED') ||
          result.error.message.includes('timeout')
        
        if (isNetworkError && result.allArticles.length > 0) {
          // Network error but we have stored articles - use them
          console.log('Network error, using stored articles')
          setArticles(result.allArticles)
          // Don't show error alert if we have stored articles to show
        } else if (result.allArticles.length === 0) {
          // No stored articles and network failed - show error
          Alert.alert('Error fetching articles', 'Unable to load articles. Please check your internet connection.')
        } else {
          // Other error with stored articles - still show stored articles
          setArticles(result.allArticles)
        }
      } else {
        // Success - update articles with synced data
        setArticles(result.allArticles)
      }
    } catch (error) {
      // Fallback: try to load stored articles
      if (session?.user) {
        const storedArticles = await loadArticlesFromStorage(session.user.id)
        setArticles(storedArticles)
      }
      
      if (error instanceof Error) {
        Alert.alert('Error fetching articles', error.message)
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
        throw new Error('No user session!')
      }
      
      // Sync articles with image processing enabled
      const result = await syncArticles(session.user.id, { processImages: true })
      
      if (result.error) {
        // Check if it's a network error
        const isNetworkError = result.error.message.includes('Network') ||
          result.error.message.includes('fetch') ||
          result.error.message.includes('Failed to fetch') ||
          result.error.message.includes('network') ||
          result.error.message.includes('ECONNREFUSED') ||
          result.error.message.includes('timeout')
        
        if (isNetworkError && result.allArticles.length > 0) {
          // Network error but we have stored articles - use them
          console.log('Network error, using stored articles')
          setArticles(result.allArticles)
          // Don't show error alert if we have stored articles to show
        } else if (result.allArticles.length === 0) {
          // No stored articles and network failed - show error
          Alert.alert('Error fetching articles', 'Unable to load articles. Please check your internet connection.')
        } else {
          // Other error with stored articles - still show stored articles
          setArticles(result.allArticles)
        }
      } else {
        // Success - update articles with synced data
        setArticles(result.allArticles)
      }
    } catch (error) {
      // Fallback: try to load stored articles
      if (session?.user) {
        const storedArticles = await loadArticlesFromStorage(session.user.id)
        setArticles(storedArticles)
      }
      
      if (error instanceof Error) {
        Alert.alert('Error fetching articles', error.message)
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
    if (!session?.user) return

    try {
      await deleteArticleWithSync(session.user.id, articleId)
      
      // Remove article from local state
      const updatedArticles = articles.filter(article => article.id !== articleId)
      setArticles(updatedArticles)
      
      // Remove from seen articles set
      seenArticleIds.current.delete(articleId)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
      throw error
    }
  }

  async function updateArticleTags(articleId: number, tags: string) {
    if (!session?.user) return

    try {
      await updateArticleTagsWithSync(session.user.id, articleId, tags)

      // Update in local state
      const updatedArticles = articles.map(article => 
        article.id === articleId 
          ? { ...article, tags: tags || null }
          : article
      )
      setArticles(updatedArticles)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
      throw error
    }
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
  
  if (!session?.user) {
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
          <View style={styles.articleList}>
            {filteredArticles.map((article) => {
              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onDelete={deleteArticle}
                  onUpdateTags={updateArticleTags}
                />
              )
            })}
          </View>
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
    fontFamily: 'SourceSans3_600SemiBold',
  },
  articleList: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
})
