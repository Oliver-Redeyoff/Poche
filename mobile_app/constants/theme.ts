/**
 * Poche theme colors - unified with @poche/shared color palette
 * These colors are used throughout the app for consistent styling.
 */

import { Platform } from 'react-native';
import { colors } from '@poche/shared';

// Re-export shared colors for convenience
export const sharedColors = colors;

// App-specific color mappings using the shared palette
export const Colors = {
  light: {
    // Text colors
    text: colors.light.text.primary,
    textSecondary: colors.light.text.secondary,
    textMuted: colors.light.text.tertiary,
    
    // Background colors
    background: colors.light.background.primary,
    card: colors.light.background.tertiary,
    surface: colors.light.background.secondary,
    
    // Brand/accent colors
    tint: colors.light.brand.primary,
    accent: colors.light.brand.primary,
    accentLight: colors.light.brand.primaryLight,
    accentDark: colors.light.brand.primaryDark,
    
    // UI colors
    icon: colors.light.text.secondary,
    tabIconDefault: colors.light.text.tertiary,
    tabIconSelected: colors.light.brand.primary,
    divider: colors.light.border.primary,
    border: colors.light.border.primary,
    
    // Semantic colors
    success: colors.light.semantic.success,
    successLight: colors.light.semantic.successLight,
    warning: colors.light.semantic.warning,
    warningLight: colors.light.semantic.warningLight,
    error: colors.light.semantic.error,
    errorLight: colors.light.semantic.errorLight,
    info: colors.light.semantic.info,
    infoLight: colors.light.semantic.infoLight,
  },
  dark: {
    // Text colors
    text: colors.dark.text.primary,
    textSecondary: colors.dark.text.secondary,
    textMuted: colors.dark.text.tertiary,
    
    // Background colors
    background: colors.dark.background.primary,
    card: colors.dark.background.tertiary,
    surface: colors.dark.background.secondary,
    
    // Brand/accent colors
    tint: colors.dark.brand.primary,
    accent: colors.dark.brand.primary,
    accentLight: colors.dark.brand.primaryLight,
    accentDark: colors.dark.brand.primaryDark,
    
    // UI colors
    icon: colors.dark.text.secondary,
    tabIconDefault: colors.dark.text.tertiary,
    tabIconSelected: colors.dark.brand.primary,
    divider: colors.dark.border.primary,
    border: colors.dark.border.primary,
    
    // Semantic colors
    success: colors.dark.semantic.success,
    successLight: colors.dark.semantic.successLight,
    warning: colors.dark.semantic.warning,
    warningLight: colors.dark.semantic.warningLight,
    error: colors.dark.semantic.error,
    errorLight: colors.dark.semantic.errorLight,
    info: colors.dark.semantic.info,
    infoLight: colors.dark.semantic.infoLight,
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
