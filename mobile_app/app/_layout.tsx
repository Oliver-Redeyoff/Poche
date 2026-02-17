import { DarkTheme, DefaultTheme, ThemeProvider, Theme } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { View, Image, Pressable } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Header } from '@/components/header'
import {
  useFonts as useBitterFonts,
  Bitter_400Regular,
  Bitter_500Medium,
  Bitter_600SemiBold,
  Bitter_700Bold,
} from '@expo-google-fonts/bitter'
import {
  useFonts as useSourceSansFonts,
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3'
import * as SplashScreen from 'expo-splash-screen'
import { getSession, AuthResponse } from '@/lib/api'
import { useColorScheme } from '@/hooks/use-color-scheme'
// Import background sync to ensure task is defined
import '@/lib/background-sync'
import { registerBackgroundSync, unregisterBackgroundSync } from '@/lib/background-sync'
import { useThemeColor } from '@/hooks/use-theme-color'
import { Colors, ResolvedColorScheme } from '@/constants/theme'

const ONBOARDING_COMPLETE_KEY = '@poche_onboarding_complete'
const APP_THEME_KEY = '@poche_app_theme'

export type AppTheme = 'auto' | 'light' | 'sepia' | 'dark'

// Prevent splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync()

// Extended theme type with resolved color scheme identifier
type PocheTheme = Theme & { resolvedScheme: ResolvedColorScheme }

// Custom Poche theme colors using unified theme constants
const PocheLightTheme: PocheTheme = {
  dark: false,
  resolvedScheme: 'light',
  colors: {
    primary: Colors.light.accent,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.accent,
  },
  fonts: DefaultTheme.fonts,
}

const PocheDarkTheme: PocheTheme = {
  dark: true,
  resolvedScheme: 'dark',
  colors: {
    primary: Colors.dark.accent,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.accent,
  },
  fonts: DarkTheme.fonts,
}

const PocheSepiaTheme: PocheTheme = {
  dark: false,
  resolvedScheme: 'sepia',
  colors: {
    primary: Colors.sepia.accent,
    background: Colors.sepia.background,
    card: Colors.sepia.card,
    text: Colors.sepia.text,
    border: Colors.sepia.border,
    notification: Colors.sepia.accent,
  },
  fonts: DefaultTheme.fonts,
}

// Auth context to share session state across the app
interface AuthContextType {
  session: AuthResponse | null
  setSession: (session: AuthResponse | null) => void
  isLoading: boolean
  hasCompletedOnboarding: boolean
  completeOnboarding: () => Promise<void>
  appTheme: AppTheme
  setAppTheme: (theme: AppTheme) => void
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  setSession: () => {},
  isLoading: true,
  hasCompletedOnboarding: true,
  completeOnboarding: async () => {},
  appTheme: 'auto',
  setAppTheme: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// Check if onboarding has been completed
async function checkOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)
    return value === 'true'
  } catch {
    return false
  }
}

// Mark onboarding as complete
async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
  } catch (error) {
    console.error('Error saving onboarding state:', error)
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  const [session, setSession] = useState<AuthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true) // Default to true to avoid flash
  const [appTheme, setAppThemeState] = useState<AppTheme>('auto')

  const setAppTheme = useCallback((theme: AppTheme) => {
    setAppThemeState(theme)
    AsyncStorage.setItem(APP_THEME_KEY, theme).catch(() => {})
  }, [])

  // Load custom fonts - Bitter for display/headers, Source Sans 3 for body
  const [bitterLoaded] = useBitterFonts({
    Bitter_400Regular,
    Bitter_500Medium,
    Bitter_600SemiBold,
    Bitter_700Bold,
  })
  
  const [sourceSansLoaded] = useSourceSansFonts({
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  })
  
  const fontsLoaded = bitterLoaded && sourceSansLoaded

  useEffect(() => {
    // Check for existing session and onboarding state on app start
    async function initialize() {
      try {
        // Load saved theme
        const savedTheme = await AsyncStorage.getItem(APP_THEME_KEY)
        if (savedTheme && ['auto', 'light', 'sepia', 'dark'].includes(savedTheme)) {
          setAppThemeState(savedTheme as AppTheme)
        }

        // Check onboarding first
        const onboardingComplete = await checkOnboardingComplete()
        setHasCompletedOnboarding(onboardingComplete)

        // Then check session
        const existingSession = await getSession()
        setSession(existingSession)
        
        // Register background sync if user is logged in
        if (existingSession) {
          registerBackgroundSync()
        }
      } catch (error) {
        console.error('Error during initialization:', error)
        setSession(null)
        setHasCompletedOnboarding(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    initialize()
  }, [])

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  // Handle session changes for background sync
  useEffect(() => {
    if (session) {
      registerBackgroundSync()
    } else {
      unregisterBackgroundSync()
    }
  }, [session])

  // Handle onboarding completion
  const completeOnboarding = async () => {
    await markOnboardingComplete()
    setHasCompletedOnboarding(true)
  }

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null
  }

  // Resolve navigation theme from appTheme setting
  const resolvedTheme = (() => {
    switch (appTheme) {
      case 'light': return PocheLightTheme
      case 'dark': return PocheDarkTheme
      case 'sepia': return PocheSepiaTheme
      default: return colorScheme === 'dark' ? PocheDarkTheme : PocheLightTheme
    }
  })()

  const statusBarStyle = appTheme === 'auto' ? 'auto'
    : appTheme === 'dark' ? 'light'
    : 'dark'

  return (
    <AuthContext.Provider value={{ session, setSession, isLoading, hasCompletedOnboarding, completeOnboarding, appTheme, setAppTheme }}>
      <ThemeProvider value={resolvedTheme}>
        <RootStack session={session} isLoading={isLoading} hasCompletedOnboarding={hasCompletedOnboarding} />
        <StatusBar style={statusBarStyle} />
      </ThemeProvider>
    </AuthContext.Provider>
  )
}

function RootStack({ session, isLoading, hasCompletedOnboarding }: { session: AuthResponse | null, isLoading: boolean, hasCompletedOnboarding: boolean }) {
  const backgroundColor = useThemeColor({}, 'background')
  
  // Show nothing while loading to prevent flash
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={{ width: 64, height: 64 }} 
        />
      </View>
    )
  }
  
  return (
    <Stack 
      screenOptions={{ 
        headerTransparent: true, 
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: backgroundColor },
        animation: 'default',
      }}
    >
      {/* Onboarding - shown first if not completed */}
      <Stack.Protected guard={!hasCompletedOnboarding}>
        <Stack.Screen
          name="onboarding" 
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </Stack.Protected>

      {/* Auth - shown after onboarding if not logged in */}
      <Stack.Protected guard={hasCompletedOnboarding && !session}>
        <Stack.Screen 
          name="auth" 
          options={{
            header: () => <Header showLogo />,
          }}
        />
      </Stack.Protected>

      {/* Main app - shown when logged in */}
      <Stack.Protected guard={hasCompletedOnboarding && !!session}>
        <Stack.Screen
          name="(tabs)" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="articles/index" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="article/[id]" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="search" 
          options={{ 
            headerShown: false,
            animation: "fade_from_bottom",
            animationDuration: 200,
          }} 
        />
      </Stack.Protected>
    </Stack>
  )
}

