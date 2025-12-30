/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Poche brand colors - warm tones that are easy on the eyes
const accentLight = '#EF4056'; // Poche coral
const accentDark = '#F06B7E'; // Lighter coral for dark mode

export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    background: '#FAFAF8', // Warm off-white
    tint: accentLight,
    icon: '#666666',
    tabIconDefault: '#999999',
    tabIconSelected: accentLight,
    divider: '#E8E4E0',
    accent: accentLight,
  },
  dark: {
    text: '#E8E4DF',
    textSecondary: '#A8A4A0',
    textMuted: '#787470',
    background: '#1C1A18', // Warm dark
    tint: accentDark,
    icon: '#A8A4A0',
    tabIconDefault: '#787470',
    tabIconSelected: accentDark,
    divider: '#2E2C2A',
    accent: accentDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
