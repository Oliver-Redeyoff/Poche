import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { StyleSheet, View, ScrollView, TextInput, Pressable, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import { ArticleCard } from '@/components/article-card'
import { Article } from '@poche/shared'
import { useAuth } from './_layout'
import { 
  loadArticlesFromStorage,
  deleteArticleWithSync,
  updateArticleTagsWithSync,
  updateArticleWithSync
} from '@/lib/article-sync'
import { IconSymbol } from '@/components/ui/icon-symbol'

export default function SearchScreen() {
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const textColor = useThemeColor({}, 'text')
  const textSecondary = useThemeColor({}, 'icon')
  const tintColor = useThemeColor({}, 'tint')
  const cardColor = useThemeColor({}, 'card')
  const backgroundColor = useThemeColor({}, 'background')

  // Load articles when screen comes into focus (also runs on mount)
  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        loadArticlesFromStorage(session.user.id)
          .then(setArticles)
          .catch(error => console.error('Error loading articles:', error))
      }
    }, [session])
  )

  // Auto-focus the input when the screen opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

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

  async function toggleFavorite(articleId: number) {
    if (!session?.user) return
    const article = articles.find(a => a.id === articleId)
    if (!article) return
    
    const newFavoriteStatus = !article.isFavorite
    // Optimistic update
    setArticles(articles.map(a => 
      a.id === articleId ? { ...a, isFavorite: newFavoriteStatus } : a
    ))
    
    try {
      await updateArticleWithSync(session.user.id, articleId, { isFavorite: newFavoriteStatus })
    } catch (error) {
      // Revert on error
      setArticles(articles.map(a => 
        a.id === articleId ? { ...a, isFavorite: !newFavoriteStatus } : a
      ))
      console.error('Error toggling favorite:', error)
    }
  }

  // Filter articles based on search query
  const results = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return []
    
    // Search across multiple fields
    const searchFields = (article: Article) => [
      article.title,
      article.siteName,
      article.author,
      article.excerpt,
      article.tags,
      article.url,
    ].some(field => field?.toLowerCase().includes(query))
    
    return articles
      .filter(searchFields)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [articles, searchQuery])

  const hasQuery = searchQuery.trim().length > 0

  if (!session?.user) {
    return null
  }

  return (
    <ThemedView style={styles.container}>
      {/* Search Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: cardColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search articles..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); inputRef.current?.focus() }} hitSlop={8}>
              <IconSymbol name="xmark.circle.fill" size={20} color={textSecondary} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.back()} style={styles.cancelButton}>
          <ThemedText style={[styles.cancelText, { color: tintColor }]}>
            Cancel
          </ThemedText>
        </Pressable>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!hasQuery ? (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: textSecondary }]}>
              Search your articles
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
              Find articles by title, author, site, or tags
            </ThemedText>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text.magnifyingglass" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              No results found
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
              Try a different search term
            </ThemedText>
          </View>
        ) : (
          <View style={styles.resultsList}>
            <ThemedText style={[styles.resultsCount, { color: textSecondary }]}>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </ThemedText>
            {results.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                onDelete={deleteArticle}
                onUpdateTags={updateArticleTags}
                onToggleFavorite={toggleFavorite}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'SourceSans3_400Regular',
    padding: 0,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingLeft: 4,
  },
  cancelText: {
    fontSize: 17,
    fontFamily: 'SourceSans3_500Medium',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyState: {
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
  resultsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontFamily: 'SourceSans3_500Medium',
    marginBottom: 4,
  },
})
