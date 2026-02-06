import { useState } from 'react'
import { useHeaderHeight } from '@react-navigation/elements'
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Alert,
  Platform,
  useColorScheme,
} from 'react-native'
import { ThemedText } from '../components/themed-text'
import { ThemedView } from '../components/themed-view'
import { Button } from '../components/button'
import { signOut, deleteAccount } from '../lib/api'
import { clearArticlesFromStorage } from '../lib/article-sync'
import { useAuth } from './_layout'
import { router } from 'expo-router'
import { Colors } from '../constants/theme'

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight()
  const { session, setSession } = useAuth()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const [isDeleting, setIsDeleting] = useState(false)

  // Calculate padding to account for header and safe area
  const topPadding = headerHeight

  async function handleLogout() {
    // Clear locally stored articles before signing out
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
      // Clear locally stored articles before deleting account
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
      // iOS supports Alert.prompt with secure text input
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
      // Android doesn't support Alert.prompt, use a simple prompt
      // We'll ask for password in the initial alert message
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
  
  if (!session) {
    return null // Auth is handled in _layout.tsx
  }
  
  return (
    <ThemedView style={{...styles.container, paddingTop: topPadding}}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <ThemedText style={[styles.signedInText, { color: colors.textSecondary }]}>
            Signed in as {session.user.email}
          </ThemedText>

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
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'SourceSans3_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginLeft: 4,
  },
  signedInText: {
    fontSize: 15,
    fontFamily: 'SourceSans3_400Regular',
    marginBottom: 4,
  },
})
