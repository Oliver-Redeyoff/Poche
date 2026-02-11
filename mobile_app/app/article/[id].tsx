import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, ScrollView, View, ActivityIndicator, Alert, useWindowDimensions, useColorScheme, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Image } from 'expo-image'
import { ThemedText } from '@/components/themed-text'
import { Markdown, MarkdownStyles } from '@/components/markdown'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Article, tagToColor } from '@poche/shared'
import { getCachedImagePath } from '../../lib/image-cache'
import { useTheme } from '@react-navigation/native'
import { useAuth } from '../_layout'
import { 
  updateReadingProgressLocal, 
  syncReadingProgressToBackend,
  updateArticleWithSync
} from '../../lib/article-sync'
import { Header } from '@/components/header'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Pressable, Linking, Dimensions } from 'react-native'

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const windowHeight = Dimensions.get('window').height
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const colorScheme = useColorScheme()
  const theme = useTheme()
  const isDark = colorScheme === 'dark'
  
  // Use hook instead of Dimensions.get() to ensure correct values on initial render
  const { width: screenWidth } = useWindowDimensions()
  const contentWidth = Math.min(screenWidth - 40, 600) // Max width for comfortable reading

  // Reading progress tracking
  const [readingProgress, setReadingProgress] = useState(0)
  const readingProgressRef = useRef(0) // Ref copy for cleanup function
  const articleRef = useRef<Article | null>(null) // Ref copy for cleanup function
  const lastSyncedProgress = useRef(0)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasReachedEnd = useRef(false)
  
  // Scroll restoration
  const scrollViewRef = useRef<ScrollView>(null)
  const initialProgressRef = useRef<number | null>(null) // Store initial progress for scroll restoration
  const hasRestoredScroll = useRef(false)
  
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
        articleRef.current = storedArticle
        // Initialize reading progress from stored article
        const initialProgress = storedArticle.readingProgress || 0
        setReadingProgress(initialProgress)
        readingProgressRef.current = initialProgress
        lastSyncedProgress.current = initialProgress
        // Store initial progress for scroll restoration (only if in progress)
        if (initialProgress > 0 && initialProgress < 100) {
          initialProgressRef.current = initialProgress
          hasRestoredScroll.current = false
        } 
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

  // Restore scroll position when content is ready
  const handleContentSizeChange = useCallback((contentWidth: number, contentHeight: number) => {
    if (
      initialProgressRef.current !== null && 
      !hasRestoredScroll.current && 
      contentHeight > 0 &&
      scrollViewRef.current
    ) {
      // Calculate the scroll position based on progress percentage, subtract the height of the screen
      const scrollPosition = (initialProgressRef.current / 100) * (contentHeight - windowHeight)
      
      // Scroll instantly (not animated) so content appears at correct position
      scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false })
      hasRestoredScroll.current = true
    }
  }, [])

  // Handle scroll to track reading progress
  const lastLocalSaveProgress = useRef(0)
  const PROGRESS_SAVE_THRESHOLD = 5 // Only save when progress changes by 5%
  
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Ignore scroll events until scroll restoration is complete (if restoration is needed)
    if (initialProgressRef.current !== null && !hasRestoredScroll.current) return
    
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    
    // Calculate scroll progress (0-100)
    const scrollableHeight = contentSize.height - layoutMeasurement.height
    if (scrollableHeight <= 0) return
    
    const progress = Math.min(100, Math.max(0, Math.round((contentOffset.y / scrollableHeight) * 100)))
    
    // Only update if progress increased (don't decrease on scroll up)
    if (progress > readingProgress) {
      setReadingProgress(progress)
      readingProgressRef.current = progress
      
      // Only save to local storage when progress changes by threshold amount (or reaches 100)
      const shouldSaveLocally = progress === 100 || 
        (progress - lastLocalSaveProgress.current >= PROGRESS_SAVE_THRESHOLD)
      
      if (shouldSaveLocally && session?.user && article) {
        updateReadingProgressLocal(session.user.id, article.id, progress)
        lastLocalSaveProgress.current = progress
      }
      
      // Debounce backend sync - wait 3 seconds after scrolling stops
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      
      // Sync to backend after 3 seconds of no scrolling, or immediately if finished
      if (progress === 100 && !hasReachedEnd.current) {
        hasReachedEnd.current = true
        if (article) {
          syncReadingProgressToBackend(article.id, 100)
          lastSyncedProgress.current = 100
        }
      } else {
        syncTimeoutRef.current = setTimeout(() => {
          if (article && progress > lastSyncedProgress.current) {
            syncReadingProgressToBackend(article.id, progress)
            lastSyncedProgress.current = progress
          }
        }, 3000)
      }
    }
  }, [readingProgress, session?.user, article])

  // Cleanup and sync on unmount only
  useEffect(() => {
    return () => {
      // Clear any pending sync timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      
      // Sync final progress to backend on unmount if changed
      // Using refs to avoid re-running effect on every state change
      if (articleRef.current && readingProgressRef.current > lastSyncedProgress.current) {
        syncReadingProgressToBackend(articleRef.current.id, readingProgressRef.current)
      }
    }
  }, []) // Empty deps - only runs on unmount

  // Toggle favorite status
  const toggleFavorite = useCallback(async () => {
    if (!article || !session?.user) return
    
    const newFavoriteStatus = !article.isFavorite
    
    // Optimistic update
    setArticle({ ...article, isFavorite: newFavoriteStatus })
    
    // Sync to storage and backend
    try {
      await updateArticleWithSync(session.user.id, article.id, { isFavorite: newFavoriteStatus })
    } catch (error) {
      // Revert on error
      setArticle({ ...article, isFavorite: !newFavoriteStatus })
      Alert.alert('Error', 'Failed to update favorite status')
    }
  }, [article, session?.user])
  
  // Markdown styles for premium reading experience
  const markdownStyles = useMemo((): MarkdownStyles => ({
    paragraph: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 28,
      marginVertical: 12,
      fontFamily: 'SourceSans3_400Regular',
    },
    heading1: {
      color: colors.text,
      fontSize: 32,
      marginBottom: 24,
      marginTop: 48,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading2: {
      color: colors.text,
      fontSize: 26,
      marginTop: 32,
      marginBottom: 16,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading3: {
      color: colors.text,
      fontSize: 22,
      marginTop: 24,
      marginBottom: 12,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading4: {
      color: colors.text,
      fontSize: 19,
      marginTop: 20,
      marginBottom: 8,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading5: {
      color: colors.text,
      fontSize: 17,
      marginTop: 16,
      marginBottom: 8,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading6: {
      color: colors.textSecondary,
      fontSize: 16,
      marginTop: 16,
      marginBottom: 8,
      fontFamily: 'Bitter_600SemiBold',
    },
    link: {
      color: colors.accent,
      textDecorationLine: 'underline',
      textDecorationColor: colors.accent,
      fontFamily: 'SourceSans3_400Regular',
    },
    strong: {
      color: colors.text,
      fontFamily: 'SourceSans3_600SemiBold',
    },
    em: {
      fontStyle: 'italic',
      fontFamily: 'SourceSans3_400Regular',
    },
    blockquote: {
      marginVertical: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      backgroundColor: colors.blockquoteBg,
      borderRadius: 4,
    },
    blockquoteText: {
      fontFamily: 'SourceSans3_400Regular',
      color: colors.text,
    },
    bullet_list: {
      marginVertical: 16,
    },
    ordered_list: {
      marginVertical: 16,
    },
    list_item: {
      marginBottom: 8,
    },
    list_item_text: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 28,
      fontFamily: 'SourceSans3_400Regular',
    },
    list_bullet: {
      color: colors.textSecondary,
      fontSize: 18,
      fontFamily: 'SourceSans3_400Regular',
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
      backgroundColor: colors.codeBg,
      padding: 16,
      borderRadius: 8,
      marginVertical: 16,
    },
    code_block_text: {
      fontFamily: 'Menlo',
      fontSize: 14,
      color: colors.text,
    },
    image: {
      borderRadius: 8,
      marginVertical: 16,
    },
    hr: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 40,
    },
    table: {
      marginVertical: 24,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 8,
      overflow: 'hidden',
    },
    tableRow: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    tableHeader: {
      backgroundColor: colors.blockquoteBg,
    },
    tableHeaderCell: {
      padding: 12,
    },
    tableHeaderCellText: {
      fontFamily: 'SourceSans3_600SemiBold',
      color: colors.text,
    },
    tableCell: {
      padding: 12,
    },
    tableCellText: {
      fontFamily: 'SourceSans3_400Regular',
      color: colors.text,
    },
    strikethrough: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
  }), [colors])

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

  // Custom image renderer for the Markdown component
  const renderArticleImage = useCallback(({ src, alt, nodeKey }: { src: string; alt?: string; nodeKey: string }) => {
    return <ArticleImage key={nodeKey} src={src} nodeKey={nodeKey} />
  }, [ArticleImage])

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
      <Header 
        showLogo
        showBack
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={toggleFavorite}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
            >
              <IconSymbol 
                name={article.isFavorite ? 'star.fill' : 'star'} 
                size={28} 
                color={article.isFavorite ? '#FFD700' : colors.text} 
              />
            </Pressable>
            {article.url && (
              <Pressable
                onPress={() => Linking.openURL(article.url as string)}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
              >
                <IconSymbol name="arrow.up.right.square" size={28} color={colors.text} />
              </Pressable>
            )}
          </View>
        }
      />

      <ScrollView 
        ref={scrollViewRef}
        style={[styles.scrollView]}
        contentContainerStyle={[styles.scrollContent]}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={250}
      >
        {/* Article Header */}
        <View style={[styles.header]}>
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
            baseUrl={article.url || undefined}
            renderImage={renderArticleImage}
            minImageWidth={MIN_IMAGE_WIDTH}
            minImageHeight={MIN_IMAGE_HEIGHT}
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
    paddingTop: 24,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Bitter_700Bold',
    // textDecorationLine: 'underline',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  siteName: {
    fontSize: 15,
    fontFamily: 'SourceSans3_500Medium',
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
    fontFamily: 'SourceSans3_500Medium',
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
