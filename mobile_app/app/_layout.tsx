import { DarkTheme, DefaultTheme, ThemeProvider, Theme } from '@react-navigation/native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import React, { useState, useEffect, useMemo } from 'react'
import { View, Image, Pressable } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { ThemedText } from '@/components/themed-text'
// Import background sync to ensure task is defined
import '@/lib/background-sync'
import { registerBackgroundSync, unregisterBackgroundSync } from '@/lib/background-sync'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useThemeColor } from '@/hooks/use-theme-color'

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

export default function RootLayout() {
  const colorScheme = useColorScheme()

  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      // Register background sync if user is logged in
      if (session) {
        registerBackgroundSync()
      }
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      
      // Register or unregister background sync based on auth state
      if (session) {
        await registerBackgroundSync()
      } else {
        await unregisterBackgroundSync()
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <ThemeProvider value={colorScheme === 'dark' ? PocheDarkTheme : PocheLightTheme}>
      <RootStack session={session} />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

function RootStack({session}: {session: Session | null}) {
  const backgroundColor = useThemeColor({}, 'background')
  const textColor = useThemeColor({}, 'text')
  
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
      <ThemedText style={{ fontSize: 32, lineHeight: 32, fontWeight: 'bold' }}>poche</ThemedText>
    </View>
  )
}