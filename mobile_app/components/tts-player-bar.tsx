import React, { useState } from 'react'
import { View, Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { useThemeColor } from '@/hooks/use-theme-color'
import { IconSymbol } from './ui/icon-symbol'
import { TtsVoicePicker } from './tts-voice-picker'
import { useTtsContext } from '@/contexts/tts-context'

export function TtsPlayerBar() {
  const tts = useTtsContext()
  const accent = useThemeColor({}, 'accent')
  const text = useThemeColor({}, 'text')
  const border = useThemeColor({}, 'border')
  const surface = useThemeColor({}, 'surface')
  const muted = '#8E8E93'

  const [showVoicePicker, setShowVoicePicker] = useState(false)

  const { currentIndex, segments, isPlaying, speed, engine, modelState, voices, selectedVoiceId, articleTitle, articleAuthor, articleThumb } = tts
  const totalSegments = segments.length
  const atStart = currentIndex === 0
  const atEnd = currentIndex >= totalSegments - 1
  const progress = totalSegments > 1 ? currentIndex / (totalSegments - 1) : 0
  const isInstalling = engine === 'sherpa' && modelState === 'installing'

  return (
    <>
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        </View>

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
            {/* Close */}
            <Pressable onPress={tts.close} style={styles.sideBtn} hitSlop={8}>
              <IconSymbol name="xmark" size={16} color={muted} />
            </Pressable>

            {/* Thumbnail */}
            {articleThumb ? (
              <Image source={{ uri: articleThumb }} style={styles.thumbnail} contentFit="cover" />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: surface }]}>
                <IconSymbol name="doc.text" size={18} color={muted} />
              </View>
            )}

            {/* Article info */}
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

            {/* Playback controls */}
            <Pressable
              onPress={tts.skipBack}
              style={[styles.sideBtn, atStart && styles.disabled]}
              hitSlop={8}
              disabled={atStart}
            >
              <IconSymbol name="backward.end.fill" size={20} color={atStart ? muted : text} />
            </Pressable>

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

            <Pressable
              onPress={tts.skipForward}
              style={[styles.sideBtn, atEnd && styles.disabled]}
              hitSlop={8}
              disabled={atEnd}
            >
              <IconSymbol name="forward.end.fill" size={20} color={atEnd ? muted : text} />
            </Pressable>

            <Pressable onPress={tts.cycleSpeed} style={styles.sideBtn} hitSlop={8}>
              <Text style={[styles.speedText, { color: muted }]}>{speed}×</Text>
            </Pressable>
          </View>
        )}
      </View>

      <TtsVoicePicker
        visible={showVoicePicker}
        onDismiss={() => setShowVoicePicker(false)}
        voices={voices}
        selectedVoiceId={selectedVoiceId}
        engine={engine}
        modelState={modelState}
        onSelect={tts.setVoice}
        onSetEngine={tts.setEngine}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: 6,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  disabled: {
    opacity: 0.3,
  },
  speedText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
})
