import { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, ScrollView, View, ActivityIndicator, Alert, Dimensions } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { supabase } from '../../lib/supabase'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'
import RenderHTML from 'react-native-render-html'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Article {
  id: number
  title?: string | null
  content?: string | null
  created_time?: string
  published_time?: string | null
  user_id: string
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const headerHeight = useHeaderHeight()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const borderColor = useThemeColor({}, 'icon')
  
  // Calculate padding to account for header and safe area
  const topPadding = headerHeight + 20

  useEffect(() => {
    if (id) {
      getArticle()
    }
  }, [id])

  async function getArticle() {
    try {
      setLoading(true)
      const articleId = parseInt(id as string, 10)
      
      if (isNaN(articleId)) {
        throw new Error('Invalid article ID')
      }

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setArticle(data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error loading article', error.message)
      }
      router.back()
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading article...</ThemedText>
      </ThemedView>
    )
  }

  if (!article) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Article not found</ThemedText>
      </ThemedView>
    )
  }

  const htmlContent = article.content || '<p>No content available</p>'
  const tagsStyles = {
    body: {
      color: textColor,
      fontSize: 16,
      lineHeight: 24,
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
      marginTop: 16,
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
      maxWidth: '100%',
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
        
        {(article.created_time || article.published_time) && (
          <ThemedText style={[styles.date, { color: borderColor }]}>
            {article.published_time 
              ? new Date(article.published_time).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : article.created_time
              ? new Date(article.created_time).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : null}
          </ThemedText>
        )}

        <View style={styles.contentContainer}>
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
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    marginBottom: 24,
    opacity: 0.7,
  },
  contentContainer: {
    marginTop: 8,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.6,
  },
})

