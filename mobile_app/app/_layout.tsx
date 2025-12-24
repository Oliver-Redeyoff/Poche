import { DarkTheme, DefaultTheme, ThemeProvider, useTheme } from '@react-navigation/native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import React, { useState, useEffect } from 'react'
import { View, Image } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import Auth from '@/components/auth'
import { useColorScheme } from '@/hooks/use-color-scheme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemedText } from '@/components/themed-text'

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
      <RootStack />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

function RootStack() {
  const { colors } = useTheme()
  
  return (
    <Stack 
      screenOptions={{ 
        headerTransparent: true, 
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
        animation: 'default',
      }}
    >
      <Stack.Screen
        name="index" 
        options={{
          headerTitle: () => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Image source={require('@/assets/images/logo.png')} style={{ width: 24, height: 24 }} />
              <ThemedText type="title">posh</ThemedText>
            </View>,
          headerRight: () => <Ionicons onPress={() => router.push('/settings')} name="settings-outline" size={24} color={colors.text} /> 
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ title: "posh" }} 
      />
      <Stack.Screen 
        name="modal" 
        options={{ presentation: "modal", title: "Modal" }} 
      />
      <Stack.Screen 
        name="article/[id]" 
        options={{ title: "" }} 
      />
    </Stack>
  )
}
