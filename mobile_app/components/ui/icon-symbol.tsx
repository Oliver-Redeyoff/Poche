import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import { useAuth } from '@/app/_layout';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.down': 'expand-more',
  'trash': 'delete-outline',
  'gear': 'settings',
  // Onboarding icons
  'books.vertical': 'library-books',
  'square.and.arrow.down': 'download',
  'icloud.and.arrow.down': 'cloud-download',
  'tag': 'label-outline',
  // External link
  'arrow.up.right.square': 'open-in-new',
  // Favorites
  'star': 'star-outline',
  'star.fill': 'star',
  // Documents
  'doc.text': 'article',
  'doc.text.fill': 'article',
  // More / ellipsis
  'ellipsis': 'more-horiz',
  'ellipsis.circle': 'more-horiz',
  // Reading status
  'book.closed': 'menu-book',
  'book.fill': 'auto-stories',
  'checkmark.circle': 'check-circle',
  'checkmark.circle.fill': 'check-circle',
  'person': 'person',
  'paintpalette': 'palette',
  // Search
  'magnifyingglass': 'search',
  // TTS player
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'backward.end.fill': 'skip-previous',
  'forward.end.fill': 'skip-next',
  'xmark': 'close',
  'waveform': 'graphic-eq',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const { appFontSizeMultiplier } = useAuth();
  const scaledSize = Math.round(size * appFontSizeMultiplier);

  return <MaterialIcons color={color} size={scaledSize} name={MAPPING[name]} style={style} />;
}
