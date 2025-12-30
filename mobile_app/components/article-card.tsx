import { StyleSheet, View, Pressable, Alert, Modal, TextInput, Platform } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { ThemedText } from './themed-text'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { IconSymbol } from './ui/icon-symbol'
import { Article } from '../shared/types'
import { tagToColor } from '../shared/util'
import { useState } from 'react'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useTheme } from '@react-navigation/native'

interface ArticleCardProps {
  article: Article
  onDelete: (articleId: number) => Promise<void>
  onUpdateTags: (articleId: number, tags: string) => Promise<void>
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
  onUpdateTags,
  extractFirstImageUrl,
}: ArticleCardProps) {
  const router = useRouter()
  const imageUrl = extractFirstImageUrl(article.content || null)
  const readingTime = calculateReadingTime(article.length)
  const [showAddTagModal, setShowAddTagModal] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  const theme = useTheme()

  const currentTags = article.tags 
    ? article.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    : []

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

  const handleRemoveTag = (tagToRemove: string) => {
    Alert.alert(
      'Remove Tag',
      `Are you sure you want to remove the tag "${tagToRemove}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedTags = currentTags.filter(tag => tag !== tagToRemove)
              const tagsString = updatedTags.length > 0 ? updatedTags.join(',') : null
              await onUpdateTags(article.id, tagsString || '')
            } catch (error) {
              if (error instanceof Error) {
                Alert.alert('Error removing tag', error.message)
              }
            }
          },
        },
      ]
    )
  }

  const handleAddTagPrompt = () => {
    if (Platform.OS === 'ios') {
      // Use native prompt on iOS
      Alert.prompt(
        'Add Tag',
        'Enter a new tag for this article',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add',
            onPress: async (tag: string | undefined) => {
              if (!tag || !tag.trim()) {
                return
              }
              await addTag(tag.trim())
            },
          },
        ],
        'plain-text'
      )
    } else {
      // Use modal on Android and other platforms
      setShowAddTagModal(true)
    }
  }

  const addTag = async (tag: string) => {
    if (!tag || !tag.trim()) {
      return
    }
    const trimmedTag = tag.trim()
    
    // Check if tag already exists
    if (currentTags.includes(trimmedTag)) {
      Alert.alert('Tag already exists', 'This tag is already added to the article.')
      return
    }

    try {
      const updatedTags = [...currentTags, trimmedTag]
      const tagsString = updatedTags.join(',')
      await onUpdateTags(article.id, tagsString)
      setNewTagInput('')
      setShowAddTagModal(false)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error adding tag', error.message)
      }
    }
  }

  const handleModalAdd = () => {
    addTag(newTagInput)
  }

  return (
    <Animated.View
      style={[styles.articleCardWrapper, { backgroundColor: theme.colors.card }]}
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

          {imageUrl && (
            <Image
              source={{ uri: imageUrl ?? "" }}
              style={styles.articleImage}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          )}
        </View>
      </Pressable>

      {/* Bottom part of article card - tags and actions (outside main pressable) */}
      <View style={styles.articleCardBottom}>
        <View style={styles.articleTagList}>
          {currentTags.map((tag) => (
            <Animated.View
              key={tag}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              layout={LinearTransition.duration(200)}
            >
              <Pressable
                onPress={() => handleRemoveTag(tag)}
                style={({ pressed }) => [
                  styles.articleTag,
                  { 
                    backgroundColor: tagToColor(tag, 0.2), 
                    opacity: pressed ? 0.7 : 1,
                  }
                ]}
              >
                <ThemedText style={{ color: tagToColor(tag), fontSize: 12, fontWeight: '600' }}>
                  {tag}
                </ThemedText>
                <ThemedText style={{ color: tagToColor(tag), fontSize: 12, fontWeight: '700', opacity: 0.4, marginLeft: 4 }}>
                  ×
                </ThemedText>
              </Pressable>
            </Animated.View>
          ))}

          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition.duration(200)}
          >
            <Pressable
              onPress={handleAddTagPrompt}
              style={({ pressed }) => [
                styles.addTagButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <IconSymbol name="plus" size={16} color="rgba(120, 120, 120, 0.75)" />
            </Pressable>
          </Animated.View>
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

      {/* Add Tag Modal for Android/Web */}
      <Modal
        visible={showAddTagModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAddTagModal(false)
          setNewTagInput('')
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <ThemedText style={styles.modalTitle}>Add Tag</ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: theme.colors.text }]}>
              Enter a new tag for this article
            </ThemedText>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
              value={newTagInput}
              onChangeText={setNewTagInput}
              placeholder="Tag name"
              placeholderTextColor={theme.colors.border}
              autoFocus={true}
              onSubmitEditing={handleModalAdd}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  setShowAddTagModal(false)
                  setNewTagInput('')
                }}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleModalAdd}
                style={[styles.modalButton, styles.modalButtonAdd]}
              >
                <ThemedText style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Add</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  articleCardWrapper: {
    padding: 12,
    borderRadius: 18,
    boxShadow: '0px 8px 24px rgba(120, 120, 120, 0.05)',
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
    fontSize: 16,
    fontWeight: '700',
  },
  articleUrlAndDate: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '500',
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
    alignItems: 'center',
    width: '100%',
  },
  articleTagList: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 4,
  },
  articleTag: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  addTagButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 120, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    height: 26,
  },
  articleIconList: {
    display: 'flex',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(120, 120, 120, 0.1)',
  },
  modalButtonAdd: {
    backgroundColor: 'rgba(239, 64, 86, 0.8)',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

