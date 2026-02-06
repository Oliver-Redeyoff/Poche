import React from 'react'
import { View, Image, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native'
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
  /** Custom element to display on the right */
  rightElement?: React.ReactNode
  /** Additional style for the header container */
  style?: StyleProp<ViewStyle>
}

export function Header({
  showLogo = true,
  showBack = false,
  title,
  rightElement,
  style,
}: HeaderProps) {
  const insets = useSafeAreaInsets()
  const textColor = useThemeColor({}, 'text')

  return (
    <View style={[{ paddingTop: insets.top }, style]}>
      <View style={styles.content}>
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
              <IconSymbol name="chevron.left" size={24} color={textColor} />
            </Pressable>
          ) : showLogo ? (
            <View style={styles.logo}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
              />
              <ThemedText style={styles.logoText}>Poche</ThemedText>
            </View>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Center section */}
        <View style={styles.centerSection}>
          {title && (
            <ThemedText style={styles.title}>{title}</ThemedText>
          )}
        </View>

        {/* Right section */}
        <View style={styles.rightSection}>
          {rightElement || <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    backgroundColor: 'green',
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
    fontSize: 26,
    letterSpacing: -1,
    fontFamily: 'Bitter_600SemiBold',
  },
  title: {
    fontSize: 17,
    fontFamily: 'SourceSans3_600SemiBold',
  },
  backButton: {
    padding: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  placeholder: {
    width: 32,
  },
})
