import { StyleSheet, View, Platform, Pressable, Alert, Animated } from 'react-native'
import { router, Tabs } from 'expo-router'
import { useThemeColor } from '@/hooks/use-theme-color'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Header } from '@/components/header'
import { useState, useEffect, useRef } from 'react'
import { BottomDrawer } from '@/components/bottom-drawer'
import { ReadingSettingsDrawer } from '@/components/reading-settings-drawer'
import { ThemedText } from '@/components/themed-text'
import { Button } from '@/components/button'
import { useAuth } from '../_layout'
import { signOut, deleteAccount, getArticleUsage } from '@/lib/api'
import { clearArticlesFromStorage, useSyncProgress } from '@/lib/article-sync'
import { Colors } from '@/constants/theme'
import { useResolvedColorScheme } from '@/hooks/use-color-scheme'
import Purchases from 'react-native-purchases'
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTtsContext } from '@/contexts/tts-context'
import { TtsPlayerBar } from '@/components/tts-player-bar'
import { TtsVoicePicker } from '@/components/tts-voice-picker'

// Height of the custom Header component (56px content + 1px border + status bar inset)
// This matches the dimensions defined in components/header.tsx.
const HEADER_CONTENT_HEIGHT = 57
const PROGRESS_BAR_HEIGHT = 2

function SyncProgressBar() {
  const { status, progress } = useSyncProgress()
  const tintColor = useThemeColor({}, 'tint')
  const insets = useSafeAreaInsets()

  const headerHeight = insets.top + HEADER_CONTENT_HEIGHT

  const opacityAnim = useRef(new Animated.Value(0)).current
  const fillAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const loopRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | null = null

    if (status === 'idle') {
      loopRef.current?.stop()
      Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start()
    } else if (status === 'fetching') {
      Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start()
      fillAnim.setValue(1)
      pulseAnim.setValue(1)
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
        ])
      )
      loopRef.current.start()
    } else if (status === 'processing') {
      loopRef.current?.stop()
      pulseAnim.setValue(1)
      Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start()
      Animated.timing(fillAnim, { toValue: progress, duration: 300, useNativeDriver: false }).start()
    } else if (status === 'done') {
      loopRef.current?.stop()
      Animated.timing(fillAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()
      fadeTimer = setTimeout(() => {
        Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start()
      }, 600)
    }

    return () => {
      loopRef.current?.stop()
      if (fadeTimer !== null) clearTimeout(fadeTimer)
    }
  }, [status, progress])

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: headerHeight,
        left: 0,
        right: 0,
        height: PROGRESS_BAR_HEIGHT,
        zIndex: 100,
        opacity: opacityAnim,
      }}
    >
      <Animated.View
        style={{
          height: PROGRESS_BAR_HEIGHT,
          backgroundColor: tintColor,
          width: fillWidth,
          opacity: pulseAnim,
        }}
      />
    </Animated.View>
  )
}

