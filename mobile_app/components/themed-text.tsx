import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  default: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 16,
  },
  title: {
    fontFamily: 'Bitter_700Bold',
    fontSize: 32,
  },
  defaultSemiBold: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
  },
  subtitle: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 20,
  },
  link: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 16,
  },
})
