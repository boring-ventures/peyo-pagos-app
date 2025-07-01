import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Text, TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  light?: string;
  dark?: string;
  type?: 'default' | 'title' | 'subtitle' | 'link' | 'defaultSemiBold';
};

export function ThemedText(props: ThemedTextProps) {
  const { style, light, dark, type = 'default', ...otherProps } = props;
  const color = useThemeColor({ light, dark }, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const getFontStyle = () => {
    switch (type) {
      case 'title':
        return { fontSize: 22, fontWeight: '700' as const };
      case 'subtitle':
        return { fontSize: 16, fontWeight: '600' as const };
      case 'link':
        return { color: tintColor, textDecorationLine: 'underline' as const };
      case 'defaultSemiBold':
        return { fontWeight: '600' as const };
      default:
        return {};
    }
  };

  return <Text style={[{ color }, getFontStyle(), style]} {...otherProps} />;
}

export default ThemedText; 