import { StyleSheet, View, Platform, Pressable, Alert } from 'react-native'
import { Tabs, router } from 'expo-router'
import { useThemeColor } from '@/hooks/use-theme-color'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Header } from '@/components/header'
import { useState, useEffect } from 'react'
import { BottomDrawer } from '@/components/bottom-drawer'
import { ReadingSettingsDrawer } from '@/components/reading-settings-drawer'
import { ThemedText } from '@/components/themed-text'
import { Button } from '@/components/button'
import { useAuth } from '../_layout'
import { signOut, deleteAccount, getArticleUsage } from '@/lib/api'
import { clearArticlesFromStorage } from '@/lib/article-sync'
import { Colors } from '@/constants/theme'
import { useResolvedColorScheme } from '@/hooks/use-color-scheme'

export default function TabLayout() {
  const { session, setSession } = useAuth()

  const backgroundColor = useThemeColor({}, 'background')
  const tintColor = useThemeColor({}, 'tint')
  const iconColor = useThemeColor({}, 'icon')
  const borderColor = useThemeColor({}, 'border')
  const textColor = useThemeColor({}, 'text')
  const resolvedScheme = useResolvedColorScheme()
  const colors = Colors[resolvedScheme]

  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showReadingSettings, setShowReadingSettings] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null)

  useEffect(() => {
    if (showAccountSettings) {
      getArticleUsage().then(setUsage).catch(() => {})
    }
  }, [showAccountSettings])

  async function handleLogout() {
    if (session?.user?.id) {
      await clearArticlesFromStorage(session.user.id)
    }
    await signOut()
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
      >
        <View style={styles.section}>
            <ThemedText fontSize={13} style={styles.sectionTitle}>Account</ThemedText>
            
            <ThemedText fontSize={15} style={[styles.signedInText, { color: colors.textSecondary }]}>
              Signed in as {session?.user?.email}
            </ThemedText>

            {usage !== null && (() => {
              const pct = Math.min(1, usage.count / usage.limit)
              const fillColor = pct >= 1 ? colors.error : pct >= 0.8 ? colors.warning : colors.tint
              return (
                <View style={styles.usageSection}>
                  <View style={[styles.usageBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.usageFill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
                  </View>
                  <ThemedText fontSize={13} style={{ color: colors.textSecondary }}>
                    {usage.count} / {usage.limit} articles saved
                  </ThemedText>
                </View>
              )
            })()}

            <Button
              title="Sign Out"
              variant="secondary"
              onPress={handleLogout}
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
          headerShown: false,
          tabBarActiveTintColor: tintColor,
          tabBarInactiveTintColor: iconColor,
          tabBarStyle: {
            backgroundColor,
            borderTopColor: borderColor,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontFamily: 'SourceSans3_500Medium',
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="house.fill" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="books.vertical.fill" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
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
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginLeft: 4,
  },
  signedInText: {
    fontFamily: 'SourceSans3_400Regular',
    marginBottom: 4,
  },
  usageSection: {
    gap: 6,
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
})