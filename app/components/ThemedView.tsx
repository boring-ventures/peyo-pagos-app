import { useThemeColor } from '@/app/hooks/useThemeColor';
import { View, ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  light?: string;
  dark?: string;
};

export function ThemedView(props: ThemedViewProps) {
  const { style, light, dark, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light, dark }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

export default ThemedView; 