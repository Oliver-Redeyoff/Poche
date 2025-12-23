import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState, Button, TextInput } from 'react-native'
import { supabase } from '../lib/supabase'
import { ThemedText } from './themed-text'
import { useThemeColor } from '@/hooks/use-theme-color'

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const borderColor = useThemeColor({}, 'icon')
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Please enter both email and password')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      Alert.alert('Sign In Error', error.message)
    }
    setLoading(false)
  }

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Please enter both email and password')
      return
    }

    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) {
      Alert.alert('Sign Up Error', error.message)
    } else if (!session) {
      Alert.alert('Success', 'Please check your inbox for email verification!')
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Email
        </ThemedText>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor={borderColor}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Password
        </ThemedText>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          placeholderTextColor={borderColor}
          autoCapitalize="none"
          style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Sign in" disabled={loading} onPress={() => signInWithEmail()} />
      </View>
      <View style={styles.verticallySpaced}>
        <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
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