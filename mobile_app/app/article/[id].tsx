import { useState, useEffect, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, ScrollView, View, ActivityIndicator, Alert, useWindowDimensions, useColorScheme } from 'react-native'
import { supabase } from '../../lib/supabase'
import { ThemedText } from '@/components/themed-text'
import RenderHTML, { 
  CustomBlockRenderer
} from 'react-native-render-html'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Article } from '../../shared/types'
import { tagToColor } from '../../shared/util'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated'
import { useTheme } from '@react-navigation/native'

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [contentReady, setContentReady] = useState(false)
  const [renderKey, setRenderKey] = useState(0)
  const colorScheme = useColorScheme()
  const theme = useTheme()
  const isDark = colorScheme === 'dark'
  
  // Use hook instead of Dimensions.get() to ensure correct values on initial render
  const { width: screenWidth } = useWindowDimensions()
  const contentWidth = Math.min(screenWidth - 40, 600) // Max width for comfortable reading
  const horizontalPadding = (screenWidth - contentWidth) / 2
  
  // Premium reading colors - warm tones that are easy on the eyes
  const colors = useMemo(() => ({
    text: theme.colors.text,
    textSecondary: isDark ? '#A8A4A0' : '#666666',
    textMuted: isDark ? '#787470' : '#999999',
    background: theme.colors.background,
    accent: theme.colors.primary,
    accentHover: isDark ? '#E85A6E' : '#D93548',
    divider: theme.colors.border,
    blockquoteBg: isDark ? '#252320' : '#F5F3F0',
    blockquoteBorder: isDark ? '#4A4845' : '#D4D0CC',
    codeBg: isDark ? '#252320' : '#F0EDE8',
  }), [isDark])
  

  useEffect(() => {
    if (id) {
      getArticle()
    }
  }, [id])

  // Reset content ready state when article changes
  useEffect(() => {
    setContentReady(false)
    setRenderKey(prev => prev + 1)
  }, [article?.id])

  // Callback when HTML is loaded - wait a bit then show content
  const handleHTMLLoaded = () => {
    // Small delay to allow text measurements to complete
    setTimeout(() => {
      setContentReady(true)
    }, 200)
  }

  // Animated opacity for content fade-in
  const contentOpacity = useSharedValue(0)
  
  useEffect(() => {
    contentOpacity.value = withTiming(contentReady ? 1 : 0, { duration: 300 })
  }, [contentReady])

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }))

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
  
  // Premium typography styles optimized for long-form reading
  // Must be defined before any conditional returns to follow Rules of Hooks
  const tagsStyles = useMemo(() => ({
    body: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 32, // 1.78 ratio for optimal readability
      fontFamily: 'System',
    },
    p: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 30,
      marginVertical: 12,
      textAlign: 'left' as const,
    },
    div: {
      color: colors.text,
    },
    span: {
      textAlign: 'center' as const,
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    h1: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      marginBottom: 24,
      marginTop: 48,
    },
    h2: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 34,
      fontWeight: '700' as const,
      marginTop: 16,
      marginBottom: 8,
    },
    h3: {
      color: colors.text,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: '700' as const,
      marginTop: 16,
      marginBottom: 8,
    },
    h4: {
      color: colors.text,
      fontSize: 19,
      lineHeight: 26,
      fontWeight: '700' as const,
      marginTop: 16,
      marginBottom: 8,
    },
    a: {
      color: colors.accent,
      textDecorationLine: 'none' as const,
    },
    strong: {
      fontWeight: '600' as const,
      color: colors.text,
    },
    em: {
      fontStyle: 'italic' as const,
    },
    blockquote: {
      marginVertical: 12,
      paddingHorizontal: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      backgroundColor: colors.blockquoteBg,
    },
    ul: {
      marginVertical: 20,
      paddingLeft: 8,
    },
    ol: {
      marginVertical: 20,
      paddingLeft: 8,
    },
    li: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 30,
      marginBottom: 12,
      paddingLeft: 8,
    },
    code: {
      fontFamily: 'Menlo',
      fontSize: 15,
      backgroundColor: colors.codeBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      color: colors.text,
      textAlign: 'left' as const,
    },
    pre: {
      whiteSpace: 'pre' as const,
      textAlign: 'left' as const,
    },
    figcaption: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontStyle: 'italic' as const,
      textAlign: 'center' as const,
      margin: 0,
      paddingHorizontal: 16,
    },
    figure: {
      marginBottom: 18,
    },
    picture: {
      maxWidth: contentWidth,
      height: 'auto',
    },
    img: {
      maxWidth: contentWidth,
      height: 'auto',
      borderRadius: 0,
    },
    hr: {
      marginVertical: 40,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      height: 0,
    },
    table: {
      marginVertical: 24,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 8,
    },
    th: {
      backgroundColor: colors.blockquoteBg,
      padding: 12,
      fontWeight: '600' as const,
    },
    td: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
  }), [colors])
  
  // Custom renderers to apply component-specific styles based on data-component attribute
  const customRenderers = useMemo(() => ({
    div: ((props) => {
      const { TDefaultRenderer, tnode } = props
      
      return (
        <TDefaultRenderer 
          {...props} 
          style={tagsStyles.div as any} 
        />
      )
    }) as CustomBlockRenderer,
    
    p: ((props) => {
      const { TDefaultRenderer, tnode } = props
      
      return (
        <TDefaultRenderer 
          {...props} 
          style={tagsStyles.p as any} 
        />
      )
    }) as CustomBlockRenderer,
    
    pre: ((props) => {
      const { TDefaultRenderer } = props
      return (
        <View style={{
          backgroundColor: colors.codeBg,
          borderRadius: 8,
          marginVertical: 12,
        }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{
              padding: 16,
            }}
          >
            <TDefaultRenderer {...props} style={{ backgroundColor: 'transparent' } as any} />
          </ScrollView>
        </View>
      )
    }) as CustomBlockRenderer,
  }), [colors, tagsStyles])

  // Conditional returns - must come after all hooks
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <ThemedText style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading article...
        </ThemedText>
      </View>
    )
  }

  if (!article) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ThemedText style={{ color: colors.textMuted }}>Article not found</ThemedText>
      </View>
    )
  }

  const htmlContent = article.content || '<p>No content available</p>'

  // Calculate reading time
  const readingTime = article.length 
    ? Math.max(1, Math.ceil(article.length / 1200))
    : null

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingTop: 120,
          }
        ]}
      >
        {/* Article Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
          {article.title && (
            <ThemedText 
              style={[
                styles.title, 
                { color: colors.text, textDecorationColor: colors.accent, textDecorationStyle: 'solid' }
              ]}
            >
              {article.title}
            </ThemedText>
          )}
          
          {/* Meta information */}
          <View style={styles.meta}>
            {article.siteName && (
              <ThemedText style={[styles.siteName]}>
                {article.siteName} • {readingTime} min read
              </ThemedText>
            )}
          </View>
          
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {article.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagChip,
                    { 
                      backgroundColor: tagToColor(tag, 0.15),
                      borderWidth: 1,
                      borderColor: tagToColor(tag, 0.4),
                    }
                  ]}
                >
                  <ThemedText style={[
                    styles.tagChipText,
                    { color: tagToColor(tag, 1.0) }
                  ]}>
                    {tag}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Article Content */}
        <View style={[styles.contentContainer, { width: contentWidth }]}>
          {/* Loading overlay - shows while content is rendering */}
          {!contentReady && (
            <View 
              style={[
                styles.contentLoadingOverlay, 
                { backgroundColor: colors.background }
              ]}
            >
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}
          
          <Animated.View style={contentAnimatedStyle}>
            <RenderHTML
              key={`article-${article.id}-${renderKey}-${screenWidth}`}
              contentWidth={contentWidth}
              source={{ html: htmlContent }}
              tagsStyles={tagsStyles}
              renderers={customRenderers}
              baseStyle={{
                color: colors.text,
              }}
              defaultTextProps={{
                textBreakStrategy: 'simple',
                lineBreakStrategyIOS: 'standard',
                allowFontScaling: false,
              }}
              ignoredStyles={['width', 'maxWidth', 'minWidth']}
              enableExperimentalGhostLinesPrevention={true}
              onHTMLLoaded={handleHTMLLoaded}
            />
          </Animated.View>
        </View>
        
        {/* End of article marker */}
        <View style={styles.endMarker}>
          <View style={[styles.endMarkerDot, { backgroundColor: colors.accent }]} />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 18,
    boxShadow: '0px 8px 24px rgba(120, 120, 120, 0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 42,
    textDecorationLine: 'underline' as const,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  siteName: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(120, 120, 120, 0.8)',
  },
  readingTime: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 16,
  },
  contentLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    alignItems: 'center',
    zIndex: 10,
  },
  endMarker: {
    alignItems: 'center',
    paddingVertical: 48,
    marginBottom: 32,
  },
  endMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.6,
  },
})

