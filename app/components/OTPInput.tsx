import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface OTPInputProps {
  value: string;
  length?: number;
  error?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  length = 4,
  error = false,
}) => {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');

  const digits = value.split('');

  const getDigitStyle = (index: number) => {
    const hasValue = digits[index] !== undefined;
    const isActive = index === digits.length && !error;
    const isError = error && hasValue;

    return [
      styles.digit,
      {
        backgroundColor,
        borderColor: isError 
          ? errorColor 
          : isActive 
            ? primaryColor 
            : hasValue 
              ? primaryColor 
              : borderColor,
        borderWidth: isError || isActive || hasValue ? 2 : 1,
      }
    ];
  };

  const getDigitTextStyle = (index: number) => {
    const hasValue = digits[index] !== undefined;
    return [
      styles.digitText,
      {
        color: hasValue ? textColor : textSecondaryColor,
      }
    ];
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }, (_, index) => (
        <View key={index} style={getDigitStyle(index)}>
          <Text style={getDigitTextStyle(index)}>
            {digits[index] || ''}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  digit: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  digitText: {
    fontSize: 24,
    fontWeight: '600',
  },
});

export default OTPInput; 