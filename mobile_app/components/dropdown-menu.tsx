import { Fragment, ReactNode } from 'react'
import { Button, ContextMenu, Divider, Host } from '@expo/ui/swift-ui'
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
  trigger: ReactNode
  items: DropdownMenuItem[]
  openOnLongPress?: boolean
}

function toSystemIcon(icon?: IconSymbolName): string | undefined {
  if (!icon) return undefined

  const mapping: Partial<Record<IconSymbolName, string>> = {
    'arrow.up.right.square': 'arrow.up.forward.app',
    'book.fill': 'book.fill',
    'book.closed': 'book.closed',
    'trash': 'trash',
    'ellipsis': 'ellipsis',
    'star': 'star',
    'star.fill': 'star.fill',
    'doc.text': 'doc.text',
    'doc.text.fill': 'doc.text.fill',
    'paintpalette': 'paintpalette',
  }

  return mapping[icon]
}

export function DropdownMenu({ trigger, items, openOnLongPress = false }: DropdownMenuProps) {
  return (
    <Host matchContents>
      <ContextMenu activationMethod={openOnLongPress ? 'longPress' : 'singlePress'}>
        <ContextMenu.Items>
          {items.map((item, index) => (
            <Fragment key={item.key}>
              {item.destructive && index > 0 && !items[index - 1].destructive ? <Divider /> : null}
              <Button
                systemImage={toSystemIcon(item.icon)}
                role={item.destructive ? 'destructive' : undefined}
                onPress={item.onPress}
              >
                {item.label}
              </Button>
            </Fragment>
          ))}
        </ContextMenu.Items>

        <ContextMenu.Trigger>
          {trigger}
        </ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  )
}
