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
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            Account Settings
          </ThemedText>
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <ThemedText style={styles.label}>
            Email
          </ThemedText>
          <TextInput
            value={session?.user?.email || ''}
            editable={false}
            style={[styles.input, { borderColor, backgroundColor, color: textColor, opacity: 0.6 }]}
          />
        </View>
        <View style={styles.verticallySpaced}>
          <ThemedText style={styles.label}>
            Username
          </ThemedText>
          <TextInput
            value={username || ''}
            onChangeText={(text) => setUsername(text)}
            placeholder="Username"
            placeholderTextColor={borderColor}
            autoCapitalize="none"
            style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
          />
        </View>
        <View style={styles.verticallySpaced}>
          <ThemedText style={styles.label}>
            Website
          </ThemedText>
          <TextInput
            value={website || ''}
            onChangeText={(text) => setWebsite(text)}
            placeholder="Website URL"
            placeholderTextColor={borderColor}
            autoCapitalize="none"
            keyboardType="url"
            style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
          />
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Button
            title={loading ? 'Loading ...' : 'Update Profile'}
            onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
            disabled={loading}
          />
        </View>

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Button 
            title="Sign Out" 
            onPress={() => supabase.auth.signOut()} 
            color="#ff3b30"
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
})
