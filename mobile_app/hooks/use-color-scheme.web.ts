import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useTheme } from '@react-navigation/native';
import type { ResolvedColorScheme } from '@/constants/theme';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}

/**
 * Returns the resolved color scheme ('light' | 'dark' | 'sepia') based on the
 * navigation theme set by our ThemeProvider.
 */
export function useResolvedColorScheme(): ResolvedColorScheme {
  const theme = useTheme() as { resolvedScheme?: ResolvedColorScheme; dark: boolean };
  return theme.resolvedScheme ?? (theme.dark ? 'dark' : 'light');
}
