import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, ScrollView, View, ActivityIndicator, Alert, useWindowDimensions, useColorScheme, Text, Linking } from 'react-native'
import { Image } from 'expo-image'
import { ThemedText } from '@/components/themed-text'
import Markdown from 'react-native-markdown-display'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Article } from '../../shared/types'
import { tagToColor } from '../../shared/util'
import { getCachedImagePath } from '../../lib/image-cache'
import { useTheme } from '@react-navigation/native'
import { useAuth } from '../_layout'

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const colorScheme = useColorScheme()
  const theme = useTheme()
  const isDark = colorScheme === 'dark'
  
  // Use hook instead of Dimensions.get() to ensure correct values on initial render
  const { width: screenWidth } = useWindowDimensions()
  const contentWidth = Math.min(screenWidth - 40, 600) // Max width for comfortable reading
  
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
  }), [isDark, theme])
  

  useEffect(() => {
    if (id) {
      getArticle()
    }
  }, [id])

  // Get storage key for articles (per user)
  function getArticlesStorageKey(): string {
    if (!session?.user) return ''
    return `@poche_articles_${session.user.id}`
  }

  // Load article from local storage
  async function loadArticleFromStorage(articleId: number): Promise<Article | null> {
    try {
      const storageKey = getArticlesStorageKey()
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
  
  // Markdown styles for premium reading experience
  const markdownStyles = useMemo(() => StyleSheet.create({
    body: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 30,
      fontFamily: 'NotoSans_400Regular',
    },
    paragraph: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 30,
      marginVertical: 12,
      fontFamily: 'NotoSans_400Regular',
    },
    heading1: {
      color: colors.text,
      fontSize: 32,
      lineHeight: 40,
      marginBottom: 24,
      marginTop: 48,
      fontFamily: 'NotoSans_600SemiBold',
    },
    heading2: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 34,
      marginTop: 32,
      marginBottom: 16,
      fontFamily: 'NotoSans_600SemiBold',
    },
    heading3: {
      color: colors.text,
      fontSize: 22,
      lineHeight: 30,
      marginTop: 24,
      marginBottom: 12,
      fontFamily: 'NotoSans_600SemiBold',
    },
    heading4: {
      color: colors.text,
      fontSize: 19,
      lineHeight: 26,
      marginTop: 20,
      marginBottom: 8,
      fontFamily: 'NotoSans_600SemiBold',
    },
    heading5: {
      color: colors.text,
      fontSize: 17,
      lineHeight: 24,
      marginTop: 16,
      marginBottom: 8,
      fontFamily: 'NotoSans_600SemiBold',
    },
    heading6: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 22,
      marginTop: 16,
      marginBottom: 8,
      fontFamily: 'NotoSans_600SemiBold',
    },
    link: {
      textDecorationLine: 'underline',
      textDecorationColor: colors.accent,
      fontFamily: 'NotoSans_400Regular',
    },
    strong: {
      color: colors.text,
      fontFamily: 'NotoSans_600SemiBold',
    },
    em: {
      fontStyle: 'italic',
      fontFamily: 'NotoSans_400Regular',
    },
    blockquote: {
      marginVertical: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      backgroundColor: colors.blockquoteBg,
      fontFamily: 'NotoSans_400Regular',
      borderRadius: 4,
    },
    bullet_list: {
      marginVertical: 16,
    },
    ordered_list: {
      marginVertical: 16,
    },
    list_item: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 30,
      marginBottom: 8,
      fontFamily: 'NotoSans_400Regular',
    },
    code_inline: {
      fontFamily: 'Menlo',
      fontSize: 15,
      backgroundColor: colors.codeBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      color: colors.text,
    },
    code_block: {
      fontFamily: 'Menlo',
      fontSize: 14,
      backgroundColor: colors.codeBg,
      padding: 16,
      borderRadius: 8,
      marginVertical: 16,
      color: colors.text,
    },
    fence: {
      fontFamily: 'Menlo',
      fontSize: 14,
      backgroundColor: colors.codeBg,
      padding: 16,
      borderRadius: 8,
      marginVertical: 16,
      color: colors.text,
    },
    image: {
      width: contentWidth,
      borderRadius: 8,
      marginVertical: 16,
    },
    hr: {
      marginVertical: 40,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    table: {
      marginVertical: 24,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 8,
      fontFamily: 'NotoSans_400Regular',
    },
    th: {
      backgroundColor: colors.blockquoteBg,
      padding: 12,
      fontFamily: 'NotoSans_600SemiBold',
    },
    td: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      fontFamily: 'NotoSans_400Regular',
    },
  }), [colors, contentWidth])

  // Track which images have failed to load
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // Minimum image dimensions to render (skip tiny images like tracking pixels)
  const MIN_IMAGE_WIDTH = 50
  const MIN_IMAGE_HEIGHT = 50

  // Get user ID for cached image lookup
  const userId = session?.user?.id || null
  const articleId = article?.id || null

  // Custom image component that handles errors, filters small images, and uses cached versions
  const ArticleImage = useCallback(({ src, nodeKey }: { src: string, nodeKey: string }) => {
    const [hasError, setHasError] = useState(false)
    const [isTooSmall, setIsTooSmall] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [imageSrc, setImageSrc] = useState<string>(src)

    // Look up cached version of the image
    useEffect(() => {
      let mounted = true
      
      getCachedImagePath(userId, articleId, src).then((cachedPath) => {
        if (mounted) {
          setImageSrc(cachedPath)
        }
      })
      
      return () => { mounted = false }
    }, [src])

    // Skip rendering if this image has already failed or is too small
    if (hasError || isTooSmall || failedImages.has(src)) {
      return null
    }

    // Skip obviously invalid image URLs
    if (!src || src.trim() === '' || src === '#' || src.startsWith('data:image/gif;base64,R0lGOD')) {
      return null
    }

    return (
      <View style={{ marginVertical: 16, width: '100%', display: (hasError || isTooSmall) ? 'none' : 'flex' }}>
        <Image
          source={{ uri: imageSrc }}
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
          }}
          contentFit="contain"
          transition={200}
          onLoad={(event) => {
            setIsLoading(false)
            // Check if the image is too small (like tracking pixels or icons)
            const { width, height } = event.source
            if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
              setIsTooSmall(true)
              setFailedImages(prev => new Set(prev).add(src))
            }
          }}
          onError={() => {
            setHasError(true)
            setFailedImages(prev => new Set(prev).add(src))
          }}
        />
      </View>
    )
  }, [failedImages, userId, articleId])

  // Helper to resolve relative URLs against article's base URL
  const resolveUrl = useCallback((href: string): string | null => {
    if (!href) return null
    
    // Already a valid absolute URL
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href
    }
    
    // Skip file:// URLs (these are cached images, not links)
    if (href.startsWith('file://')) {
      return null
    }
    
    // Try to resolve relative URLs using article's URL as base
    if (article?.url) {
      try {
        const baseUrl = new URL(article.url)
        if (href.startsWith('/')) {
          // Absolute path relative to domain
          return `${baseUrl.protocol}//${baseUrl.host}${href}`
        } else {
          // Relative path
          const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1)
          return `${baseUrl.protocol}//${baseUrl.host}${basePath}${href}`
        }
      } catch {
        return null
      }
    }
    
    return null
  }, [article?.url])

  // Custom rules for markdown rendering
  const markdownRules = useMemo(() => ({
    // Custom image renderer to fix key prop and sizing issues
    image: (node: any, children: any, parent: any, styles: any) => {
      const { src, alt } = node.attributes
      return <ArticleImage key={node.key} src={src} nodeKey={node.key} />
    },
    // Custom link renderer to handle relative URLs and style with accent color
    link: (node: any, children: any, parent: any, styles: any) => {
      const { href } = node.attributes
      const resolvedUrl = resolveUrl(href)
      
      return (
        <Text
          key={node.key}
          style={{
            color: colors.accent,
            textDecorationLine: 'underline',
            textDecorationColor: colors.accent,
            fontFamily: 'NotoSans_400Regular',
          }}
          onPress={() => {
            if (resolvedUrl) {
              Linking.openURL(resolvedUrl)
            }
          }}
        >
          {children}
        </Text>
      )
    },
  }), [ArticleImage, colors.accent, resolveUrl])

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

  const markdownContent = article.content || '*No content available*'

  // Calculate reading time from word count
  const readingTime = article.wordCount 
    ? Math.max(1, Math.ceil(article.wordCount / 200))
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
            {(article.siteName || article.author) && (
              <ThemedText style={styles.siteName}>
                {article.siteName || article.author}
                {readingTime && ` • ${readingTime} min read`}
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
                    { backgroundColor: tagToColor(tag, 0.15) }
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
        <View style={[styles.contentContainer, { maxWidth: contentWidth }]}>
          <Markdown 
            style={markdownStyles}
            rules={markdownRules}
          >
            {markdownContent}
          </Markdown>
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
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: 'NotoSans_700Bold',
    lineHeight: 42,
    textDecorationLine: 'underline',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  siteName: {
    fontSize: 15,
    fontFamily: 'NotoSans_500Medium',
    color: 'rgba(120, 120, 120, 0.8)',
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
    fontFamily: 'NotoSans_500Medium',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 16,
    alignSelf: 'center',
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
