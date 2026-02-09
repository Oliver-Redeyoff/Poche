import { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import { ArticleCard } from '@/components/article-card'
import { Article } from '@poche/shared'
import { useAuth } from '../_layout'
import { 
  loadArticlesFromStorage, 
  syncArticles,
  deleteArticleWithSync,
  updateArticleTagsWithSync
} from '@/lib/article-sync'
import { IconSymbol } from '@/components/ui/icon-symbol'

type FilterType = 'all' | 'favorites' | 'tag'

export default function ArticlesListScreen() {
  const { session } = useAuth()
  const headerHeight = useHeaderHeight()
  const params = useLocalSearchParams<{ 
    filterType: FilterType
    filterValue?: string
    title: string 
  }>()
  
  const [articles, setArticles] = useState<Article[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const textSecondary = useThemeColor({}, 'icon')
  const tintColor = useThemeColor({}, 'tint')

  const topPadding = headerHeight
  const filterType = params.filterType || 'all'
  const filterValue = params.filterValue
  const title = params.title || 'Articles'

  useEffect(() => {
    if (session?.user) {
      loadStoredArticles()
    } else {
      setArticles([])
    }
  }, [session])

  async function loadStoredArticles() {
    try {
      if (!session?.user) return
      const storedArticles = await loadArticlesFromStorage(session.user.id)
      setArticles(storedArticles)
    } catch (error) {
      console.error('Error loading stored articles:', error)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    try {
      if (!session?.user) return
      const result = await syncArticles(session.user.id, { processImages: true })
      if (!result.error || result.allArticles.length > 0) {
        setArticles(result.allArticles)
      }
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

  // Filter articles based on filter type
  function getFilteredArticles(): Article[] {
    switch (filterType) {
      case 'favorites':
        return articles.filter(a => a.isFavorite)
      case 'tag':
        if (!filterValue) return articles
        return articles.filter(a => {
          if (!a.tags) return false
          const tags = a.tags.split(',').map(t => t.trim())
          return tags.includes(filterValue)
        })
      case 'all':
      default:
        return articles
    }
  }

  const filteredArticles = getFilteredArticles()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (!session?.user) {
    return null
  }

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
        {filteredArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol 
              name={filterType === 'favorites' ? 'star' : 'doc.text'} 
              size={48} 
              color={textSecondary} 
            />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              {filterType === 'favorites' 
                ? 'No favorites yet' 
                : filterType === 'tag'
                ? `No articles tagged "${filterValue}"`
                : 'No articles yet'
              }
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
              {filterType === 'favorites'
                ? 'Tap the heart icon on articles to add them to your favorites'
                : 'Save articles using the browser extension'
              }
            </ThemedText>
          </View>
        ) : (
          <View style={styles.articleList}>
            {filteredArticles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                onDelete={deleteArticle}
                onUpdateTags={updateArticleTags}
              />
            ))}
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
  articleList: {
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
