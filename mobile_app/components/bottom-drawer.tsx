import { useRef, useEffect, useCallback, ReactNode } from 'react'
import { StyleSheet, View, Pressable, Modal, PanResponder } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useResolvedColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

const DRAWER_OFFSCREEN = 400

interface BottomDrawerProps {
  visible: boolean
  onDismiss: () => void
  /** Called on iOS after the Modal animation fully completes and the VC is removed from the hierarchy. */
  onFullyDismissed?: () => void
  children: ReactNode
}

export function BottomDrawer({ visible, onDismiss, onFullyDismissed, children }: BottomDrawerProps) {
  const insets = useSafeAreaInsets()
  const resolvedScheme = useResolvedColorScheme()
  const colors = Colors[resolvedScheme]

  const drawerTranslateY = useSharedValue(DRAWER_OFFSCREEN)

  const drawerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drawerTranslateY.value }],
  }))

  useEffect(() => {
    if (visible) {
      drawerTranslateY.value = DRAWER_OFFSCREEN
      drawerTranslateY.value = withTiming(0, { duration: 250 })
    }
  }, [visible])

  const dismiss = useCallback(() => {
    drawerTranslateY.value = withTiming(DRAWER_OFFSCREEN, { duration: 200 })
    setTimeout(() => {
      onDismiss()
    }, 200)
  }, [onDismiss])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        drawerTranslateY.value = Math.max(0, gestureState.dy)
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 60 || gestureState.vy > 0.5) {
          drawerTranslateY.value = withTiming(DRAWER_OFFSCREEN, { duration: 200 })
          setTimeout(() => {
            onDismiss()
          }, 200)
        } else {
          drawerTranslateY.value = withTiming(0, { duration: 200 })
        }
      },
    })
  ).current

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      onDismiss={onFullyDismissed}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={dismiss} />
        <Animated.View
          style={[
            styles.content,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 },
            drawerAnimStyle,
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center',
    marginBottom: 20,
  },
})
