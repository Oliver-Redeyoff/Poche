import React, { useCallback, useEffect, useRef } from 'react'
import { View, Pressable, StyleSheet, Text, ActivityIndicator, Animated } from 'react-native'
import { Image } from 'expo-image'
import { router, usePathname } from 'expo-router'
import { useThemeColor } from '@/hooks/use-theme-color'
import { IconSymbol } from './ui/icon-symbol'
import { useTtsContext } from '@/contexts/tts-context'

// Two-semicircle circular progress bar (no SVG required).
//
// Each half uses a solid D-shaped fill inside a rotating Animated.View whose
// center coincides with the full circle's center.  A clip container (overflow
// hidden) limits visibility to one half.  A center hole drawn on top creates
// the ring (donut) appearance.
//
// Right half: Animated.View left=-half → center at x=0 in the right clip
//   container (= circle center).  At -180° the D is on the left (hidden);
//   at 0° it occupies the full right clip → 50% filled.
// Left half:  Animated.View left=0  → center at x=half in the left clip
//   container (= circle center).  Same rotation range, independent phase.
//
// Fill direction: clockwise from 12 o'clock.
function CircularProgress({
  progress,
  animationDuration,
  size = 26,
  strokeWidth = 3,
  color,
  trackColor,
  holeColor,
}: {
  progress: number
  animationDuration: number
  size?: number
  strokeWidth?: number
  color: string
  trackColor: string
  holeColor: string
}) {
  const animatedProgressRef = useRef(new Animated.Value(0))

  useEffect(() => {
    animatedProgressRef.current.stopAnimation()
    Animated.timing(animatedProgressRef.current, {
      toValue: progress,
      duration: animationDuration,
      useNativeDriver: false,
    }).start()
  }, [progress, animationDuration])

  const half = size / 2
  const holeSize = size - strokeWidth * 2

  const rightRotation = animatedProgressRef.current.interpolate({
    inputRange: [0, 0.5],
    outputRange: ['-180deg', '0deg'],
    extrapolate: 'clamp',
  })

  const leftRotation = animatedProgressRef.current.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['-180deg', '0deg'],
    extrapolate: 'clamp',
  })

  return (
    <View style={{ width: size, height: size }}>
      {/* Track: solid circle in track color (unfilled ring background) */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: half, backgroundColor: trackColor,
      }} />

      {/* Right half fill — progress 0→50%
          Clip to right half. AV is full-size with left=-half so its center
          sits at x=0 (right-clip origin) = the full circle's center. */}
      <View style={{
        position: 'absolute', top: 0, left: half,
        width: half, height: size, overflow: 'hidden',
      }}>
        <Animated.View style={{
          position: 'absolute', top: 0, left: -half,
          width: size, height: size,
          transform: [{ rotate: rightRotation }],
        }}>
          {/* Right D-shape: solid accent semicircle filling the right half of the AV */}
          <View style={{
            position: 'absolute', top: 0, left: half,
            width: half, height: size,
            borderTopRightRadius: half, borderBottomRightRadius: half,
            backgroundColor: color,
          }} />
        </Animated.View>
      </View>

      {/* Left half fill — progress 50→100%
          Clip to left half. AV is full-size with left=0 so its center sits
          at x=half (right edge of left-clip) = the full circle's center. */}
      <View style={{
        position: 'absolute', top: 0, left: 0,
        width: half, height: size, overflow: 'hidden',
      }}>
        <Animated.View style={{
          position: 'absolute', top: 0, left: 0,
          width: size, height: size,
          transform: [{ rotate: leftRotation }],
        }}>
          {/* Left D-shape: solid accent semicircle filling the left half of the AV */}
          <View style={{
            position: 'absolute', top: 0, left: 0,
            width: half, height: size,
            borderTopLeftRadius: half, borderBottomLeftRadius: half,
            backgroundColor: color,
          }} />
        </Animated.View>
      </View>

      {/* Center hole — creates the ring (donut) appearance */}
      <View style={{
        position: 'absolute',
        top: strokeWidth, left: strokeWidth,
        width: holeSize, height: holeSize,
        borderRadius: holeSize / 2,
        backgroundColor: holeColor,
      }} />
    </View>
  )
}

export function TtsPlayerBar() {
  const tts = useTtsContext()
  const accent = useThemeColor({}, 'accent')
  const text = useThemeColor({}, 'text')
  const surface = useThemeColor({}, 'surface')
  const background = useThemeColor({}, 'background')
  const muted = '#8E8E93'

  const pathname = usePathname()

  const { isPlaying, isGenerating, generationProgress, speed, modelState, article } = tts
  const articleId = article?.id ?? null
  const articleTitle = article?.title ?? null
  const articleAuthor = article?.siteName || article?.author || null
  const articleThumb = article?.previewImageUrl || null

  const isInstalling = modelState === 'installing'

  const navigateToArticle = useCallback(() => {
    if (articleId != null && pathname !== `/article/${articleId}`) {
      router.push(`/article/${articleId}`)
    }
  }, [articleId, pathname])

  const generatingAnim = useRef(new Animated.Value(isGenerating ? 1 : 0))
  useEffect(() => {
    Animated.timing(generatingAnim.current, {
      toValue: isGenerating ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [isGenerating])

  const articleInfo = (
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
  )

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
      ) : (
        <View style={styles.row}>
          {articleInfo}
          <View style={styles.playBtnSlot}>
            <Animated.View
              style={{ opacity: generatingAnim.current }}
              pointerEvents={isGenerating ? 'auto' : 'none'}
            >
              <CircularProgress
                progress={generationProgress + 1/4}
                animationDuration={1500}
                color={accent}
                trackColor={surface}
                holeColor={background}
              />
            </Animated.View>
            <Animated.View
              style={[StyleSheet.absoluteFill, {
                opacity: generatingAnim.current.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                alignItems: 'center',
                justifyContent: 'center',
              }]}
              pointerEvents={isGenerating ? 'none' : 'auto'}
            >
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
            </Animated.View>
          </View>
          <Pressable onPress={tts.cycleSpeed} style={styles.sideBtn} hitSlop={8}>
            <Text style={[styles.speedText, { color: muted, backgroundColor: surface }]}>{speed}×</Text>
          </Pressable>
          <Pressable onPress={tts.close} style={styles.sideBtn} hitSlop={8}>
            <IconSymbol name="xmark" size={16} color={muted} />
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
  playBtnSlot: {
    width: 34,
    height: 34,
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
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
    paddingVertical: 6,
    borderRadius: 5,
  },
})
