import { ThemedText } from '@/app/components/ThemedText';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

interface OTPInputProps {
  value: string;
  length: number;
  width?: number;
  height?: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, length, width = 60, height = 60 }) => {
  const otpArray = Array(length).fill(0);
  const colorScheme = useColorScheme();
  
  const primaryColor = useThemeColor({}, 'tint');
  const boxBackgroundColor = colorScheme === 'dark' ? '#2D3F5B' : useThemeColor({}, 'card');

  return (
    <View style={styles.container}>
      {otpArray.map((_, index) => {
        const char = value[index];
        const isFocused = index === value.length;

        return (
          <View
            key={index}
            style={[
              styles.box,
              { 
                width: width,
                height: height,
                backgroundColor: boxBackgroundColor,
                borderColor: isFocused ? primaryColor : 'transparent',
              },
            ]}
          >
            {char ? <ThemedText style={styles.digit}>{char}</ThemedText> : <View style={styles.placeholder} />}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  box: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  digit: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 2,
    height: 24,
    backgroundColor: '#9DA3AF', // A neutral placeholder color
  }
});

export default OTPInput; 