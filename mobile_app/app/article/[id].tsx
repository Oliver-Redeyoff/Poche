import { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, ScrollView, View, ActivityIndicator, Alert, Dimensions } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { supabase } from '../../lib/supabase'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import RenderHTML from 'react-native-render-html'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Article } from '../../shared/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const headerHeight = useHeaderHeight()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const textColor = useThemeColor({}, 'text')
  
  // Calculate padding to account for header and safe area
  const topPadding = headerHeight

  useEffect(() => {
    if (id) {
      getArticle()
    }
  }, [id])

  // Get storage key for articles (per user)
  async function getArticlesStorageKey(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return ''
      return `@poche_articles_${session.user.id}`
    } catch {
      return ''
    }
  }

  // Load article from local storage
  async function loadArticleFromStorage(articleId: number): Promise<Article | null> {
    try {
      const storageKey = await getArticlesStorageKey()
      if (!storageKey) return null
      
      const storedData = await AsyncStorage.getItem(storageKey)
      if (!storedData) return null
      
      const storedArticles: Article[] = JSON.parse(storedData)
      return storedArticles.find(article => article.id === articleId) || null
    } catch (error) {
      console.error('Error loading article from storage:', error)
      return null
    }
  }

  async function getArticle() {
    try {
      setLoading(true)
      const articleId = parseInt(id as string, 10)
      
      if (isNaN(articleId)) {
        throw new Error('Invalid article ID')
      }

      // Load article from local storage only
      const storedArticle = await loadArticleFromStorage(articleId)
      
      if (storedArticle) {
        setArticle(storedArticle)
      } else {
        // Article not found in local storage
        Alert.alert('Article not found', 'This article is not available offline. Please sync your articles first.')
        router.back()
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error loading article', error.message)
        router.back()
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading article...</ThemedText>
      </ThemedView>
    )
  }

  if (!article) {
    return (
      <ThemedView style={[styles.container]}>
        <ThemedText>Article not found</ThemedText>
      </ThemedView>
    )
  }

  const htmlContent = article.content || '<p>No content available</p>'
  const tagsStyles = {
    body: {
      width: SCREEN_WIDTH - 32,
      color: textColor,
      fontSize: 16,
      lineHeight: 24,
      paddingBottom: 32,
    },
    p: {
      color: textColor,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 16,
    },
    h1: {
      color: textColor,
      fontSize: 28,
      fontWeight: "bold" as const,
      marginBottom: 16,
    },
    h2: {
      color: textColor,
      fontSize: 24,
      fontWeight: "bold" as const,
      marginBottom: 12,
      marginTop: 12,
    },
    h3: {
      color: textColor,
      fontSize: 20,
      fontWeight:  "bold" as const,
      marginBottom: 10,
      marginTop: 10,
    },
    a: {
      color: '#0a7ea4',
      textDecorationLine: "underline" as const,
    },
    picture: {
      maxWidth: SCREEN_WIDTH - 32,
      height: 'auto',
      marginTop: 16,
      marginBottom: 16,
    },
    img: {
      maxWidth: SCREEN_WIDTH - 32,
      height: 'auto',
      marginTop: 16,
      marginBottom: 16,
    },
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
      >
        {article.title && (
          <ThemedText type="title" style={styles.title}>
            {article.title}
          </ThemedText>
        )}
        <View>
          <RenderHTML
            contentWidth={SCREEN_WIDTH - 32}
            source={{ html: htmlContent }}
            tagsStyles={tagsStyles}
            baseStyle={{
              color: textColor,
            }}
          />
        </View>
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.6,
  },
})

