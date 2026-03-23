import { useCallback } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import Slider from '@react-native-community/slider'
import { ThemedText } from '@/components/themed-text'
import { BottomDrawer } from '@/components/bottom-drawer'
import { useAuth } from '@/app/_layout'
import { useResolvedColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

const FONT_SIZE_MULTIPLIER_MIN = 0.7
const FONT_SIZE_MULTIPLIER_MAX = 1.5
const FONT_SIZE_MULTIPLIER_STEP = 0.1

export interface ReadingSettingsDrawerProps {
  visible: boolean
  onDismiss: () => void
}

export function ReadingSettingsDrawer({
  visible,
  onDismiss,
}: ReadingSettingsDrawerProps) {
  const resolvedScheme = useResolvedColorScheme()
  const colors = Colors[resolvedScheme]
  const {
    appTheme: readingTheme,
    setAppTheme: setReadingTheme,
    appFontSizeMultiplier,
    setAppFontSizeMultiplier,
  } = useAuth()

  const handleSliderChange = useCallback(
    (value: number) => {
      setAppFontSizeMultiplier(value)
    },
    [setAppFontSizeMultiplier]
  )

  return (
    <BottomDrawer visible={visible} onDismiss={onDismiss}>
      {/* Font Size */}
      <View>
        <ThemedText fontSize={13} style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Text Size
        </ThemedText>
        <View style={styles.fontSizeRow}>
          <ThemedText fontSize={14} style={[styles.fontSizeLabel, { color: colors.textMuted }]}>
            A
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={FONT_SIZE_MULTIPLIER_MIN}
            maximumValue={FONT_SIZE_MULTIPLIER_MAX}
            step={FONT_SIZE_MULTIPLIER_STEP}
            value={appFontSizeMultiplier}
            onValueChange={handleSliderChange}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.divider}
            thumbTintColor={colors.accent}
          />
          <ThemedText fontSize={14} style={[styles.fontSizeLabel, { color: colors.text }]}>
            A
          </ThemedText>
        </View>
      </View>

      {/* Theme */}
      <View style={styles.section}>
        <ThemedText fontSize={13} style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Theme
        </ThemedText>
        <View style={styles.themeRow}>
          {(
            [
              {
                key: 'auto' as const,
                label: 'Auto',
                bg: resolvedScheme === 'dark' ? '#1C1A18' : '#FAFAF8',
                border: true,
              },
              {
                key: 'light' as const,
                label: 'Light',
                bg: '#FAFAF8',
                border: true,
              },
              {
                key: 'sepia' as const,
                label: 'Sepia',
                bg: '#F5ECD7',
                border: false,
              },
              {
                key: 'dark' as const,
                label: 'Dark',
                bg: '#1C1A18',
                border: false,
              },
            ] as const
          ).map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setReadingTheme(t.key)}
              style={styles.themeOption}
            >
              <View
                style={[
                  styles.themeCircle,
                  { backgroundColor: t.bg },
                  t.border && {
                    borderWidth: 1,
                    borderColor: colors.divider,
                  },
                  readingTheme === t.key && {
                    borderWidth: 2.5,
                    borderColor: colors.accent,
                  },
                ]}
              />
              <ThemedText
                fontSize={12}
                style={[
                  styles.themeLabel,
                  {
                    color:
                      readingTheme === t.key ? colors.text : colors.textMuted,
                  },
                ]}
              >
                {t.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </BottomDrawer>
  )
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontSizeLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    width: 20,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  fontSizeValue: {
    fontFamily: 'SourceSans3_500Medium',
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.8,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  themeOption: {
    alignItems: 'center',
    gap: 6,
  },
  themeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  themeLabel: {
    fontFamily: 'SourceSans3_500Medium',
  },
})
