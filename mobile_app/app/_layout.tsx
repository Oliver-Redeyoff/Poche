import { DarkTheme, DefaultTheme, ThemeProvider, Theme } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import { View, Image, Alert, AppState, NativeModules, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import RevenueCatUI from 'react-native-purchases-ui'
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
import { getSession, AuthResponse, API_URL } from '@/lib/api'
import { useColorScheme } from '@/hooks/use-color-scheme'
// Import background sync to ensure task is defined
import '@/lib/background-sync'
import { registerBackgroundSync, unregisterBackgroundSync } from '@/lib/background-sync'
import { syncArticles } from '@/lib/article-sync'
import { useThemeColor } from '@/hooks/use-theme-color'
import { Colors, ResolvedColorScheme } from '@/constants/theme'
import { TtsProvider } from '@/contexts/tts-context'

const ONBOARDING_COMPLETE_KEY = '@poche_onboarding_complete'
const APP_THEME_KEY = '@poche_app_theme'
const APP_FONT_SIZE_MULTIPLIER_KEY = '@poche_app_font_size_multiplier'
export const BASE_FONT_SIZE = 18
const DEFAULT_FONT_SIZE_MULTIPLIER = 1
const FONT_SIZE_MULTIPLIER_MIN = 0.4
const FONT_SIZE_MULTIPLIER_MAX = 2
const FONT_SIZE_MULTIPLIER_STEP = 0.2

export type AppTheme = 'auto' | 'light' | 'sepia' | 'dark'

// Prevent splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync()

// Base theme type (fontSizeMultiplier is added when providing to ThemeProvider)
type PocheThemeBase = Theme & { resolvedScheme: ResolvedColorScheme }
export type PocheTheme = PocheThemeBase & { fontSizeMultiplier: number }

// Custom Poche theme colors using unified theme constants
const PocheLightTheme: PocheThemeBase = {
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

const PocheDarkTheme: PocheThemeBase = {
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

const PocheSepiaTheme: PocheThemeBase = {
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
  setSession: (session: AuthResponse | null, options?: { isNewLogin?: boolean }) => void
  isNewLogin: boolean
  clearNewLogin: () => void
  isLoading: boolean
  hasCompletedOnboarding: boolean
  completeOnboarding: () => Promise<void>
  appTheme: AppTheme
  setAppTheme: (theme: AppTheme) => void
  appFontSizeMultiplier: number
  setAppFontSizeMultiplier: (multiplier: number) => void
  isPremium: boolean
  setIsPremium: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  setSession: () => {},
  isNewLogin: false,
  clearNewLogin: () => {},
  isLoading: true,
  hasCompletedOnboarding: true,
  completeOnboarding: async () => {},
  appTheme: 'auto',
  setAppTheme: () => {},
  appFontSizeMultiplier: DEFAULT_FONT_SIZE_MULTIPLIER,
  setAppFontSizeMultiplier: () => {},
  isPremium: false,
  setIsPremium: () => {},
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

// If Share Extension just saved an article (iOS), sync and show feedback
async function checkShareExtensionJustSaved(
  session: AuthResponse | null,
  onArticleLimitReached?: () => void,
): Promise<void> {
  if (!session || Platform.OS !== 'ios' || !NativeModules.PendingShareModule?.getShareExtensionJustSaved) {
    return
  }
  try {
    const justSaved = await NativeModules.PendingShareModule.getShareExtensionJustSaved()
    if (justSaved) {
      const result = await syncArticles(session.user.id, { processImages: true })
      if (result.error?.message.includes('Article limit reached')) {
        onArticleLimitReached?.()
      } else {
        Alert.alert('Saved to Poche', 'Link has been saved to your library.')
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Article limit reached')) {
      onArticleLimitReached?.()
    }
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  const [session, setSessionState] = useState<AuthResponse | null>(null)
  const [isNewLogin, setIsNewLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const setSession = useCallback((newSession: AuthResponse | null, options?: { isNewLogin?: boolean }) => {
    setSessionState(newSession)
    if (newSession === null || options?.isNewLogin !== true) {
      setIsNewLogin(false)
    } else {
      setIsNewLogin(true)
    }
  }, [])

  const clearNewLogin = useCallback(() => setIsNewLogin(false), [])
  const [isPremium, setIsPremium] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true) // Default to true to avoid flash
  const [appTheme, setAppThemeState] = useState<AppTheme>('auto')
  const [appFontSizeMultiplier, setAppFontSizeMultiplierState] = useState<number>(DEFAULT_FONT_SIZE_MULTIPLIER)
  const setAppTheme = useCallback((theme: AppTheme) => {
    setAppThemeState(theme)
    AsyncStorage.setItem(APP_THEME_KEY, theme).catch(() => {})
  }, [])

  const setAppFontSizeMultiplier = useCallback((multiplier: number) => {
    const clamped = Math.round(multiplier / FONT_SIZE_MULTIPLIER_STEP) * FONT_SIZE_MULTIPLIER_STEP
    const value = Math.max(FONT_SIZE_MULTIPLIER_MIN, Math.min(FONT_SIZE_MULTIPLIER_MAX, clamped))
    setAppFontSizeMultiplierState(value)
    AsyncStorage.setItem(APP_FONT_SIZE_MULTIPLIER_KEY, String(value)).catch(() => {})
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

        // Load saved font size multiplier
        const savedMultiplier = await AsyncStorage.getItem(APP_FONT_SIZE_MULTIPLIER_KEY)
        if (savedMultiplier) {
          const n = parseFloat(savedMultiplier)
          if (!isNaN(n) && n >= FONT_SIZE_MULTIPLIER_MIN && n <= FONT_SIZE_MULTIPLIER_MAX) {
            const rounded = Math.round(n / FONT_SIZE_MULTIPLIER_STEP) * FONT_SIZE_MULTIPLIER_STEP
            setAppFontSizeMultiplierState(Math.max(FONT_SIZE_MULTIPLIER_MIN, Math.min(FONT_SIZE_MULTIPLIER_MAX, rounded)))
          }
        }

        // Check onboarding first
        const onboardingComplete = await checkOnboardingComplete()
        setHasCompletedOnboarding(onboardingComplete)

        // Then check session
        const existingSession = await getSession()
        setSession(existingSession)

        // Initialize RevenueCat (iOS only)
        if (Platform.OS === 'ios') {
          const rcKey = Constants.expoConfig?.extra?.revenueCatIosKey as string | undefined
          if (rcKey) {
            if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG)
            Purchases.configure({ apiKey: rcKey })
            if (existingSession) {
              await Purchases.logIn(existingSession.user.id)
              Purchases.getCustomerInfo()
                .then(info => setIsPremium(!!info.entitlements.active['poche_plus']))
                .catch(() => {})
            }
          }
        }

        // If opened from Share Extension after it saved an article, sync and show feedback (iOS only)
        await checkShareExtensionJustSaved(existingSession, () => { RevenueCatUI.presentPaywall().catch(() => {}) })

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

  // When app comes to foreground, check if Share Extension just saved (iOS)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return
      checkShareExtensionJustSaved(session, () => { RevenueCatUI.presentPaywall().catch(() => {}) }).catch(() => {})
    })
    return () => subscription.remove()
  }, [session])

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  // Handle session changes for background sync and Share Extension credentials (iOS)
  useEffect(() => {
    if (session) {
      registerBackgroundSync()
      if (Platform.OS === 'ios') {
        if (NativeModules.PendingShareModule?.setShareCredentials) {
          NativeModules.PendingShareModule.setShareCredentials(session.token, API_URL)
        }
        const rcKey = Constants.expoConfig?.extra?.revenueCatIosKey as string | undefined
        if (rcKey) {
          Purchases.logIn(session.user.id).catch(() => {})
        }
      }
    } else {
      unregisterBackgroundSync()
      if (Platform.OS === 'ios') {
        if (NativeModules.PendingShareModule?.clearShareCredentials) {
          NativeModules.PendingShareModule.clearShareCredentials()
        }
        Purchases.logOut().catch(() => {})
      }
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

  // Theme with app-wide font size multiplier (0.4–2) so all screens scale text
  const themeWithMultiplier: PocheTheme = { ...resolvedTheme, fontSizeMultiplier: appFontSizeMultiplier }

  return (
    <AuthContext.Provider value={{ session, setSession, isNewLogin, clearNewLogin, isLoading, hasCompletedOnboarding, completeOnboarding, appTheme, setAppTheme, appFontSizeMultiplier, setAppFontSizeMultiplier, isPremium, setIsPremium }}>
      <ThemeProvider value={themeWithMultiplier}>
        <TtsProvider>
          <RootStack session={session} isLoading={isLoading} hasCompletedOnboarding={hasCompletedOnboarding} />
          <StatusBar style={statusBarStyle} />
        </TtsProvider>
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
      <Stack.Screen
        name="share"
        options={{
          headerShown: false,
          animation: 'none',
        }}
      />

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
