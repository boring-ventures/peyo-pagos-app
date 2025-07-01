import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps
} from 'react-native';

type ButtonType = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

export type ThemedButtonProps = TouchableOpacityProps & {
  title: string;
  type?: ButtonType;
  size?: ButtonSize;
  loading?: boolean;
  light?: string;
  dark?: string;
};

export function ThemedButton(props: ThemedButtonProps) {
  const { 
    title, 
    type = 'primary', 
    size = 'medium',
    style, 
    light, 
    dark, 
    loading = false,
    disabled,
    ...otherProps 
  } = props;
  
  const backgroundColor = useThemeColor({ light, dark }, type === 'primary' ? 'tint' : 'background');
  const textColor = useThemeColor({}, type === 'primary' ? 'background' : 'tint');
  const borderColor = useThemeColor({}, 'tint');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  
  const getButtonStyle = () => {
    let baseStyle = {
      ...styles.button,
      ...sizeStyles[size],
    };
    
    switch (type) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor,
          opacity: disabled ? 0.6 : 1,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: backgroundSecondary,
          opacity: disabled ? 0.6 : 1,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };
  
  const getTextStyle = () => {
    let baseStyle = {
      ...styles.text,
      ...textSizeStyles[size],
    };
    
    switch (type) {
      case 'primary':
        return {
          ...baseStyle,
          color: textColor,
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: textColor,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: borderColor,
        };
      case 'text':
        return {
          ...baseStyle,
          color: textColor,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      {...otherProps}
    >
      {loading ? (
        <ActivityIndicator color={type === 'primary' ? textColor : borderColor} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
});

const sizeStyles = {
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 80,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: 150,
  },
};

const textSizeStyles = {
  small: {
    fontSize: 14,
  },
  medium: {
    fontSize: 16,
  },
  large: {
    fontSize: 18,
  },
}; 