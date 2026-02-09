import { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { useFocusEffect } from '@react-navigation/native'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import { ArticleCard } from '@/components/article-card'
import { Article, getArticleStatus } from '@poche/shared'
import { useAuth } from '../_layout'
import { 
  loadArticlesFromStorage, 
  syncArticles,
  deleteArticleWithSync,
  updateArticleTagsWithSync
} from '@/lib/article-sync'
import { IconSymbol } from '@/components/ui/icon-symbol'

export default function HomeScreen() {
  const { session } = useAuth()
  const router = useRouter()
  const headerHeight = useHeaderHeight()
  const [articles, setArticles] = useState<Article[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  const textColor = useThemeColor({}, 'text')
  const textSecondary = useThemeColor({}, 'icon')
  const tintColor = useThemeColor({}, 'tint')
  const cardColor = useThemeColor({}, 'card')

  const topPadding = headerHeight

  // Initial load and sync when session changes
  useEffect(() => {
    if (session?.user) {
      loadStoredArticles().then(() => {
        syncNewArticles()
      })
    } else {
      setArticles([])
    }
  }, [session])

  // Reload from storage when screen comes into focus (to pick up changes from other screens)
  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        loadStoredArticles()
      }
    }, [session])
  )

  async function loadStoredArticles() {
    try {
      if (!session?.user) return
      const storedArticles = await loadArticlesFromStorage(session.user.id)
      setArticles(storedArticles)
    } catch (error) {
      console.error('Error loading stored articles:', error)
    }
  }

  async function syncNewArticles() {
    try {
      if (!session?.user) return
      
      const result = await syncArticles(session.user.id, { processImages: true })
      if (!result.error || result.allArticles.length > 0) {
        setArticles(result.allArticles)
      }
    } catch (error) {
      console.error('Error syncing articles:', error)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    try {
      await syncNewArticles()
    } finally {
      setRefreshing(false)
    }
  }

  async function deleteArticle(articleId: number) {
    if (!session?.user) return
    try {
      await deleteArticleWithSync(session.user.id, articleId)
      setArticles(articles.filter(a => a.id !== articleId))
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  async function updateArticleTags(articleId: number, tags: string) {
    if (!session?.user) return
    try {
      await updateArticleTagsWithSync(session.user.id, articleId, tags)
      setArticles(articles.map(a => 
        a.id === articleId ? { ...a, tags: tags || null } : a
      ))
    } catch (error) {
      console.error('Error updating tags:', error)
    }
  }

  // Get articles that are currently being read (progress > 0 and < 100)
  const continueReadingArticles = articles
    .filter(a => {
      const status = getArticleStatus(a.readingProgress || 0)
      return status === 'reading'
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  // Get new articles (progress = 0)
  const newArticles = articles
    .filter(a => {
      const status = getArticleStatus(a.readingProgress || 0)
      return status === 'new'
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  if (!session?.user) {
    return null
  }

  const hasNoArticles = articles.length === 0
  const hasContinueReading = continueReadingArticles.length > 0
  const hasNewArticles = newArticles.length > 0

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: topPadding, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
            progressViewOffset={topPadding}
          />
        }
      >
        {/* Search Bar */}
        <Pressable 
          style={[styles.searchBar, { backgroundColor: cardColor }]}
          onPress={() => router.push('/search')}
        >
          <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
          <ThemedText style={[styles.searchPlaceholder, { color: textSecondary }]}>
            Search articles...
          </ThemedText>
        </Pressable>

        {hasNoArticles ? (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              No articles yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
              Save articles using the Poche browser extension to see them here
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Continue Reading Section */}
            {hasContinueReading && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Continue Reading</ThemedText>
                </View>
                <View style={styles.verticalList}>
                  {continueReadingArticles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onDelete={deleteArticle}
                      onUpdateTags={updateArticleTags}
                      showProgress
                    />
                  ))}
                </View>
              </View>
            )}

            {/* New Articles Section */}
            {hasNewArticles && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>New Articles</ThemedText>
                </View>
                <View style={styles.verticalList}>
                  {newArticles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onDelete={deleteArticle}
                      onUpdateTags={updateArticleTags}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* If no new or in-progress articles, show a message */}
            {!hasContinueReading && !hasNewArticles && (
              <View style={styles.emptyState}>
                <IconSymbol name="checkmark.circle" size={48} color={tintColor} />
                <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                  All caught up!
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
                  You've read all your articles. Save more using the browser extension.
                </ThemedText>
              </View>
            )}
          </>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontFamily: 'SourceSans3_400Regular',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Bitter_600SemiBold',
  },
  verticalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Bitter_600SemiBold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'SourceSans3_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
})
