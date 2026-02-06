import React, { useState } from 'react'
import { Alert, StyleSheet, View, TextInput } from 'react-native'
import { signIn, signUp, forgotPassword } from '../lib/api'
import { ThemedText } from '../components/themed-text'
import { Button } from '../components/button'
import { SegmentedControl } from '../components/segmented-control'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useHeaderHeight } from '@react-navigation/elements'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useAuth } from './_layout'

type AuthMode = 'signin' | 'signup' | 'forgot'

const AUTH_MODE_OPTIONS: { value: 'signin' | 'signup'; label: string }[] = [
  { value: 'signin', label: 'Sign In' },
  { value: 'signup', label: 'Sign Up' },
]

export default function Auth() {
  const headerHeight = useHeaderHeight()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const { setSession } = useAuth()
  
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const borderColor = useThemeColor({}, 'icon')
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')

  const topPadding = headerHeight

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode)
    setConfirmPassword('')
  }

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match')
        return
      }
      await handleSignUp()
    } else {
      await handleSignIn()
    }
  }

  async function handleSignIn() {
    setLoading(true)
    try {
      const response = await signIn(email, password)
      // Update the shared auth context - this triggers navigation via Stack.Protected
      setSession(response)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Sign In Error', error.message)
      } else {
        Alert.alert('Sign In Error', 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    setLoading(true)
    try {
      const response = await signUp(email, password)
      // Update the shared auth context - this triggers navigation via Stack.Protected
      setSession(response)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Sign Up Error', error.message)
      } else {
        Alert.alert('Sign Up Error', 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (mode !== 'forgot') {
      // Switch to forgot password mode
      setMode('forgot')
      return
    }

    // Submit forgot password request
    if (!email) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    setLoading(true)
    try {
      await forgotPassword(email)
      Alert.alert(
        'Check Your Email',
        'If an account exists with this email, you will receive a password reset link.',
        [{ text: 'OK', onPress: () => setMode('signin') }]
      )
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      } else {
        Alert.alert('Error', 'Failed to send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Forgot password view
  if (mode === 'forgot') {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        {/* Header */}
        <View style={styles.forgotHeader}>
          <ThemedText style={styles.forgotTitle}>Reset Password</ThemedText>
          <ThemedText style={[styles.forgotSubtitle, { color: colors.textSecondary }]}>
            Enter your email and we'll send you a link to reset your password.
          </ThemedText>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            onChangeText={setEmail}
            value={email}
            placeholder="your@email.com"
            placeholderTextColor={borderColor}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
          />
        </View>

        {/* Back to Sign In */}
        <View style={{ alignItems: 'center' }}>
          <Button
            title="Back to Sign In"
            variant="ghost"
            onPress={() => handleModeChange('signin')}
            fullWidth={false}
            style={styles.backToSignIn}
          />
        </View>

        {/* Submit Button */}
        <Button
          title="Send Reset Link"
          variant="primary"
          onPress={handleForgotPassword}
          loading={loading}
          loadingText="Sending..."
          style={styles.submitButton}
        />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Mode Switch */}
      <SegmentedControl
        options={AUTH_MODE_OPTIONS}
        selectedValue={mode}
        onValueChange={(value) => handleModeChange(value)}
        style={styles.modeSwitch}
      />

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Email</ThemedText>
        <TextInput
          onChangeText={setEmail}
          value={email}
          placeholder="your@email.com"
          placeholderTextColor={borderColor}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Password</ThemedText>
        <TextInput
          onChangeText={setPassword}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          placeholderTextColor={borderColor}
          autoCapitalize="none"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
        />
      </View>

      {/* Confirm Password (Sign Up only) */}
      {mode === 'signup' && (
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Confirm Password</ThemedText>
          <TextInput
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            secureTextEntry={true}
            placeholder="Confirm password"
            placeholderTextColor={borderColor}
            autoCapitalize="none"
            autoComplete="new-password"
            style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
          />
        </View>
      )}

      {/* Forgot Password (Sign In only) */}
      {mode === 'signin' && (
        <View style={{ alignItems: 'center' }}>
          <Button
            title="Forgot password?"
            variant="ghost"
            onPress={handleForgotPassword}
            fullWidth={false}
            style={styles.forgotPassword}
          />
        </View>
      )}

      {/* Submit Button */}
      <Button
        title={mode === 'signin' ? 'Sign In' : 'Create Account'}
        variant="primary"
        onPress={handleSubmit}
        loading={loading}
        loadingText="Please wait..."
        style={styles.submitButton}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  modeSwitch: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'SourceSans3_500Medium',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'SourceSans3_400Regular',
  },
  forgotPassword: {
    marginBottom: 8,
  },
  forgotHeader: {
    marginBottom: 24,
  },
  forgotTitle: {
    fontSize: 24,
    fontFamily: 'Bitter_600SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  forgotSubtitle: {
    fontSize: 15,
    fontFamily: 'SourceSans3_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  backToSignIn: {
    marginTop: 16,
  },
  submitButton: {
    marginTop: 16,
  },
})
