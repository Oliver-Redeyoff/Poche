/**
 * Poche theme colors - unified with @poche/shared color palette
 * These colors are used throughout the app for consistent styling.
 */

import { Platform } from 'react-native';
import { colors } from '@poche/shared';

// Re-export shared colors for convenience
export const sharedColors = colors;

// The three resolved color schemes the app supports
export type ResolvedColorScheme = 'light' | 'dark' | 'sepia'

// App-specific color mappings using the shared palette
export const Colors: Record<ResolvedColorScheme, {
  text: string; textSecondary: string; textMuted: string;
  background: string; card: string; surface: string;
  tint: string; accent: string; accentLight: string; accentDark: string;
  icon: string; tabIconDefault: string; tabIconSelected: string;
  divider: string; border: string;
  success: string; successLight: string; warning: string; warningLight: string;
  error: string; errorLight: string; info: string; infoLight: string;
}> = {
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
  sepia: {
    // Text colors
    text: '#3D3229',
    textSecondary: '#6B5D4F',
    textMuted: '#9A8B7A',
    
    // Background colors
    background: '#F5ECD7',
    card: '#EDE3CA',
    surface: '#F0E5CE',
    
    // Brand/accent colors
    tint: '#D44A5C',
    accent: '#D44A5C',
    accentLight: '#F2D0D5',
    accentDark: '#B03344',
    
    // UI colors
    icon: '#6B5D4F',
    tabIconDefault: '#9A8B7A',
    tabIconSelected: '#D44A5C',
    divider: '#D4C9B0',
    border: '#D4C9B0',
    
    // Semantic colors (same as light for readability on warm backgrounds)
    success: colors.light.semantic.success,
    successLight: '#E8F0E0',
    warning: colors.light.semantic.warning,
    warningLight: '#F5ECDA',
    error: colors.light.semantic.error,
    errorLight: '#F5DDD8',
    info: colors.light.semantic.info,
    infoLight: '#DDE8F0',
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
