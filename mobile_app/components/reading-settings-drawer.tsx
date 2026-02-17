import { useCallback } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import Slider from '@react-native-community/slider'
import { ThemedText } from '@/components/themed-text'
import { BottomDrawer } from '@/components/bottom-drawer'
import { useAuth } from '@/app/_layout'
import { useTheme } from '@react-navigation/native'
import { useResolvedColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

const FONT_SIZE_STEPS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26] as const
const FONT_SIZE_LAST_INDEX = FONT_SIZE_STEPS.length - 1

export interface ReadingSettingsDrawerProps {
  visible: boolean
  onDismiss: () => void
}

export function ReadingSettingsDrawer({
  visible,
  onDismiss,
}: ReadingSettingsDrawerProps) {
  const theme = useTheme()
  const isDark = theme.dark
  const resolvedScheme = useResolvedColorScheme()
  const colors = Colors[resolvedScheme]
  const {
    appTheme: readingTheme,
    setAppTheme: setReadingTheme,
    appFontSize,
    setAppFontSize,
  } = useAuth()

  const fontSizeStepIndex = Math.min(
    FONT_SIZE_LAST_INDEX,
    Math.max(
      0,
      Math.round(
        (appFontSize - FONT_SIZE_STEPS[0]) /
          (FONT_SIZE_STEPS[FONT_SIZE_LAST_INDEX] - FONT_SIZE_STEPS[0]) *
          FONT_SIZE_LAST_INDEX
      )
    )
  )

  const handleSliderChange = useCallback(
    (value: number) => {
      setAppFontSize(FONT_SIZE_STEPS[Math.round(value)])
    },
    [setAppFontSize]
  )

  return (
    <BottomDrawer visible={visible} onDismiss={onDismiss}>
      {/* Font Size */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Text Size
        </ThemedText>
        <View style={styles.fontSizeRow}>
          <ThemedText style={[styles.fontSizeLabel, { color: colors.textMuted }]}>
            A
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={FONT_SIZE_LAST_INDEX}
            step={1}
            value={fontSizeStepIndex}
            onValueChange={handleSliderChange}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.divider}
            thumbTintColor={colors.accent}
          />
          <ThemedText style={[styles.fontSizeLabel, { color: colors.text }]}>
            A
          </ThemedText>
        </View>
        <ThemedText style={[styles.fontSizeValue, { color: colors.textSecondary }]}>
          {appFontSize}
        </ThemedText>
      </View>

      {/* Theme */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Theme
        </ThemedText>
        <View style={styles.themeRow}>
          {(
            [
              {
                key: 'auto' as const,
                label: 'Auto',
                bg: isDark ? '#1C1A18' : '#FAFAF8',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
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
    fontSize: 14,
    fontFamily: 'SourceSans3_600SemiBold',
    width: 20,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  fontSizeValue: {
    fontSize: 14,
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
    fontSize: 12,
    fontFamily: 'SourceSans3_500Medium',
  },
})
