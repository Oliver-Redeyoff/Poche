import React, { useMemo, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native'
import { Voice, VoiceQuality } from 'expo-speech'
import { BottomDrawer } from './bottom-drawer'
import { useTheme } from '@react-navigation/native'
import { IconSymbol } from './ui/icon-symbol'
import type { TtsEngine, ModelState } from '../hooks/use-tts'

interface TtsVoicePickerProps {
  visible: boolean
  onDismiss: () => void
  voices: Voice[]
  selectedVoiceId: string | null
  engine: TtsEngine
  modelState: ModelState
  onSelect: (id: string | null) => void
  onSetEngine: (engine: TtsEngine) => void
}

function qualityLabel(quality: VoiceQuality): string | null {
  return quality === VoiceQuality.Enhanced ? 'Enhanced' : null
}

function qualityRank(quality: VoiceQuality): number {
  return quality === VoiceQuality.Enhanced ? 1 : 0
}

export function TtsVoicePicker({
  visible,
  onDismiss,
  voices,
  selectedVoiceId,
  engine,
  modelState,
  onSelect,
  onSetEngine,
}: TtsVoicePickerProps) {
  const theme = useTheme()
  const isDark = theme.dark
  const accent = theme.colors.primary
  const text = theme.colors.text
  const muted = isDark ? '#8E8E93' : '#8E8E93'
  const inputBg = isDark ? '#2C2C2E' : '#EBEBEB'
  const separator = isDark ? '#38383A' : '#E5E5EA'
  const sectionBg = isDark ? '#2C2C2E' : '#F2F2F7'

  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? voices.filter(v => v.name.toLowerCase().includes(q) || v.language.toLowerCase().includes(q))
      : voices
    return [...list].sort((a, b) => {
      const qDiff = qualityRank(b.quality) - qualityRank(a.quality)
      if (qDiff !== 0) return qDiff
      return a.name.localeCompare(b.name)
    })
  }, [voices, query])

  function handleSelect(id: string | null) {
    onSelect(id)
  }

  function handleSetEngine(e: TtsEngine) {
    onSetEngine(e)
  }

  function sherpaStatusLabel(): string {
    if (modelState === 'ready') return 'Installed'
    if (modelState === 'installing') return 'Installing…'
    return 'Bundled • installs on first use'
  }

  return (
    <BottomDrawer visible={visible} onDismiss={onDismiss}>
      <Text style={[styles.title, { color: text }]}>Voice</Text>

      {/* Engine section */}
      <Text style={[styles.sectionLabel, { color: muted }]}>ENGINE</Text>
      <View style={[styles.engineSection, { backgroundColor: sectionBg, borderColor: separator }]}>
        {/* Sherpa row */}
        <Pressable
          onPress={() => handleSetEngine('sherpa')}
          style={({ pressed }) => [
            styles.engineRow,
            { borderBottomColor: separator, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={styles.engineRadio}>
            <View style={[styles.radioOuter, { borderColor: engine === 'sherpa' ? accent : muted }]}>
              {engine === 'sherpa' && <View style={[styles.radioInner, { backgroundColor: accent }]} />}
            </View>
          </View>
          <View style={styles.engineInfo}>
            <Text style={[styles.engineName, { color: text }]}>Neural (Sherpa)</Text>
            <Text style={[styles.engineDesc, { color: muted }]}>
              {sherpaStatusLabel()}
            </Text>
          </View>
          {modelState === 'ready' && engine === 'sherpa' && (
            <IconSymbol name="checkmark.circle.fill" size={20} color={accent} />
          )}
        </Pressable>

        {/* System row */}
        <Pressable
          onPress={() => handleSetEngine('system')}
          style={({ pressed }) => [styles.engineRow, styles.engineRowLast, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={styles.engineRadio}>
            <View style={[styles.radioOuter, { borderColor: engine === 'system' ? accent : muted }]}>
              {engine === 'system' && <View style={[styles.radioInner, { backgroundColor: accent }]} />}
            </View>
          </View>
          <View style={styles.engineInfo}>
            <Text style={[styles.engineName, { color: text }]}>System voices</Text>
            <Text style={[styles.engineDesc, { color: muted }]}>Uses iOS built-in voices</Text>
          </View>
          {engine === 'system' && (
            <IconSymbol name="checkmark.circle.fill" size={20} color={accent} />
          )}
        </Pressable>
      </View>

      {/* Voice list — only shown when system engine is selected */}
      {engine === 'system' && (
        <>
          <Text style={[styles.sectionLabel, { color: muted, marginTop: 16 }]}>VOICE</Text>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: inputBg }]}>
            <IconSymbol name="magnifyingglass" size={16} color={muted} style={{ marginRight: 6 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search voices…"
              placeholderTextColor={muted}
              style={[styles.searchInput, { color: text }]}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Default option */}
            <Pressable
              onPress={() => handleSelect(null)}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1, borderBottomColor: separator }]}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.voiceName, { color: text }]}>Default</Text>
                <Text style={[styles.voiceLang, { color: muted }]}>System default voice</Text>
              </View>
              {selectedVoiceId === null && (
                <IconSymbol name="checkmark.circle.fill" size={20} color={accent} />
              )}
            </Pressable>

            {filtered.map(voice => {
              const badge = qualityLabel(voice.quality)
              const isSelected = voice.identifier === selectedVoiceId
              return (
                <Pressable
                  key={voice.identifier}
                  onPress={() => handleSelect(voice.identifier)}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1, borderBottomColor: separator }]}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.voiceName, { color: text }]}>{voice.name}</Text>
                      {badge && (
                        <View style={[styles.badge, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                          <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.voiceLang, { color: muted }]}>{voice.language}</Text>
                  </View>
                  {isSelected && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={accent} />
                  )}
                </Pressable>
              )
            })}

            {filtered.length === 0 && (
              <Text style={[styles.empty, { color: muted }]}>No voices found</Text>
            )}
          </ScrollView>
        </>
      )}
    </BottomDrawer>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  engineSection: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  engineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  engineRowLast: {
    borderBottomWidth: 0,
  },
  engineRadio: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  engineInfo: {
    flex: 1,
  },
  engineName: {
    fontSize: 15,
    fontWeight: '500',
  },
  engineDesc: {
    fontSize: 13,
    marginTop: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  list: {
    maxHeight: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  voiceName: {
    fontSize: 15,
    fontWeight: '500',
  },
  voiceLang: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 15,
  },
})
