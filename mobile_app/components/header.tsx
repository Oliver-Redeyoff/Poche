import React, { useEffect } from 'react'
import { View, Image, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ThemedText } from './themed-text'
import { IconSymbol } from './ui/icon-symbol'
import { useThemeColor } from '@/hooks/use-theme-color'

interface HeaderProps {
  /** Show the Poche logo on the left */
  showLogo?: boolean
  /** Show a back button on the left (overrides showLogo) */
  showBack?: boolean
  /** Title to display in the center */
  title?: string
  /** Custom element to display in the center (overrides title) */
  centerElement?: React.ReactNode
  /** Custom element to display on the right */
  rightElement?: React.ReactNode
  /** Additional style for the header container */
  style?: StyleProp<ViewStyle>
  /** When true, the header collapses with a slide-up animation */
  hidden?: boolean
}

export function Header({
  showLogo = true,
  showBack = false,
  title,
  centerElement,
  rightElement,
  style,
  hidden = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets()
  const textColor = useThemeColor({}, 'text')
  const borderColor = useThemeColor({}, 'border')
  const backgroundColor = useThemeColor({}, 'background')

  const contentHeight = 56 + 1
  const animProgress = useSharedValue(1)

  useEffect(() => {
    animProgress.value = withTiming(hidden ? 0 : 1, { duration: 250 })
  }, [hidden])

  const wrapperAnimStyle = useAnimatedStyle(() => ({
    height: insets.top + animProgress.value * contentHeight,
  }))

  const slideAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (animProgress.value - 1) * contentHeight }],
    opacity: animProgress.value,
  }))

  return (
    <Animated.View style={[{ overflow: 'hidden', backgroundColor }, wrapperAnimStyle]}>
      <Animated.View style={[slideAnimStyle, { paddingTop: insets.top }, style]}>
        <View style={[styles.content, { borderBottomColor: borderColor }]}>
          {/* Left section */}
          <View style={styles.leftSection}>
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <IconSymbol name="chevron.left" size={22} color={textColor} />
              <ThemedText fontSize={20} style={styles.backText}>Back</ThemedText>
            </Pressable>
          ) : showLogo ? (
            <View style={styles.logo}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
              />
              <ThemedText fontSize={26} style={styles.logoText}>Poche</ThemedText>
            </View>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Center section */}
        <View style={styles.centerSection}>
          {centerElement || (title && (
            <ThemedText fontSize={17} style={styles.title}>{title}</ThemedText>
          ))}
        </View>

        {/* Right section */}
        <View style={styles.rightSection}>
          {rightElement || <View style={styles.placeholder} />}
        </View>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  logoText: {
    letterSpacing: -1,
    fontFamily: 'Bitter_600SemiBold',
  },
  title: {
    fontFamily: 'SourceSans3_600SemiBold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: 'SourceSans3_600SemiBold',
  },
  pressed: {
    opacity: 0.6,
  },
  placeholder: {
    width: 32,
  },
})
