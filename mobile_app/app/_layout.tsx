import { DarkTheme, DefaultTheme, ThemeProvider, Theme } from '@react-navigation/native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import React, { useState, useEffect, createContext, useContext } from 'react'
import { View, Image, Pressable } from 'react-native'
import {
  useFonts,
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans'
import * as SplashScreen from 'expo-splash-screen'
import { getSession, AuthResponse } from '@/lib/api'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { ThemedText } from '@/components/themed-text'
// Import background sync to ensure task is defined
import '@/lib/background-sync'
import { registerBackgroundSync, unregisterBackgroundSync } from '@/lib/background-sync'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useThemeColor } from '@/hooks/use-theme-color'

// Prevent splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync()

// Custom Poche theme colors - warm tones that are easy on the eyes
const PocheLightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#EF4056', // Poche coral accent
    background: '#f2f2f2', // Warm off-white
    card: 'white',
    text: '#1A1A1A',
    border: '#E8E4E0',
    notification: '#EF4056',
  },
  fonts: DefaultTheme.fonts,
}

const PocheDarkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#F06B7E', // Lighter coral for dark mode
    background: '#1C1A18', // Warm dark
    card: '#151413',
    text: '#E8E4DF',
    border: '#2E2C2A',
    notification: '#F06B7E',
  },
  fonts: DarkTheme.fonts,
}

// Auth context to share session state across the app
interface AuthContextType {
  session: AuthResponse | null
  setSession: (session: AuthResponse | null) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  setSession: () => {},
  isLoading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  const [session, setSession] = useState<AuthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load custom fonts with different weights
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  })

  useEffect(() => {
    // Check for existing session on app start
    async function checkSession() {
      try {
        const existingSession = await getSession()
        setSession(existingSession)
        
        // Register background sync if user is logged in
        if (existingSession) {
          registerBackgroundSync()
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSession()
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

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null
  }

  return (
    <AuthContext.Provider value={{ session, setSession, isLoading }}>
      <ThemeProvider value={colorScheme === 'dark' ? PocheDarkTheme : PocheLightTheme}>
        <RootStack session={session} isLoading={isLoading} />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthContext.Provider>
  )
}

function RootStack({ session, isLoading }: { session: AuthResponse | null, isLoading: boolean }) {
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  
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
      <Stack.Protected guard={!session}>
        <Stack.Screen 
        name="auth" 
        options={{
          headerTitle: () => <HeaderLogo />,
        }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen
          name="index" 
          options={{
            headerTitle: () => <HeaderLogo />,
            headerRight: () => (
              <Pressable 
                onPress={() => router.push('/settings')}
                style={({ pressed }) => [
                  {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 4,
                  },
                  pressed && { opacity: 0.6 }
                ]}
              >
                <IconSymbol name="gear" size={26} color={textColor} />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerTitle: () => <HeaderLogo />,
          }} 
        />
        <Stack.Screen 
          name="article/[id]" 
          options={{ title: "" }} 
        />
      </Stack.Protected>
    </Stack>
  )
}

function HeaderLogo() {
  const colorScheme = useColorScheme()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Image 
        source={ require('@/assets/images/icon.png') } 
        style={{ width: 24, height: 24 }} 
      />
      <ThemedText style={{ fontSize: 28, letterSpacing: -1, lineHeight: 32, fontFamily: 'NotoSans_700Bold' }}>poche</ThemedText>
    </View>
  )
}
