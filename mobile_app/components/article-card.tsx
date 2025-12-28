import { StyleSheet, View, Pressable, Alert } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { ThemedText } from './themed-text'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { IconSymbol } from './ui/icon-symbol'

interface Article {
  id: number
  title?: string | null
  content?: string | null
  url?: string
  siteName?: string | null
  created_time: string
  length?: number | null
  tags?: string | null
}

interface ArticleCardProps {
  article: Article
  onDelete: (articleId: number) => Promise<void>
  extractFirstImageUrl: (htmlContent: string | null) => string | null
}

// Calculate reading time in minutes based on character count
// Average reading speed is ~1000 characters per minute
function calculateReadingTime(length: number | null | undefined): string {
  if (!length || length === 0) {
    return '1 min read'
  }
  
  // Calculate minutes (round up to nearest minute)
  const minutes = Math.ceil(length / 1000)
  
  if (minutes === 1) {
    return '1 min read'
  } else {
    return `${minutes} min read`
  }
}

export function ArticleCard({
  article,
  onDelete,
  extractFirstImageUrl,
}: ArticleCardProps) {
  const router = useRouter()
  const imageUrl = extractFirstImageUrl(article.content || null)
  const readingTime = calculateReadingTime(article.length)

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

  return (
    <Animated.View
      style={styles.articleCardWrapper}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.duration(200)}
    >
      {/* Top part of article card */}
      <Pressable
        onPress={() => router.push(`/article/${article.id}`)}
        style={({ pressed }) => [
          styles.articleCard,
          pressed && styles.articleCardPressed,
        ]}
      >
        <View style={styles.articleCardTop}>
          <View style={styles.articleCardText}>
            {article.title && (
              <ThemedText style={styles.articleTitle}>
                {article.title}
              </ThemedText>
            )}
            {article.siteName && (
              <ThemedText style={styles.articleUrlAndDate}>
                {article.siteName} • {readingTime}
              </ThemedText>
            )}
          </View>

          <Image
            source={{ uri: imageUrl ?? "" }}
            style={styles.articleImage}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
        </View>

        {/* Bottom part of article card */}
        <View style={styles.articleCardBottom}>
          <View style={styles.articleTagList}>
            {article.tags?.split(',').map((tag) => (
              <ThemedText key={tag} style={styles.articleTag}>{tag}</ThemedText>
            ))}
          </View>

          {/* Icon list */}
          <View style={styles.articleIconList}>
            <Pressable
              onPress={handleDelete}
            >
              <IconSymbol name="trash" size={20} color="rgba(120, 120, 120, 0.75)" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  articleCardWrapper: {
    position: 'relative',
    marginHorizontal: 12,
    borderBottomColor: 'rgba(120, 120, 120, 0.2)',
    borderBottomWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
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
  },
  articleCardText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  articleUrlAndDate: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(120, 120, 120, 0.75)',
  },
  articleImage: {
    width: 100,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  articleCardBottom: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  articleTagList: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
  },
  articleTag: {
    fontSize: 12,
    color: 'rgba(120, 120, 120, 0.75)',
    backgroundColor: 'rgba(120, 120, 120, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  articleIconList: {
    display: 'flex',
  },
})

