import { useRef, useState, useCallback, ReactNode } from 'react'
import { StyleSheet, View, Pressable, Modal, useWindowDimensions } from 'react-native'
import { ThemedText } from './themed-text'
import { IconSymbol } from './ui/icon-symbol'
import { useResolvedColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

type IconSymbolName = React.ComponentProps<typeof IconSymbol>['name']

export interface DropdownMenuItem {
  key: string
  label: string
  icon?: IconSymbolName
  destructive?: boolean
  onPress: () => void
}

interface DropdownMenuProps {
  /** The trigger element (rendered inside a measurable wrapper) */
  trigger: ReactNode
  /** Menu items to display */
  items: DropdownMenuItem[]
}

const MENU_MIN_WIDTH = 200
const SCREEN_PADDING = 8

interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const resolvedScheme = useResolvedColorScheme()
  const isDark = resolvedScheme === 'dark'
  const [visible, setVisible] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({})
  const [menuReady, setMenuReady] = useState(false)
  const triggerRef = useRef<View>(null)
  const triggerLayoutRef = useRef<TriggerLayout>({ x: 0, y: 0, width: 0, height: 0 })

  const open = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      triggerLayoutRef.current = { x, y, width, height }
      setMenuReady(false)
      setVisible(true)
    })
  }, [])

  const handleMenuLayout = useCallback((event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const menuWidth = event.nativeEvent.layout.width
    const menuHeight = event.nativeEvent.layout.height
    const trigger = triggerLayoutRef.current

    // Vertical: prefer below the trigger, flip above if not enough space
    const spaceBelow = screenHeight - (trigger.y + trigger.height + 4)
    const spaceAbove = trigger.y - 4
    const placeBelow = spaceBelow >= menuHeight || spaceBelow >= spaceAbove

    // Horizontal: prefer right-aligned with trigger, flip to left-aligned if it goes off-screen
    const rightAlignedLeft = trigger.x + trigger.width - menuWidth
    const leftAlignedLeft = trigger.x

    let left: number
    if (rightAlignedLeft >= SCREEN_PADDING) {
      // Right-aligned fits
      left = rightAlignedLeft
    } else if (leftAlignedLeft + menuWidth <= screenWidth - SCREEN_PADDING) {
      // Left-aligned fits
      left = leftAlignedLeft
    } else {
      // Neither fits perfectly, clamp to screen edges
      left = Math.max(SCREEN_PADDING, Math.min(screenWidth - menuWidth - SCREEN_PADDING, leftAlignedLeft))
    }

    const style: { top?: number; bottom?: number; left: number } = { left }
    if (placeBelow) {
      style.top = trigger.y + trigger.height + 4
    } else {
      style.bottom = screenHeight - trigger.y + 4
    }

    setMenuStyle(style)
    setMenuReady(true)
  }, [screenWidth, screenHeight])

  const handleAction = useCallback((action: () => void) => {
    setVisible(false)
    setTimeout(action, 100)
  }, [])

  const themeColors = Colors[resolvedScheme]
  const textColor = themeColors.text
  const bgColor = themeColors.card
  const separatorColor = themeColors.divider

  const renderItems = () => {
    const elements: ReactNode[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.destructive && i > 0 && !items[i - 1].destructive) {
        elements.push(
          <View key={`sep-${item.key}`} style={[styles.separator, { backgroundColor: separatorColor }]} />
        )
      }
      const color = item.destructive ? '#FF3B30' : textColor
      elements.push(
        <Pressable
          key={item.key}
          onPress={() => handleAction(item.onPress)}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        >
          {item.icon && <IconSymbol name={item.icon} size={18} color={color} />}
          <ThemedText fontSize={16} style={[styles.itemText, { color }]}>
            {item.label}
          </ThemedText>
        </Pressable>
      )
    }
    return elements
  }

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable onPress={open}>
          {trigger}
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View
            onLayout={handleMenuLayout}
            style={[
              styles.menu,
              { backgroundColor: bgColor, opacity: menuReady ? 1 : 0 },
              menuReady ? menuStyle : styles.menuMeasuring,
            ]}
          >
            {renderItems()}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    minWidth: MENU_MIN_WIDTH,
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  menuMeasuring: {
    top: -9999,
    left: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  itemPressed: {
    opacity: 0.5,
  },
  itemText: {
    fontFamily: 'SourceSans3_400Regular',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
})