export default function TabLayout() {
  const { session, setSession, isPremium, setIsPremium } = useAuth()
  const tts = useTtsContext()
  const insets = useSafeAreaInsets()

  const tintColor = useThemeColor({}, 'tint')
  const borderColor = useThemeColor({}, 'border')
  const textColor = useThemeColor({}, 'text')
  const resolvedScheme = useResolvedColorScheme()
  const colors = Colors[resolvedScheme]

  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showVoicePicker, setShowVoicePicker] = useState(false)
  const [showReadingSettings, setShowReadingSettings] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const paywallAfterDismiss = useRef(false)
  const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null)

  useEffect(() => {
    if (showAccountSettings) {
      getArticleUsage().then(setUsage).catch(() => {})
      if (Platform.OS === 'ios') {
        Purchases.getCustomerInfo()
          .then((info) => setIsPremium(!!info.entitlements.active['poche_plus']))
          .catch(() => {})
      }
    }
  }, [showAccountSettings])

  async function handleLogout() {
    if (session?.user?.id) {
      await clearArticlesFromStorage(session.user.id)
    }
    await signOut()
    if (Platform.OS === 'ios') {
      await Purchases.logOut().catch(() => {})
    }
    setSession(null)
    router.replace('/auth')
  }

  async function performDeleteAccount(password: string) {
    setIsDeleting(true)
    try {
      if (session?.user?.id) {
        await clearArticlesFromStorage(session.user.id)
      }
      await deleteAccount(password)
      setSession(null)
      router.replace('/auth')
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to delete account'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  function promptForPassword() {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Enter Password',
        'Please enter your password to confirm account deletion.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: (password?: string) => {
              if (password) {
                performDeleteAccount(password)
              }
            }
          },
        ],
        'secure-text',
        '',
        'default'
      )
    } else {
      Alert.alert(
        'Contact Support',
        'To delete your account on Android, please contact support or use the web app at poche.to',
        [{ text: 'OK' }]
      )
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your articles and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: promptForPassword
        },
      ]
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <SyncProgressBar />

      <Header
        showLogo
        rightElement={
          <View style={styles.headerRight}>
            <Pressable 
              onPress={() => setShowReadingSettings(true)}
              style={({ pressed }) => [
                { padding: 4 },
                pressed && { opacity: 0.6 }
              ]}
            >
              <IconSymbol name="paintpalette" size={26} color={textColor} />
            </Pressable>
            <Pressable 
              onPress={() => setShowAccountSettings(true)}
              style={({ pressed }) => [
                { padding: 4 },
                pressed && { opacity: 0.6 }
              ]}
            >
              <IconSymbol name="person" size={26} color={textColor} />
            </Pressable>
          </View>
        }
      />

      <BottomDrawer
        visible={showAccountSettings}
        onDismiss={() => setShowAccountSettings(false)}
        onFullyDismissed={async () => {
          if (!paywallAfterDismiss.current) return
          paywallAfterDismiss.current = false
          const result = await RevenueCatUI.presentPaywall()
          if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
            setIsPremium(true)
          }
        }}
      >
        <View style={styles.section}>
          {/* User identity */}
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
              <ThemedText fontSize={19} style={[styles.avatarInitial, { color: colors.accent }]}>
                {(session?.user?.name || session?.user?.email || '?')[0].toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.userInfo}>
              {session?.user?.name ? (
                <>
                  <ThemedText fontSize={15} style={styles.userName}>{session.user.name}</ThemedText>
                  <ThemedText fontSize={13} style={{ color: colors.textSecondary }}>{session.user.email}</ThemedText>
                </>
              ) : (
                <ThemedText fontSize={15} style={styles.userName}>{session?.user?.email}</ThemedText>
              )}
            </View>
            {isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: borderColor }]}>
                <ThemedText fontSize={16} style={[styles.premiumBadgeText, { color: colors.text }]}>
                  Poche
                </ThemedText>
                <ThemedText fontSize={16} style={[styles.premiumBadgePlus, { color: colors.accent }]}>
                  +
                </ThemedText>
              </View>
            )}
          </View>

          {/* Subscription status */}
          {!isPremium && Platform.OS === 'ios' && (
            <Button
              title="Upgrade to Premium"
              variant="primary"
              onPress={() => {
                paywallAfterDismiss.current = true
                setShowAccountSettings(false)
              }}
            />
          )}

          {/* Usage */}
          {usage !== null && !isPremium && (() => {
            const pct = Math.min(1, usage.count / usage.limit)
            const fillColor = pct >= 1 ? colors.error : pct >= 0.8 ? colors.warning : colors.tint
            return (
              <View style={[styles.usageCard, { backgroundColor: colors.surface }]}>
                <View style={styles.usageLabelRow}>
                  <ThemedText fontSize={13} style={{ color: colors.textSecondary }}>Articles saved</ThemedText>
                  <ThemedText fontSize={13} style={[styles.usageCount, { color: fillColor }]}>
                    {usage.count} / {usage.limit}
                  </ThemedText>
                </View>
                <View style={[styles.usageBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.usageFill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
                </View>
              </View>
            )
          })()}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Button
            title="Sign Out"
            variant="primary"
            onPress={handleLogout}
            // style={{ backgroundColor: colors.card }}
          />

          <Button
            title="Delete Account"
            variant="danger"
            onPress={handleDeleteAccount}
            loading={isDeleting}
            loadingText="Deleting..."
          />
        </View>
      </BottomDrawer>

      <ReadingSettingsDrawer
        visible={showReadingSettings}
        onDismiss={() => setShowReadingSettings(false)}
      />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tintColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: borderColor,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <IconSymbol name={focused ? 'house.fill' : 'house'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ focused, color }) => (
              <IconSymbol name={focused ? 'books.vertical.fill' : 'books.vertical'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {tts.isActive && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: insets.bottom + 49,
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: resolvedScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: resolvedScheme === 'dark' ? '#38383A' : '#D1D1D6',
          }}
        >
          <TtsPlayerBar
            isPlaying={tts.isPlaying}
            currentIndex={tts.currentIndex}
            totalSegments={tts.segments.length}
            speed={tts.speed}
            engine={tts.engine}
            modelState={tts.modelState}
            voices={tts.voices}
            selectedVoiceId={tts.selectedVoiceId}
            onPlay={tts.resume}
            onPause={tts.pause}
            onSkipBack={tts.skipBack}
            onSkipForward={tts.skipForward}
            onCycleSpeed={tts.cycleSpeed}
            onSetVoice={tts.setVoice}
            onSetEngine={tts.setEngine}
            onClose={tts.close}
            onOpenVoicePicker={() => setShowVoicePicker(true)}
          />
        </View>
      )}

      <TtsVoicePicker
        visible={showVoicePicker}
        onDismiss={() => setShowVoicePicker(false)}
        voices={tts.voices}
        selectedVoiceId={tts.selectedVoiceId}
        engine={tts.engine}
        modelState={tts.modelState}
        onSelect={tts.setVoice}
        onSetEngine={tts.setEngine}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  section: {
    gap: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'SourceSans3_600SemiBold',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontFamily: 'SourceSans3_600SemiBold',
  },
  usageCard: {
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  usageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageCount: {
    fontFamily: 'SourceSans3_600SemiBold',
  },
  usageBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  premiumBadge: {
    display: 'flex',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  premiumBadgeText: {
    fontFamily: 'Bitter_600SemiBold',
  },
  premiumBadgePlus: {
    fontFamily: 'Bitter_700Bold',
  },
})