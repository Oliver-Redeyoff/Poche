import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/app/_layout'
import { useThemeColor } from '@/hooks/use-theme-color'

export default function ShareRoute() {
  const { hasCompletedOnboarding, session } = useAuth()
  const backgroundColor = useThemeColor({}, 'background')
  const accentColor = useThemeColor({}, 'accent')

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      router.replace('/onboarding')
      return
    }
    if (!session) {
      router.replace('/auth')
      return
    }
    router.replace('/(tabs)')
  }, [hasCompletedOnboarding, session])

  return (
    <View style={{ flex: 1, backgroundColor, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={accentColor} size="small" />
    </View>
  )
}
