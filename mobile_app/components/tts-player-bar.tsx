import React, { useState } from 'react'
import { View, Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@react-navigation/native'
import { Voice } from 'expo-speech'
import { IconSymbol } from './ui/icon-symbol'
import { TtsVoicePicker } from './tts-voice-picker'
import type { TtsSpeed, TtsEngine, ModelState } from '../hooks/use-tts'

interface TtsPlayerBarProps {
  isPlaying: boolean
  currentIndex: number
  totalSegments: number
  speed: TtsSpeed
  voices: Voice[]
  selectedVoiceId: string | null
  engine: TtsEngine
  modelState: ModelState
  onPlay: () => void
  onPause: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onCycleSpeed: () => void
  onSetVoice: (id: string | null) => void
  onSetEngine: (engine: TtsEngine) => void
  onClose: () => void
}

export function TtsPlayerBar({
  isPlaying,
  currentIndex,
  totalSegments,
  speed,
  voices,
  selectedVoiceId,
  engine,
  modelState,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
  onCycleSpeed,
  onSetVoice,
  onSetEngine,
  onClose,
}: TtsPlayerBarProps) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const isDark = theme.dark
  const accent = theme.colors.primary
  const bg = isDark ? '#1C1C1E' : '#F2F2F7'
  const border = isDark ? '#38383A' : '#D1D1D6'
  const text = theme.colors.text
  const muted = isDark ? '#8E8E93' : '#8E8E93'

  const [showVoicePicker, setShowVoicePicker] = useState(false)

  const progress = totalSegments > 0 ? currentIndex / totalSegments : 0

  const progressStyle = useAnimatedStyle(() => ({
    width: `${withTiming(progress * 100, { duration: 300 })}%` as any,
  }))

  const atStart = currentIndex === 0
  const atEnd = currentIndex >= totalSegments - 1

  const selectedVoiceName = voices.find(v => v.identifier === selectedVoiceId)?.name ?? 'Default'
  const isInstalling = engine === 'sherpa' && modelState === 'installing'

  return (
    <>
      <View style={[styles.container, { backgroundColor: bg, borderTopColor: border, paddingBottom: insets.bottom }]}>
        {isInstalling ? (
          /* Installing state — auto-installs from bundle, just show a spinner */
          <View style={styles.installingRow}>
            <ActivityIndicator size="small" color={accent} />
            <Text style={[styles.installingText, { color: text }]}>Preparing neural voice…</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <IconSymbol name="xmark" size={16} color={muted} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.controls}>
              <Pressable onPress={onClose} style={styles.btn} hitSlop={8}>
                <IconSymbol name="xmark" size={18} color={muted} />
              </Pressable>

              <Pressable
                onPress={onSkipBack}
                style={[styles.btn, atStart && styles.disabled]}
                hitSlop={8}
                disabled={atStart}
              >
                <IconSymbol name="backward.end.fill" size={22} color={atStart ? muted : text} />
              </Pressable>

              <Pressable
                onPress={isPlaying ? onPause : onPlay}
                style={[styles.btn, styles.playBtn, { backgroundColor: accent }]}
                hitSlop={4}
              >
                <IconSymbol
                  name={isPlaying ? 'pause.fill' : 'play.fill'}
                  size={22}
                  color="#FFFFFF"
                />
              </Pressable>

              <Pressable
                onPress={onSkipForward}
                style={[styles.btn, atEnd && styles.disabled]}
                hitSlop={8}
                disabled={atEnd}
              >
                <IconSymbol name="forward.end.fill" size={22} color={atEnd ? muted : text} />
              </Pressable>

              <Pressable onPress={onCycleSpeed} style={styles.btn} hitSlop={8}>
                <Text style={[styles.speedText, { color: text }]}>{speed}×</Text>
              </Pressable>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: border }]}>
              <Animated.View style={[styles.progressFill, { backgroundColor: accent }, progressStyle]} />
            </View>

            <Pressable
              onPress={() => setShowVoicePicker(true)}
              style={({ pressed }) => [styles.voiceRow, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={4}
            >
              <Text style={[styles.voiceLabel, { color: muted }]}>Voice  </Text>
              <Text style={[styles.voiceName, { color: text }]} numberOfLines={1}>
                {engine === 'sherpa' ? 'Neural (Sherpa)' : selectedVoiceName}
              </Text>
              <IconSymbol name="chevron.right" size={14} color={muted} style={{ marginLeft: 2 }} />
            </Pressable>
          </>
        )}
      </View>

      <TtsVoicePicker
        visible={showVoicePicker}
        onDismiss={() => setShowVoicePicker(false)}
        voices={voices}
        selectedVoiceId={selectedVoiceId}
        engine={engine}
        modelState={modelState}
        onSelect={onSetVoice}
        onSetEngine={onSetEngine}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  btn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  disabled: {
    opacity: 0.3,
  },
  speedText: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  voiceLabel: {
    fontSize: 13,
  },
  voiceName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  installingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  installingText: {
    flex: 1,
    fontSize: 15,
  },
  closeBtn: {
    padding: 4,
  },
})
