import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { Session } from "@supabase/supabase-js"
import { useHeaderHeight } from '@react-navigation/elements'
import { StyleSheet, View, Alert, Button, TextInput, ScrollView } from 'react-native'
import { ThemedText } from '../components/themed-text'
import { ThemedView } from '../components/themed-view'
import { useThemeColor } from '@/hooks/use-theme-color'

export default function SettingsScreen() {
  const [session, setSession] = useState<Session | null>(null)
  const headerHeight = useHeaderHeight()
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const borderColor = useThemeColor({}, 'icon')
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')

  // Calculate padding to account for header and safe area
  const topPadding = headerHeight

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    if (session) {
      getProfile()
    }
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username || '')
        setWebsite(data.website || '')
        setAvatarUrl(data.avatar_url || '')
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string
    website: string
    avatar_url: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }

      Alert.alert('Success', 'Profile updated successfully')
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }
  
  if (!session || !session.user) {
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
              {session?.user?.email}
            </ThemedText>
          </View>

          <View style={[styles.button, styles.buttonSecondary]}>
            <Button 
              title="Logout" 
              onPress={() => supabase.auth.signOut({ scope: 'local' })} 
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
  header: {
    marginBottom: 8,
  },
  title: {
    marginBottom: 4,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 12,
    borderRadius: 14,
    fontWeight: '600',
  },
    buttonPrimary: {
    backgroundColor: "#EF4056",
  },
    buttonSecondary: {
    backgroundColor: "#aaaaaa",
  },
})
