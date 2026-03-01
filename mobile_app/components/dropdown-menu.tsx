import { Fragment, ReactNode } from 'react'
import { Button, ContextMenu, Divider, Host, Menu } from '@expo/ui/swift-ui'
import { IconSymbol } from './ui/icon-symbol'
import {SFSymbols7_0} from "sf-symbols-typescript";

type IconSymbolName = React.ComponentProps<typeof IconSymbol>['name']

export interface DropdownMenuItem {
  key: string
  label: string
  icon?: IconSymbolName
  destructive?: boolean
  onPress: () => void
}

interface DropdownMenuProps {
  style: any
  triggerType: "press" | "longPress"
  trigger: ReactNode
  items: DropdownMenuItem[]
}

function toSystemIcon(icon?: IconSymbolName): SFSymbols7_0 | undefined {
  if (!icon) return undefined

  const mapping: Partial<Record<IconSymbolName, SFSymbols7_0>> = {
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

export function DropdownMenu({ style, triggerType, trigger, items }: DropdownMenuProps) {
  if (triggerType === 'longPress') {
    return (
        <Host style={style}>
          <ContextMenu>
            <ContextMenu.Items>
              {items.map((item, index) => (
                  <Fragment key={item.key}>
                    {item.destructive && index > 0 && !items[index - 1].destructive ? <Divider /> : null}
                    <Button
                        label={item.label}
                        systemImage={toSystemIcon(item.icon)}
                        role={item.destructive ? 'destructive' : undefined}
                        onPress={item.onPress}
                    />
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

  return (
    <Host style={style}>
      <Menu label={trigger}>
        {items.map((item, index) => (
          <Fragment key={item.key}>
            {item.destructive && index > 0 && !items[index - 1].destructive ? <Divider /> : null}
            <Button
              label={item.label}
              systemImage={toSystemIcon(item.icon)}
              role={item.destructive ? 'destructive' : undefined}
              onPress={item.onPress}
            />
          </Fragment>
        ))}
      </Menu>
    </Host>
  )
}
