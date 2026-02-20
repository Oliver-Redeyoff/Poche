import {StyleSheet, View, Pressable, Alert, Linking, StyleProp, ViewStyle} from 'react-native'
import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { ThemedText } from './themed-text'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { IconSymbol } from './ui/icon-symbol'
import { TagList } from './tag-list'
import { DropdownMenu, DropdownMenuItem } from './dropdown-menu'
import { Article } from '@poche/shared'
import { extractFirstImageUrl } from '../lib/image-cache'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useTheme } from '@react-navigation/native'

interface ArticleCardProps {
  style?: StyleProp<ViewStyle>
  article: Article
  onDelete: (articleId: number) => Promise<void>
  onUpdateTags: (articleId: number, tags: string) => Promise<void>
  onToggleFavorite?: (articleId: number) => Promise<void>
  onMarkAsRead?: (articleId: number) => Promise<void>
  onMarkAsUnread?: (articleId: number) => Promise<void>
  showProgress?: boolean // Show reading progress bar
  variant?: 'default' | 'tile' // Layout variant
}

// Calculate reading time in minutes based on word count
// Average reading speed is ~200 words per minute
function calculateReadingTime(wordCount: number | null | undefined): string {
  if (!wordCount || wordCount === 0) {
    return '1 min read'
  }
  
  // Calculate minutes (round up to nearest minute)
  const minutes = Math.ceil(wordCount / 200)
  
  if (minutes === 1) {
    return '1 min read'
  } else {
    return `${minutes} min read`
  }
}

