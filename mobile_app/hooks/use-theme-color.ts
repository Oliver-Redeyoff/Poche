/**
 * Returns a color from the app's resolved theme (auto/light/sepia/dark).
 * Uses the navigation theme's resolvedScheme, so it respects the user's preference.
 */

import { Colors } from '@/constants/theme';
import { useResolvedColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const scheme = useResolvedColorScheme();

  // Props override: light/dark overrides (sepia falls through to light)
  const propsKey = scheme === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[propsKey];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[scheme][colorName];
}
