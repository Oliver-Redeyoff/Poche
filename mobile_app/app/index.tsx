import { useState, useEffect } from "react"
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
  const [menuVisible, setMenuVisible] = useState<number | null>(null)
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

  async function onRefresh() {
    setRefreshing(true)
    try {
      await getArticles()
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
              const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', articleId)

              if (error) {
                throw error
              }

              // Remove article from local state
              setArticles(articles.filter(article => article.id !== articleId))
            } catch (error) {
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
            renderItem={({ item }) => {
              const imageUrl = extractFirstImageUrl(item.content || null)
              const isMenuOpen = menuVisible === item.id
              
              return (
                <View style={styles.articleCardWrapper}>
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
                  <Pressable
                    onPress={() => setMenuVisible(isMenuOpen ? null : item.id)}
                    style={styles.menuButton}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={textColor} />
                  </Pressable>
                  {isMenuOpen && (
                    <Modal
                      visible={isMenuOpen}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={() => setMenuVisible(null)}
                    >
                      <Pressable
                        style={styles.menuOverlay}
                        onPress={() => setMenuVisible(null)}
                      >
                        <View style={[styles.menuContainer, { backgroundColor, borderColor }]}>
                          <Pressable
                            style={styles.menuItem}
                            onPress={() => {
                              deleteArticle(item.id)
                            }}
                          >
                            <Ionicons name="trash-outline" size={20} color="#ff3b30" style={styles.menuIcon} />
                            <ThemedText style={[styles.menuItemText, { color: '#ff3b30' }]}>
                              Delete
                            </ThemedText>
                          </Pressable>
                        </View>
                      </Pressable>
                    </Modal>
                  )}
                </View>
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
    marginBottom: 12,
  },
  articleCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
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
    height: 100,
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    minWidth: 200,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
})
