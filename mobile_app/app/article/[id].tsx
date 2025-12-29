import { useState, useEffect, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, ScrollView, View, ActivityIndicator, Alert, Dimensions, useColorScheme } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { supabase } from '../../lib/supabase'
import { ThemedText } from '@/components/themed-text'
import RenderHTML, { 
  TNode,
  RenderersProps,
  CustomBlockRenderer
} from 'react-native-render-html'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Article } from '../../shared/types'
import { tagToColor } from '../../shared/util'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 600) // Max width for comfortable reading
const HORIZONTAL_PADDING = (SCREEN_WIDTH - CONTENT_WIDTH) / 2

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const headerHeight = useHeaderHeight()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  // Premium reading colors - warm tones that are easy on the eyes
  // Accent color: Poche brand coral rgb(239, 64, 86) = #EF4056
  const colors = useMemo(() => ({
    text: isDark ? '#E8E4DF' : '#1A1A1A',
    textSecondary: isDark ? '#A8A4A0' : '#666666',
    textMuted: isDark ? '#787470' : '#999999',
    background: isDark ? '#1C1A18' : '#FAFAF8',
    accent: isDark ? '#F06B7E' : '#EF4056', // Poche coral - slightly lighter in dark mode
    accentHover: isDark ? '#E85A6E' : '#D93548',
    divider: isDark ? '#2E2C2A' : '#E8E4E0',
    blockquoteBg: isDark ? '#252320' : '#F5F3F0',
    blockquoteBorder: isDark ? '#4A4845' : '#D4D0CC',
    codeBg: isDark ? '#252320' : '#F0EDE8',
  }), [isDark])
  
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
  
  // Helper function to get styles based on data-component attribute
  // Must be defined before useMemo hooks that use it
  const getComponentStyle = (attrs: Record<string, string> | undefined) => {
    const component = attrs?.['data-component']
    if (!component) return {}
    
    switch (component) {
      case 'text-block':
        return {
          marginBottom: 8,
        }
      case 'image-block':
        return {
          marginVertical: 28,
          marginHorizontal: -HORIZONTAL_PADDING, // Full-bleed images
        }
      case 'subheadline-block':
        return {
          marginTop: 40,
          marginBottom: 8,
          paddingTop: 32,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }
      case 'caption-block':
        return {
          marginTop: -20,
          marginBottom: 28,
          paddingHorizontal: 16,
        }
      case 'byline-block':
        return {
          marginBottom: 32,
          paddingBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }
      default:
        return {}
    }
  }
  
  // Premium typography styles optimized for long-form reading
  // Must be defined before any conditional returns to follow Rules of Hooks
  const tagsStyles = useMemo(() => ({
    body: {
      width: CONTENT_WIDTH,
      color: colors.text,
      fontSize: 18,
      lineHeight: 32, // 1.78 ratio for optimal readability
      fontFamily: 'System',
    },
    p: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 30,
      marginBottom: 24,
      textAlign: 'left' as const,
    },
    div: {
      color: colors.text,
    },
    span: {
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
      marginBottom: 16,
      marginTop: 8,
    },
    h3: {
      color: colors.text,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: '700' as const,
      marginBottom: 12,
      marginTop: 32,
    },
    h4: {
      color: colors.text,
      fontSize: 19,
      lineHeight: 26,
      fontWeight: '700' as const,
      marginBottom: 10,
      marginTop: 24,
    },
    a: {
      color: colors.accent,
      textDecorationLine: 'none' as const,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent,
    },
    strong: {
      fontWeight: '600' as const,
      color: colors.text,
    },
    em: {
      fontStyle: 'italic' as const,
    },
    blockquote: {
      marginVertical: 28,
      paddingHorizontal: 20,
      paddingVertical: 4,
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
    },
    pre: {
      backgroundColor: 'transparent',
      whiteSpace: 'pre' as const,
    },
    figcaption: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontStyle: 'italic' as const,
      textAlign: 'center' as const,
      marginTop: 12,
      paddingHorizontal: 16,
    },
    figure: {
      marginVertical: 32,
      marginHorizontal: -HORIZONTAL_PADDING, // Full-bleed figures
    },
    picture: {
      width: SCREEN_WIDTH,
    },
    img: {
      width: SCREEN_WIDTH,
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
  
  // Renderers props to apply component-specific styles based on data-component attribute
  const renderersProps: Partial<RenderersProps> = useMemo(() => ({
    div: {
      style: (tnode: TNode) => {
        const componentStyle = getComponentStyle(tnode.attributes)
        return [tagsStyles.div, componentStyle]
      },
    },
    p: {
      style: (tnode: TNode) => {
        const componentStyle = getComponentStyle(tnode.attributes)
        return [tagsStyles.p, componentStyle]
      },
    },
  }), [tagsStyles])

  // Custom renderer for pre tags to enable horizontal scrolling
  const customRenderers = useMemo(() => ({
    pre: ((props) => {
      const { TDefaultRenderer, tnode } = props
      return (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={{
            backgroundColor: colors.codeBg,
            borderRadius: 8,
            marginVertical: 24,
          }}
          contentContainerStyle={{
            padding: 16,
            minWidth: '100%',
          }}
        >
          <TDefaultRenderer {...props} style={{ backgroundColor: 'transparent' }} />
        </ScrollView>
      )
    }) as CustomBlockRenderer,
  }), [colors])

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
            paddingTop: topPadding + 20,
            paddingHorizontal: HORIZONTAL_PADDING,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Header */}
        <View style={styles.header}>
          {article.title && (
            <ThemedText 
              style={[
                styles.title, 
                { color: colors.text }
              ]}
            >
              {article.title}
            </ThemedText>
          )}
          
          {/* Meta information */}
          <View style={styles.meta}>
            {article.siteName && (
              <ThemedText style={[styles.siteName, { color: colors.accent }]}>
                {article.siteName}
              </ThemedText>
            )}
            {readingTime && (
              <ThemedText style={[styles.readingTime, { color: colors.textMuted }]}>
                {readingTime} min read
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
        <View style={styles.contentContainer}>
          <RenderHTML
            contentWidth={CONTENT_WIDTH}
            source={{ html: htmlContent }}
            tagsStyles={tagsStyles}
            renderersProps={renderersProps}
            renderers={customRenderers}
            baseStyle={{
              color: colors.text,
            }}
            defaultTextProps={{
              textBreakStrategy: 'simple',
              lineBreakStrategyIOS: 'standard',
            }}
          />
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
    marginBottom: 24,
    padding: 12,
    backgroundColor: 'rgba(120, 120, 120, 0.1)',
    borderRadius: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  siteName: {
    fontSize: 15,
    fontWeight: '600',
  },
  readingTime: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
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

