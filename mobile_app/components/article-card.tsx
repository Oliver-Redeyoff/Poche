import { StyleSheet, View, Pressable, Alert } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { ThemedText } from './themed-text'
import { useThemeColor } from '@/hooks/use-theme-color'
import Ionicons from '@expo/vector-icons/Ionicons'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'

interface Article {
  id: number
  title?: string | null
  content?: string | null
  url?: string
  siteName?: string | null
  created_time?: string
  created_at?: string
  [key: string]: any
}

interface ArticleCardProps {
  article: Article
  onDelete: (articleId: number) => Promise<void>
  extractFirstImageUrl: (htmlContent: string | null) => string | null
}

export function ArticleCard({
  article,
  onDelete,
  extractFirstImageUrl,
}: ArticleCardProps) {
  const router = useRouter()
  const borderColor = useThemeColor({}, 'icon')
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  const imageUrl = extractFirstImageUrl(article.content || null)

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
          { borderColor, backgroundColor },
          pressed && styles.articleCardPressed,
        ]}
      >
        <View style={styles.articleCardContent}>
          <View style={styles.articleCardText}>
            {article.title && (
              <ThemedText type="defaultSemiBold" style={styles.articleTitle}>
                {article.title}
              </ThemedText>
            )}
            {article.siteName && (
              <ThemedText style={[styles.articleUrl, { color: textColor }]}>
                {article.siteName}
              </ThemedText>
            )}
            {(article.created_at || article.created_time) && (
              <ThemedText style={[styles.articleDate, { color: borderColor }]}>
                {new Date(article.created_at || article.created_time || '').toLocaleDateString()}
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

      {/* Bottom part of article card */}
      <Pressable
        onPress={handleDelete}
        style={styles.menuButton}
      >
        <Ionicons name="trash-outline" size={20} color="red" />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  articleCardWrapper: {
    position: 'relative',
    marginHorizontal: 12,
  },
  articleCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 120, 120, 0.15)',
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
    height: 60,
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
})

