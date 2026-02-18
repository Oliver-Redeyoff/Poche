import { Text, type TextProps } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { BASE_FONT_SIZE, type PocheTheme } from '@/app/_layout';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  fontSize?: number;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  fontSize,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const theme = useTheme() as PocheTheme;
  const multiplier = theme.fontSizeMultiplier ?? 1;

  return (
    <Text
      style={[
        { color },
        style,
        { fontSize: fontSize ? fontSize*multiplier : undefined }
      ]}
      {...rest}
    />
  )
}