export function ArticleCard({
  style,
  article,
  onDelete,
  onUpdateTags,
  onToggleFavorite,
  onMarkAsRead,
  onMarkAsUnread,
  showProgress = false,
  variant = 'default',
}: ArticleCardProps) {
  const router = useRouter()
  const imageUrl = extractFirstImageUrl(article.content || null)
  const readingTime = calculateReadingTime(article.wordCount)
  const theme = useTheme()
  const tintColor = useThemeColor({}, 'tint')
  const isTile = variant === 'tile'
  const faviconUrl = article.faviconLocalPath
  const [hasFaviconError, setHasFaviconError] = useState(false)

  useEffect(() => {
    setHasFaviconError(false)
  }, [faviconUrl])
  
  // Calculate remaining reading time based on progress
  const readingProgress = article.readingProgress || 0
  const remainingTime = readingProgress > 0 && article.wordCount
    ? Math.max(1, Math.ceil((article.wordCount * (100 - readingProgress) / 100) / 200))
    : null

  const handleDelete = () => {
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
              // Call the delete callback
              await onDelete(article.id)
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

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(article.id)
    }
  }

  const handleCardPress = () => {
    router.push(`/article/${article.id}`)
  }

  const dropdownItems: DropdownMenuItem[] = [
    ...(article.url ? [{
      key: 'open-original',
      label: 'Open Original',
      icon: 'arrow.up.right.square' as const,
      onPress: () => Linking.openURL(article.url!),
    }] : []),
    ...(onMarkAsRead ? [{
      key: 'mark-read',
      label: 'Mark as Read',
      icon: 'book.fill' as const,
      onPress: () => onMarkAsRead(article.id),
    }] : []),
    ...(onMarkAsUnread ? [{
      key: 'mark-unread',
      label: 'Mark as Unread',
      icon: 'book.closed' as const,
      onPress: () => onMarkAsUnread(article.id),
    }] : []),
    {
      key: 'delete',
      label: 'Delete',
      icon: 'trash' as const,
      destructive: true,
      onPress: handleDelete,
    },
  ]

  // Tile variant - compact card for Continue Reading section
  if (isTile) {
    return (
      <Animated.View
        style={[style]}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        layout={LinearTransition.duration(200)}
      >
        <DropdownMenu
          openOnLongPress
          items={dropdownItems}
          trigger={
            <Pressable
              onPress={handleCardPress}
              style={({ pressed }) => [
                styles.tileCard,
                { backgroundColor: theme.colors.card },
                pressed && styles.tileCardPressed,
              ]}
            >
              <View>
                {/* Image section */}
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.tileImage}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                  />
                ) : (
                  <View
                    style={[
                      styles.tileImage,
                      styles.tilePlaceholder,
                      faviconUrl ? { backgroundColor: article.faviconBackgroundColor || '#ECECEC' } : null,
                    ]}
                  >
                    {faviconUrl && !hasFaviconError ? (
                      <Image
                        source={{ uri: faviconUrl }}
                        style={styles.tileFavicon}
                        contentFit="contain"
                        transition={150}
                        onError={() => setHasFaviconError(true)}
                      />
                    ) : (
                      <IconSymbol name="doc.text" size={32} color="rgba(120, 120, 120, 0.3)" />
                    )}
                  </View>
                )}

                {/* Content section */}
                <View style={styles.tileContent}>
                  {article.title && (
                    <ThemedText fontSize={15} style={styles.tileTitle} numberOfLines={2}>
                      {article.title}
                    </ThemedText>
                  )}
                  <View style={styles.tileFooter}>
                    <ThemedText fontSize={13} style={styles.tileMeta} numberOfLines={1}>
                      {article.siteName || 'Article'} • {remainingTime ? `${remainingTime} min left` : readingTime}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.tileProgressContainer}>
                <View style={[styles.tileProgressBar]}>
                  <View
                      style={[
                        styles.tileProgressFill,
                        { width: `${readingProgress}%`, backgroundColor: tintColor }
                      ]}
                  />
                </View>
              </View>
            </Pressable>
          }
        />
      </Animated.View>
    )
  }

  // Default variant
  return (
    <Animated.View
      style={[styles.articleCardWrapper, { backgroundColor: theme.colors.card }]}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.duration(200)}
    >
      <View style={[styles.articleCardWrapperInner]}>
        {/* Top part of article card */}
        <DropdownMenu
          openOnLongPress
          items={dropdownItems}
          trigger={
            <Pressable
              onPress={handleCardPress}
              style={({ pressed }) => [
                styles.articleCard,
                pressed && styles.articleCardPressed,
              ]}
            >
              <View style={styles.articleCardTop}>
                <View style={styles.articleCardText}>
                  {article.title && (
                    <ThemedText fontSize={16} style={styles.articleTitle} numberOfLines={2}>
                      {article.title}
                    </ThemedText>
                  )}
                  {article.siteName && (
                    <ThemedText fontSize={14} style={styles.articleUrlAndDate}>
                      {article.siteName} • {showProgress && remainingTime
                        ? `${remainingTime} min left`
                        : readingTime}
                    </ThemedText>
                  )}
                </View>

                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl ?? "" }}
                    style={styles.articleImage}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                  />
                ) : (
                  <View
                    style={[
                      styles.articleImage,
                      styles.articleImagePlaceholder,
                      faviconUrl ? { backgroundColor: article.faviconBackgroundColor || '#ECECEC' } : null,
                    ]}
                  >
                    {faviconUrl && !hasFaviconError ? (
                      <Image
                        source={{ uri: faviconUrl }}
                        style={styles.articleFavicon}
                        contentFit="contain"
                        transition={150}
                        onError={() => setHasFaviconError(true)}
                      />
                    ) : (
                      <IconSymbol name="doc.text" size={22} color="rgba(120, 120, 120, 0.3)" />
                    )}
                  </View>
                )}
              </View>
            </Pressable>
          }
        />

        {/* Bottom part of article card - tags and actions (outside main pressable) */}
        <View style={styles.articleCardBottom}>
          <View style={styles.articleTagList}>
            <TagList
              tags={article.tags}
              onUpdateTags={(tags) => onUpdateTags(article.id, tags)}
              size="small"
            />
          </View>

          {/* Icon list */}
          <View style={styles.articleIconList}>
            {onToggleFavorite && (
              <Pressable
                onPress={handleToggleFavorite}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <IconSymbol
                  name={article.isFavorite ? 'star.fill' : 'star'}
                  size={20}
                  color={article.isFavorite ? '#FFD700' : 'rgba(120, 120, 120, 0.75)'}
                />
              </Pressable>
            )}
            <DropdownMenu
              trigger={
                <View style={{ padding: 2 }}>
                  <IconSymbol name="ellipsis" size={20} color="rgba(120, 120, 120, 0.75)" />
                </View>
              }
              items={dropdownItems}
            />
          </View>
        </View>

      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar]}>
          <View
              style={[
                styles.progressFill,
                { width: `${readingProgress}%`, backgroundColor: tintColor }
              ]}
          />
        </View>
      </View>

    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // Tile variant styles
  tileCard: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tileCardPressed: {
    opacity: 0.8,
  },
  tileImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  tilePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileFavicon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  tileContent: {
    padding: 12,
    gap: 8,
  },
  tileTitle: {
    fontFamily: 'Bitter_600SemiBold',
    lineHeight: 20,
  },
  tileFooter: {
    gap: 6,
  },
  tileMeta: {
    fontFamily: 'SourceSans3_500Medium',
    color: 'rgba(120, 120, 120, 0.75)',
  },
  tileProgressContainer: {
    width: '100%',
  },
  tileProgressBar: {
    flex: 1,
    height: 4,
    overflow: 'hidden',
  },
  tileProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Default variant styles
  articleCardWrapper: {
    borderRadius: 12,
    boxShadow: '0px 8px 24px rgba(120, 120, 120, 0.05)',
    overflow: "hidden"
  },
  articleCardWrapperInner: {
    padding: 12,
  },
  articleCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  articleCardPressed: {
    opacity: 0.7,
  },
  articleCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  articleCardText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: 8,
  },
  articleTitle: {
    fontFamily: 'Bitter_700Bold',
  },
  progressContainer: {
    width: '100%',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  articleUrlAndDate: {
    marginBottom: 4,
    fontFamily: 'SourceSans3_500Medium',
    color: 'rgba(120, 120, 120, 0.75)',
  },
  articleImage: {
    width: 100,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  articleImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleFavicon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  articleCardBottom: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  articleTagList: {
    flexGrow: 1,
  },
  articleIconList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
})
