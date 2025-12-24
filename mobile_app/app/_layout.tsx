import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import React, { useState, useEffect } from 'react'
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs'
import { View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import Auth from '@/components/auth'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })
  }, [])

  // Show auth screen when not logged in
  if (!loading && !session) {
    return (
      <View style={{ flex: 1 }}>
        <Auth />
      </View>
    )
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: true, headerTransparent: true, headerBackButtonDisplayMode: "minimal", title: 'posh' }} />
        <Stack.Screen name="explore" options={{ headerShown: true, title: 'posh' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="article/[id]" options={{ title: "", headerTransparent: true, headerBackButtonDisplayMode: "minimal", }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
