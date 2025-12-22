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
  const [otpToken, setOtpToken] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const borderColor = useThemeColor({}, 'icon')
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')

  async function signInWithOtp() {
    if (!email) {
      Alert.alert('Please enter your email address')
      return
    }

    setLoading(true)
    // Note: To send OTP codes instead of magic links, configure the email template
    // in Supabase Dashboard: Authentication > Email Templates > Magic Link
    // Replace the template to show {{ .Token }} instead of a link
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
        // Don't set emailRedirectTo to ensure OTP is sent instead of magic link
      },
    })

    if (error) {
      Alert.alert(error.message)
    } else {
      setOtpSent(true)
      Alert.alert('Check your email for the OTP code!')
    }
    setLoading(false)
  }

  async function verifyOtp() {
    if (!email || !otpToken) {
      Alert.alert('Please enter both email and OTP token')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: otpToken,
      type: 'email',
    })

    if (error) {
      Alert.alert(error.message)
    } else {
      setOtpSent(false)
      setOtpToken('')
      Alert.alert('Successfully signed in!')
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
          editable={!otpSent}
          style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
        />
      </View>

      {!otpSent ? (
        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Button
            title="Sign in with Email OTP"
            disabled={loading}
            onPress={() => signInWithOtp()}
          />
        </View>
      ) : (
        <>
          <View style={styles.verticallySpaced}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              OTP Token
            </ThemedText>
            <TextInput
              onChangeText={(text) => setOtpToken(text)}
              value={otpToken}
              placeholder="Enter OTP from email"
              placeholderTextColor={borderColor}
              autoCapitalize="none"
              keyboardType="number-pad"
              style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
            />
          </View>
          <View style={[styles.verticallySpaced, styles.mt20]}>
            <Button title="Verify OTP" disabled={loading} onPress={() => verifyOtp()} />
          </View>
          <View style={styles.verticallySpaced}>
            <Button
              title="Cancel"
              disabled={loading}
              onPress={() => {
                setOtpSent(false)
                setOtpToken('')
              }}
            />
          </View>
        </>
      )}
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