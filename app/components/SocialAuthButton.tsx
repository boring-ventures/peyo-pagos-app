import { useThemeColor } from '@/app/hooks/useThemeColor';
import { FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

type SocialProvider = 'google' | 'apple' | 'twitter';

export type SocialAuthButtonProps = TouchableOpacityProps & {
  provider: SocialProvider;
  onPress: () => void;
};

export function SocialAuthButton({ provider, onPress, style, ...otherProps }: SocialAuthButtonProps) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Continue with Google',
          icon: 'google' as keyof typeof FontAwesome6.glyphMap,
          iconColor: '#DB4437',
        };
      case 'apple':
        return {
          title: 'Continue with Apple',
          icon: 'apple' as keyof typeof FontAwesome6.glyphMap,
          iconColor: textColor,
        };
      case 'twitter':
        return {
          title: 'Continue with X',
          icon: 'x-twitter' as keyof typeof FontAwesome6.glyphMap,
          iconColor: '#1DA1F2',
        };
      default:
        return {
          title: 'Continue',
          icon: 'sign-in-alt' as keyof typeof FontAwesome6.glyphMap,
          iconColor: textColor,
        };
    }
  };

  const config = getProviderConfig();

  // Don't render Apple button on Android
  if (provider === 'apple' && Platform.OS === 'android') {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      {...otherProps}
    >
      <FontAwesome6 name={config.icon} size={20} color={config.iconColor} style={styles.icon} />
      <Text style={[styles.text, { color: textColor }]}>{config.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SocialAuthButton; 