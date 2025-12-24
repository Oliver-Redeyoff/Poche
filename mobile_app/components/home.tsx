import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Alert, ScrollView, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { ThemedText } from './themed-text'
import { ThemedView } from './themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'

interface Article {
  id: number
  title?: string | null
  content?: string | null
  url?: string
  created_time?: string
  created_at?: string
  [key: string]: any
}

export default function Home({ session }: { session: Session }) {
  const router = useRouter()
  const headerHeight = useHeaderHeight()
  const [articles, setArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const borderColor = useThemeColor({}, 'icon')
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  
  // Calculate padding to account for header and safe area
  const topPadding = headerHeight

  useEffect(() => {
    if (session) {
      getArticles()
    }
  }, [session])

  async function getArticles() {
    try {
      setArticlesLoading(true)
      if (!session?.user) {
        throw new Error('No user on the session!')
      }
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_time', { ascending: false })

      if (error) {
        throw error
      }

      if (data) {
        setArticles(data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error fetching articles', error.message)
      }
    } finally {
      setArticlesLoading(false)
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: topPadding }}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            My Articles
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: borderColor }]}>
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </ThemedText>
        </View>

        {articlesLoading ? (
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
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/article/${item.id}`)}
                style={({ pressed }) => [
                  styles.articleCard,
                  { borderColor, backgroundColor },
                  pressed && styles.articleCardPressed,
                ]}
              >
                {item.title && (
                  <ThemedText type="defaultSemiBold" style={styles.articleTitle}>
                    {item.title}
                  </ThemedText>
                )}
                {item.url && (
                  <ThemedText style={[styles.articleUrl, { color: textColor }]}>
                    {item.url}
                  </ThemedText>
                )}
                {item.content && (
                  <ThemedText style={[styles.articleContent, { color: textColor }]} numberOfLines={3}>
                    {item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </ThemedText>
                )}
                {(item.created_at || item.created_time) && (
                  <ThemedText style={[styles.articleDate, { color: borderColor }]}>
                    {new Date(item.created_at || item.created_time || '').toLocaleDateString()}
                  </ThemedText>
                )}
              </Pressable>
            )}
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
  articleCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  articleCardPressed: {
    opacity: 0.7,
  },
  articleTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  articleUrl: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  articleContent: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  articleDate: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
})

