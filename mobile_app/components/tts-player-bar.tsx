import React, { useState, useEffect, useRef } from 'react'
import { View, Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { router, usePathname } from 'expo-router'
import { useThemeColor } from '@/hooks/use-theme-color'
import { IconSymbol } from './ui/icon-symbol'
import { useTtsContext } from '@/contexts/tts-context'

export function TtsPlayerBar() {
  const tts = useTtsContext()
  const accent = useThemeColor({}, 'accent')
  const text = useThemeColor({}, 'text')
  const surface = useThemeColor({}, 'surface')
  const muted = '#8E8E93'

  const pathname = usePathname()

  const { isPlaying, isGenerating, generationProgress, speed, modelState, article } = tts
  const articleId = article?.id ?? null
  const articleTitle = article?.title ?? null
  const articleAuthor = article?.siteName || article?.author || null
  const articleThumb = article?.previewImageUrl || null

  // Generation elapsed time + estimate
  const [elapsedSec, setElapsedSec] = useState(0)
  const genStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isGenerating) {
      genStartRef.current = null
      setElapsedSec(0)
      return
    }
    genStartRef.current = Date.now()
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - genStartRef.current!) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [isGenerating])

  const estimatedTotal = generationProgress > 0.05 ? Math.round(elapsedSec / generationProgress) : null
  const remaining = estimatedTotal != null ? Math.max(0, estimatedTotal - elapsedSec) : null
  const remainingLabel = remaining == null ? 'Generating audio…'
    : remaining <= 3 ? 'Almost ready…'
    : `~${remaining}s remaining`

  const isInstalling = modelState === 'installing'

  const navigateToArticle = () => {
    if (articleId != null && pathname !== `/article/${articleId}`) {
      router.push(`/article/${articleId}`)
    }
  }

  if (!tts.isActive) return null

  return (
    <View style={styles.container}>
      {isInstalling ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={[styles.title, { color: text }]}>Preparing neural voice…</Text>
          <Pressable onPress={tts.close} hitSlop={8}>
            <IconSymbol name="xmark" size={16} color={muted} />
          </Pressable>
        </View>
      ) : isGenerating ? (
        <View style={styles.row}>
          {/* Close */}
          <Pressable onPress={tts.close} style={styles.sideBtn} hitSlop={8}>
            <IconSymbol name="xmark" size={16} color={muted} />
          </Pressable>

          {/* Article info — tappable */}
          <Pressable
            style={[styles.articleInfo, ({ pressed }) => pressed && { opacity: 0.7 }]}
            onPress={navigateToArticle}
          >
            {articleThumb ? (
              <Image source={{ uri: articleThumb }} style={styles.thumbnail} contentFit="cover" />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: surface }]}>
                <IconSymbol name="doc.text" size={18} color={muted} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={[styles.title, { color: text }]} numberOfLines={1}>
                {articleTitle ?? 'Article'}
              </Text>
              {articleAuthor ? (
                <Text style={[styles.author, { color: muted }]} numberOfLines={1}>
                  {articleAuthor}
                </Text>
              ) : null}
            </View>
          </Pressable>

          {/* Generating status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ActivityIndicator size="small" color={accent} />
            <Text style={[styles.author, { color: muted }]}>{remainingLabel}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          {/* Close */}
          <Pressable onPress={tts.close} style={styles.sideBtn} hitSlop={8}>
            <IconSymbol name="xmark" size={16} color={muted} />
          </Pressable>

          {/* Thumbnail + info — tappable, navigates to article */}
          <Pressable
            style={[styles.articleInfo, ({ pressed }) => pressed && { opacity: 0.7 }]}
            onPress={navigateToArticle}
          >
            {articleThumb ? (
              <Image source={{ uri: articleThumb }} style={styles.thumbnail} contentFit="cover" />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: surface }]}>
                <IconSymbol name="doc.text" size={18} color={muted} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={[styles.title, { color: text }]} numberOfLines={1}>
                {articleTitle ?? 'Article'}
              </Text>
              {articleAuthor ? (
                <Text style={[styles.author, { color: muted }]} numberOfLines={1}>
                  {articleAuthor}
                </Text>
              ) : null}
            </View>
          </Pressable>

          {/* Playback controls */}
          <Pressable
            onPress={isPlaying ? tts.pause : tts.resume}
            style={[styles.playBtn, { backgroundColor: accent }]}
            hitSlop={4}
          >
            <IconSymbol
              name={isPlaying ? 'pause.fill' : 'play.fill'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>

          <Pressable onPress={tts.cycleSpeed} style={styles.sideBtn} hitSlop={8}>
            <Text style={[styles.speedText, { color: muted }]}>{speed}×</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  articleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: 6,
    flexShrink: 0,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SourceSans3_600SemiBold',
  },
  author: {
    fontSize: 12,
    fontFamily: 'SourceSans3_400Regular',
  },
  sideBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
})
