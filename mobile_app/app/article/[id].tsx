import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, ScrollView, View, ActivityIndicator, Alert, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeOut } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { ThemedText } from '@/components/themed-text'
import { Markdown, MarkdownStyles } from '@/components/markdown'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Article } from '@poche/shared'
import { getCachedImagePath } from '../../lib/image-cache'
import { useTheme } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth, BASE_FONT_SIZE, type PocheTheme } from '../_layout'
import { 
  updateReadingProgressLocal, 
  syncReadingProgressToBackend,
  updateArticleWithSync,
  deleteArticleWithSync,
  updateArticleTagsWithSync
} from '../../lib/article-sync'
import { Header } from '@/components/header'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { TagList } from '@/components/tag-list'
import { DropdownMenu, DropdownMenuItem } from '@/components/dropdown-menu'
import { Pressable, Linking } from 'react-native'
import { ReadingSettingsDrawer } from '@/components/reading-settings-drawer'

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const theme = useTheme() as PocheTheme
  const isDark = theme.dark
  const multiplier = theme.fontSizeMultiplier ?? 1
  const fontSize = Math.round(BASE_FONT_SIZE * multiplier)
  const insets = useSafeAreaInsets()
  
  // Use hook instead of Dimensions.get() to ensure correct values on initial render
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const contentWidth = Math.min(screenWidth - 40, 600) // Max width for comfortable reading

  // Reading progress tracking
  const [readingProgress, setReadingProgress] = useState(0)
  const readingProgressRef = useRef(0) // Ref copy for cleanup function
  const articleRef = useRef<Article | null>(null) // Ref copy for cleanup function
  const lastSyncedProgress = useRef(0)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasReachedEnd = useRef(false)
  
  // Animated progress bar
  const progressBarWidth = useSharedValue(0) // 0-1 fraction
  const progressTrackWidth = useSharedValue(0)
  const progressBarStyle = useAnimatedStyle(() => ({
    width: progressBarWidth.value * progressTrackWidth.value,
  }))

  // Scroll restoration
  const scrollViewRef = useRef<ScrollView>(null)
  const initialProgressRef = useRef<number | null>(null) // Store initial progress for scroll restoration
  const hasRestoredScroll = useRef(false)
  const [isScrollReady, setIsScrollReady] = useState(false) // Hide content until scroll position is restored
  
  // "Return to progress" button
  const contentHeightRef = useRef(0)
  const layoutHeightRef = useRef(0)
  const [showReturnButton, setShowReturnButton] = useState(false)

  // Collapsible header on scroll
  const prevScrollY = useRef(0)
  const [headerHidden, setHeaderHidden] = useState(false)
  const returnBtnTop = useSharedValue(insets.bottom)

  useEffect(() => {
    const fullTop = insets.top + 56 + 3 + 8
    const collapsedTop = insets.top + 3 + 8
    returnBtnTop.value = withTiming(headerHidden ? collapsedTop : fullTop, { duration: 250 })
  }, [headerHidden, insets.top])

  // Reading settings (theme comes from AuthContext; fontSize from navigation theme for app-wide consistency)
  const { appTheme: readingTheme } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  const dismissDrawer = useCallback(() => {
    setShowSettings(false)
  }, [])

  // Reading colors derived from the active navigation theme + article-specific extras
  const effectiveDark = theme.dark

  const colors = useMemo(() => {
    const isSepia = readingTheme === 'sepia'
    return {
      text: theme.colors.text,
      textSecondary: effectiveDark ? '#A8A4A0' : isSepia ? '#6B5D4F' : '#666666',
      textMuted: effectiveDark ? '#787470' : isSepia ? '#8A7B6B' : '#999999',
      background: theme.colors.background,
      accent: theme.colors.primary,
      accentHover: effectiveDark ? '#E85A6E' : isSepia ? '#C03D4E' : '#D93548',
      divider: theme.colors.border,
      blockquoteBg: effectiveDark ? '#252320' : isSepia ? '#EDE3CA' : '#F5F3F0',
      blockquoteBorder: effectiveDark ? '#4A4845' : isSepia ? '#C4B896' : '#D4D0CC',
      codeBg: effectiveDark ? '#252320' : isSepia ? '#EDE3CA' : '#F0EDE8',
      card: theme.colors.card,
    }
  }, [readingTheme, effectiveDark, theme])
  

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
        progressBarWidth.value = initialProgress / 100
        // Store initial progress for scroll restoration (only if in progress)
        if (initialProgress > 0 && initialProgress < 100) {
          initialProgressRef.current = initialProgress
          hasRestoredScroll.current = false
          setIsScrollReady(false) // Keep hidden until scroll is restored
        } else {
          // No scroll restoration needed, show content immediately
          setIsScrollReady(true)
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
      // Calculate the scroll position based on progress percentage
      const scrollPosition = (initialProgressRef.current / 100) * (contentHeight - screenHeight)
      
      // Scroll instantly (not animated) so content appears at correct position
      scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false })
      hasRestoredScroll.current = true
      // Reveal content after scroll position is set
      setIsScrollReady(true)
    }
  }, [])

  // Handle scroll to track reading progress
  const lastLocalSaveProgress = useRef(0)
  const PROGRESS_SAVE_THRESHOLD = 5 // Only save when progress changes by 5%
  
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Ignore scroll events until scroll restoration is complete (if restoration is needed)
    if (initialProgressRef.current !== null && !hasRestoredScroll.current) return
    
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    
    // Track content dimensions for "return to progress" button
    contentHeightRef.current = contentSize.height
    layoutHeightRef.current = layoutMeasurement.height

    // Detect scroll direction for collapsible header
    const currentY = contentOffset.y
    if (currentY > prevScrollY.current + 10 && currentY > 80) {
      setHeaderHidden(true)
    } else if (currentY < prevScrollY.current - 10) {
      setHeaderHidden(false)
    }
    prevScrollY.current = currentY
    
    // Calculate scroll progress (0-100)
    const scrollableHeight = contentSize.height - layoutMeasurement.height
    if (scrollableHeight <= 0) return
    
    const progress = Math.min(100, Math.max(0, Math.round((contentOffset.y / scrollableHeight) * 100)))
    
    // Show/hide "return to progress" button with hysteresis to prevent flicker
    if (!showReturnButton) {
      const shouldShow = progress < readingProgressRef.current - 15 && readingProgressRef.current > 15 && readingProgressRef.current < 100
      if (shouldShow) setShowReturnButton(true)
    } else {
      const shouldHide = progress >= readingProgressRef.current - 5 || readingProgressRef.current >= 100
      if (shouldHide) setShowReturnButton(false)
    }
    
    // Only update if progress increased (don't decrease on scroll up)
    if (progress > readingProgress) {
      setReadingProgress(progress)
      readingProgressRef.current = progress
      progressBarWidth.value = withTiming(progress / 100, { duration: 300 })
      
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
  }, [readingProgress, showReturnButton, session?.user, article])

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

  const deleteArticle = useCallback(() => {
    if (!article || !session?.user) return
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArticleWithSync(session.user.id, article.id)
              router.back()
            } catch (error) {
              Alert.alert('Error', 'Failed to delete article')
            }
          },
        },
      ]
    )
  }, [article, session?.user])

  const markAsUnread = useCallback(async () => {
    if (!article || !session?.user) return
    try {
      await updateArticleWithSync(session.user.id, article.id, { readingProgress: 0 })
      setArticle({ ...article, readingProgress: 0 })
      setReadingProgress(0)
      readingProgressRef.current = 0
      lastSyncedProgress.current = 0
      progressBarWidth.value = withTiming(0, { duration: 300 })
      lastLocalSaveProgress.current = 0
      hasReachedEnd.current = false
    } catch (error) {
      Alert.alert('Error', 'Failed to mark article as unread')
    }
  }, [article, session?.user])

  const markAsRead = useCallback(async () => {
    if (!article || !session?.user) return
    try {
      await updateArticleWithSync(session.user.id, article.id, { readingProgress: 100 })
      setArticle({ ...article, readingProgress: 100 })
      setReadingProgress(100)
      readingProgressRef.current = 100
      lastSyncedProgress.current = 100
      progressBarWidth.value = withTiming(1, { duration: 300 })
      lastLocalSaveProgress.current = 100
      hasReachedEnd.current = true
      setShowReturnButton(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to mark article as read')
    }
  }, [article, session?.user])

  const returnToProgress = useCallback(() => {
    const scrollPosition = (readingProgressRef.current / 100) * (contentHeightRef.current - screenHeight)
    scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true })
    setShowReturnButton(false)
  }, [])

  const moreMenuItems = useMemo((): DropdownMenuItem[] => [
    ...(article?.url ? [{
      key: 'open-original',
      label: 'Open Original',
      icon: 'arrow.up.right.square' as const,
      onPress: () => Linking.openURL(article.url!),
    }] : []),
    {
      key: 'mark-read',
      label: 'Mark as Read',
      icon: 'book.fill' as const,
      onPress: markAsRead,
    },
    {
      key: 'mark-unread',
      label: 'Mark as Unread',
      icon: 'book.closed' as const,
      onPress: markAsUnread,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: 'trash' as const,
      destructive: true,
      onPress: deleteArticle,
    },
  ], [article?.url, markAsRead, markAsUnread, deleteArticle])

  const handleUpdateTags = useCallback(async (tags: string) => {
    if (!article || !session?.user) return
    await updateArticleTagsWithSync(session.user.id, article.id, tags)
    setArticle({ ...article, tags: tags || null })
  }, [article, session?.user])
  
  // Markdown styles for premium reading experience (scaled by fontSize)
  const lineHeight = Math.round(fontSize * 1.56)
  const markdownStyles = useMemo((): MarkdownStyles => ({
    paragraph: {
      color: colors.text,
      fontSize,
      lineHeight,
      marginVertical: 12,
      fontFamily: 'SourceSans3_400Regular',
    },
    heading1: {
      color: colors.text,
      fontSize: fontSize + 14,
      marginBottom: 24,
      marginTop: 48,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading2: {
      color: colors.text,
      fontSize: fontSize + 8,
      marginTop: 32,
      marginBottom: 16,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading3: {
      color: colors.text,
      fontSize: fontSize + 4,
      marginTop: 24,
      marginBottom: 12,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading4: {
      color: colors.text,
      fontSize: fontSize + 1,
      marginTop: 20,
      marginBottom: 8,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading5: {
      color: colors.text,
      fontSize: fontSize - 1,
      marginTop: 16,
      marginBottom: 8,
      fontFamily: 'Bitter_600SemiBold',
    },
    heading6: {
      color: colors.textSecondary,
      fontSize: fontSize - 2,
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
      fontSize,
      lineHeight,
      fontFamily: 'SourceSans3_400Regular',
    },
    list_bullet: {
      color: colors.textSecondary,
      fontSize,
      fontFamily: 'SourceSans3_400Regular',
    },
    code_inline: {
      fontFamily: 'Menlo',
      fontSize: fontSize - 3,
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
      fontSize: fontSize - 4,
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
  }), [colors, fontSize, lineHeight])

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
        <ThemedText fontSize={16} style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading article...
        </ThemedText>
      </View>
    )
  }

  if (!article) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ThemedText fontSize={16} style={{ color: colors.textMuted }}>Article not found</ThemedText>
      </View>
    )
  }

  const markdownContent = article.content || '*No content available*'

  // Calculate reading time from word count
  const readingTime = article.wordCount 
    ? Math.max(1, Math.ceil(article.wordCount / 200))
    : null
  const overlayHeight = insets.top + 56 + 3

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topOverlay}>
        <Header 
          showLogo
          showBack
          hidden={headerHidden}
          rightElement={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                onPress={() => {setShowSettings(true)}}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
              >
                <IconSymbol 
                  name="paintpalette"
                  size={28} 
                  color={theme.colors.text} 
                />
              </Pressable>

              <Pressable
                onPress={toggleFavorite}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
              >
                <IconSymbol 
                  name={article.isFavorite ? 'star.fill' : 'star'} 
                  size={28} 
                  color={article.isFavorite ? '#FFD700' : theme.colors.text} 
                />
              </Pressable>

              <DropdownMenu
                trigger={
                  <View style={{ opacity: 1, padding: 4 }}>
                    <IconSymbol name="ellipsis" size={28} color={theme.colors.text} />
                  </View>
                }
                items={moreMenuItems}
              />
            </View>
          }
        />

        {/* Reading progress bar */}
        <View 
          style={styles.progressBarTrack} 
          onLayout={(e: LayoutChangeEvent) => { progressTrackWidth.value = e.nativeEvent.layout.width }}
        >
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { backgroundColor: colors.accent },
              progressBarStyle,
            ]} 
          />
        </View>
      </View>

      {/* Return to progress button */}
      {showReturnButton && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)}
          style={[styles.returnButtonContainer, {bottom: insets.bottom + 20}]}
        >
          <Pressable 
            onPress={returnToProgress}
            style={[styles.returnButton, { backgroundColor: colors.accent }]}
          >
            <IconSymbol name="chevron.down" size={14} color="#FFFFFF" />
            <ThemedText fontSize={14} style={styles.returnButtonText}>Continue reading</ThemedText>
          </Pressable>
        </Animated.View>
      )}

      <ScrollView 
        ref={scrollViewRef}
        style={[styles.scrollView, { opacity: isScrollReady ? 1 : 0, backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingTop: overlayHeight + 24 }]}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={250}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Header */}
        <View style={[styles.header]}>
          {article.title && (
            <ThemedText 
              fontSize={28}
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
              <ThemedText fontSize={15} style={styles.siteName}>
                {article.siteName || article.author}
                {readingTime && ` • ${readingTime} min read`}
              </ThemedText>
            )}
          </View>
          
          {/* Tags */}
          <TagList
            tags={article.tags}
            onUpdateTags={handleUpdateTags}
          />
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

      {/* Reading settings drawer */}
      <ReadingSettingsDrawer
        visible={showSettings}
        onDismiss={dismissDrawer}
      />

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
  progressBarTrack: {
    height: 3,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  progressBarFill: {
    height: '100%',
  },
  returnButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontFamily: 'SourceSans3_600SemiBold',
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
    marginHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'Bitter_700Bold',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  siteName: {
    fontFamily: 'SourceSans3_500Medium',
    color: 'rgba(120, 120, 120, 0.8)',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 16,
    alignSelf: 'center',
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
