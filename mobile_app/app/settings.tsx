import { useHeaderHeight } from '@react-navigation/elements'
import { StyleSheet, View, Button, ScrollView } from 'react-native'
import { ThemedText } from '../components/themed-text'
import { ThemedView } from '../components/themed-view'
import { signOut } from '../lib/api'
import { useAuth } from './_layout'
import { router } from 'expo-router'

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight()
  const { session, setSession } = useAuth()

  // Calculate padding to account for header and safe area
  const topPadding = headerHeight

  async function handleLogout() {
    await signOut()
    setSession(null)
    router.replace('/auth')
  }
  
  if (!session) {
    return null // Auth is handled in _layout.tsx
  }
  
  return (
    <ThemedView style={{...styles.container, paddingTop: topPadding}}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfoTextContainer}>
            <ThemedText style={styles.userInfoText}>
              Logged in as
            </ThemedText>
            <ThemedText style={[styles.userInfoText, { fontWeight: '600' }]}>
              {session.user.email}
            </ThemedText>
          </View>

          <View style={[styles.button, styles.buttonSecondary]}>
            <Button 
              title="Logout" 
              onPress={handleLogout} 
              color="white"
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(120, 120, 120, 0.1)',
  },
  userInfoTextContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
  },
  userInfoText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  button: {
    paddingHorizontal: 12,
    borderRadius: 14,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: "#aaaaaa",
  },
})
