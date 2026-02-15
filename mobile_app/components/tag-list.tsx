import { useState } from 'react'
import { StyleSheet, View, Pressable, Alert, Modal, TextInput, Platform } from 'react-native'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useTheme } from '@react-navigation/native'
import { ThemedText } from './themed-text'
import { IconSymbol } from './ui/icon-symbol'
import { tagToColor } from '@poche/shared'

interface TagListProps {
  /** Comma-separated tags string (or null) */
  tags: string | null | undefined
  /** Called with the full updated comma-separated tags string */
  onUpdateTags: (tags: string) => Promise<void>
  /** Visual size variant */
  size?: 'small' | 'default'
}

export function TagList({ tags, onUpdateTags, size = 'default' }: TagListProps) {
  const theme = useTheme()
  const [showAddTagModal, setShowAddTagModal] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')

  const currentTags = tags
    ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    : []

  const isSmall = size === 'small'
  const fontSize = isSmall ? 12 : 13
  const plusIconSize = isSmall ? 14 : 16

  const handleRemoveTag = (tagToRemove: string) => {
    Alert.alert(
      'Remove Tag',
      `Are you sure you want to remove the tag "${tagToRemove}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedTags = currentTags.filter(tag => tag !== tagToRemove)
              const tagsString = updatedTags.join(',')
              await onUpdateTags(tagsString)
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

  const addTag = async (tag: string) => {
    if (!tag || !tag.trim()) return
    const trimmedTag = tag.trim()

    if (currentTags.includes(trimmedTag)) {
      Alert.alert('Tag already exists', 'This tag is already added to the article.')
      return
    }

    try {
      const updatedTags = [...currentTags, trimmedTag]
      const tagsString = updatedTags.join(',')
      await onUpdateTags(tagsString)
      setNewTagInput('')
      setShowAddTagModal(false)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error adding tag', error.message)
      }
    }
  }

  const handleAddTagPrompt = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Add Tag',
        'Enter a new tag for this article',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (tag: string | undefined) => {
              if (tag) addTag(tag)
            },
          },
        ],
        'plain-text'
      )
    } else {
      setShowAddTagModal(true)
    }
  }

  return (
    <>
      <View style={[styles.container, isSmall && styles.containerSmall]}>
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
                styles.tag,
                isSmall && styles.tagSmall,
                {
                  backgroundColor: tagToColor(tag, 0.2),
                  opacity: pressed ? 0.7 : 1,
                }
              ]}
            >
              <ThemedText style={{ color: tagToColor(tag), fontSize, fontFamily: 'SourceSans3_600SemiBold' }}>
                {tag}
              </ThemedText>
              <ThemedText style={{ color: tagToColor(tag), fontSize, fontFamily: 'SourceSans3_700Bold', opacity: 0.4, marginLeft: 4 }}>
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
              styles.addButton,
              isSmall && styles.addButtonSmall,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <IconSymbol name="plus" size={plusIconSize} color="rgba(120, 120, 120, 0.75)" />
          </Pressable>
        </Animated.View>
      </View>

      {/* Add Tag Modal (Android/Web) */}
      <Modal
        visible={showAddTagModal}
        transparent
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
              autoFocus
              onSubmitEditing={() => addTag(newTagInput)}
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
                onPress={() => addTag(newTagInput)}
                style={[styles.modalButton, styles.modalButtonAdd]}
              >
                <ThemedText style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Add</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  containerSmall: {
    gap: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagSmall: {
    height: 26,
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 120, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonSmall: {
    minWidth: 32,
    height: 26,
    width: 'auto',
    paddingHorizontal: 8,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Bitter_700Bold',
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
    fontFamily: 'SourceSans3_400Regular',
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
    fontFamily: 'SourceSans3_600SemiBold',
  },
})
