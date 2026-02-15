import { useRef, useState, useCallback, ReactNode } from 'react'
import { StyleSheet, View, Pressable, Modal, useWindowDimensions, useColorScheme } from 'react-native'
import { ThemedText } from './themed-text'
import { IconSymbol } from './ui/icon-symbol'

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

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const { width: screenWidth } = useWindowDimensions()
  const isDark = useColorScheme() === 'dark'
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<View>(null)

  const open = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setPosition({ top: y + height + 4, right: screenWidth - (x + width) })
      setVisible(true)
    })
  }, [screenWidth])

  const handleAction = useCallback((action: () => void) => {
    setVisible(false)
    setTimeout(action, 100)
  }, [])

  const textColor = isDark ? '#FFFFFF' : '#000000'
  const bgColor = isDark ? '#2C2C2E' : '#FFFFFF'
  const separatorColor = isDark ? '#3A3A3C' : '#E5E5EA'

  // Insert separators before destructive items
  const renderItems = () => {
    const elements: ReactNode[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      // Add separator before first destructive item if previous item wasn't destructive
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
          <ThemedText style={[styles.itemText, { color }]}>
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
          <View style={[
            styles.menu,
            { top: position.top, right: position.right, backgroundColor: bgColor }
          ]}>
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
    minWidth: 200,
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
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
    fontSize: 16,
    fontFamily: 'SourceSans3_400Regular',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
})
