import { Tabs } from 'expo-router'
import { useThemeColor } from '@/hooks/use-theme-color'
import { IconSymbol } from '@/components/ui/icon-symbol'

export default function TabLayout() {
  const backgroundColor = useThemeColor({}, 'background')
  const tintColor = useThemeColor({}, 'tint')
  const iconColor = useThemeColor({}, 'icon')
  const borderColor = useThemeColor({}, 'border')

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: iconColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'SourceSans3_500Medium',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="house.fill" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="books.vertical.fill" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
