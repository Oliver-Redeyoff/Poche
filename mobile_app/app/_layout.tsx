import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import Auth from '@/components/auth'
import { useColorScheme } from '@/hooks/use-color-scheme'
import Ionicons from '@expo/vector-icons/Ionicons'

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
        <Stack.Screen 
          name="index" 
          options={{ 
            headerTransparent: true, 
            headerBackButtonDisplayMode: "minimal", 
            title: 'posh', 
            headerRight: () => <Ionicons onPress={() => router.push('/settings')} name="settings-outline" size={24} color="white" /> 
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ title: "posh", headerTransparent: true, headerBackButtonDisplayMode: "minimal" }} 
        />
        <Stack.Screen 
          name="modal" 
          options={{ presentation: "modal", title: "Modal" }} 
        />
        <Stack.Screen 
          name="article/[id]" 
          options={{ title: "", headerTransparent: true, headerBackButtonDisplayMode: "minimal" }} 
          />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
