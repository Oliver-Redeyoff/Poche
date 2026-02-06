import React from 'react'
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  StyleProp,
  View,
  ActivityIndicator,
} from 'react-native'
import { ThemedText } from './themed-text'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  loadingText?: string
  disabled?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  loadingText,
  disabled = false,
  icon,
  iconRight,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  
  const isDisabled = disabled || loading
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      opacity: isDisabled ? 0.6 : 1,
    }
    
    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: colors.accent }
      case 'secondary':
        return { ...baseStyle, backgroundColor: colors.surface }
      case 'danger':
        return { ...baseStyle, backgroundColor: colors.errorLight }
      case 'ghost':
        return { ...baseStyle, backgroundColor: 'transparent' }
      default:
        return baseStyle
    }
  }
  
  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: 'white' }
      case 'secondary':
        return { color: colors.text }
      case 'danger':
        return { color: colors.error }
      case 'ghost':
        return { color: colors.accent }
      default:
        return { color: 'white' }
    }
  }
  
  const displayText = loading && loadingText ? loadingText : title
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        !fullWidth && styles.autoWidth,
        variant === 'ghost' && styles.ghostButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading && variant !== 'ghost' && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : colors.text} 
          style={styles.loader}
        />
      )}
      {icon && !loading && <View style={styles.iconLeft}>{icon}</View>}
      <ThemedText style={[styles.text, getTextStyle(), textStyle]}>
        {displayText}
      </ThemedText>
      {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  autoWidth: {
    alignSelf: 'flex-start',
  },
  ghostButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  text: {
    fontSize: 16,
    fontFamily: 'SourceSans3_600SemiBold',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loader: {
    marginRight: 8,
  },
})
