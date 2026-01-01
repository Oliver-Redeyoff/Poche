import React, { useState } from 'react'
import { Alert, StyleSheet, View, TextInput, TouchableOpacity, Pressable } from 'react-native'
import { signIn, signUp } from '../lib/api'
import { ThemedText } from '../components/themed-text'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useHeaderHeight } from '@react-navigation/elements'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useAuth } from './_layout'

type AuthMode = 'signin' | 'signup'

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

  function handleForgotPassword() {
    // TODO: Implement forgot password functionality
    Alert.alert('Coming Soon', 'Password reset functionality will be added soon.')
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Mode Switch */}
      <View style={[styles.modeSwitch, { backgroundColor: colors.divider }]}>
        <Pressable
          style={[
            styles.modeOption,
            mode === 'signin' && [styles.modeOptionActive, { backgroundColor }]
          ]}
          onPress={() => handleModeChange('signin')}
        >
          <ThemedText style={[
            styles.modeOptionText,
            { color: mode === 'signin' ? textColor : colors.textMuted }
          ]}>
            Sign In
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.modeOption,
            mode === 'signup' && [styles.modeOptionActive, { backgroundColor }]
          ]}
          onPress={() => handleModeChange('signup')}
        >
          <ThemedText style={[
            styles.modeOptionText,
            { color: mode === 'signup' ? textColor : colors.textMuted }
          ]}>
            Sign Up
          </ThemedText>
        </Pressable>
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
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
          <ThemedText style={[styles.forgotPasswordText, { color: colors.accent }]}>
            Forgot password?
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.accent, opacity: loading ? 0.6 : 1 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <ThemedText style={styles.submitButtonText}>
          {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
        </ThemedText>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
