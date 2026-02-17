import { useTheme } from '@react-navigation/native';
import type { ResolvedColorScheme } from '@/constants/theme';

// Re-export the system color scheme (needed by _layout.tsx for 'auto' theme resolution)
export { useColorScheme } from 'react-native';

/**
 * Returns the resolved color scheme ('light' | 'dark' | 'sepia') based on the
 * navigation theme set by our ThemeProvider. This reflects the user's app theme
 * preference, not just the system dark/light setting.
 *
 * Must be used inside the ThemeProvider (i.e. in any screen or component).
 */
export function useResolvedColorScheme(): ResolvedColorScheme {
  const theme = useTheme() as { resolvedScheme?: ResolvedColorScheme; dark: boolean };
  return theme.resolvedScheme ?? (theme.dark ? 'dark' : 'light');
}
