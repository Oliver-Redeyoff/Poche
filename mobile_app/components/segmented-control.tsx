import React from 'react'
import { 
  View, 
  Pressable, 
  StyleSheet, 
  ViewStyle,
  StyleProp,
} from 'react-native'
import { ThemedText } from './themed-text'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useThemeColor } from '@/hooks/use-theme-color'

interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  selectedValue: T
  onValueChange: (value: T) => void
  style?: StyleProp<ViewStyle>
}

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onValueChange,
  style,
}: SegmentedControlProps<T>) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')

  return (
    <View style={[styles.container, { backgroundColor: colors.divider }, style]}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value
        
        return (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              isSelected && [styles.optionActive, { backgroundColor }]
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <ThemedText style={[
              styles.optionText,
              { color: isSelected ? textColor : colors.textMuted }
            ]}>
              {option.label}
            </ThemedText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'SourceSans3_600SemiBold',
  },
})
