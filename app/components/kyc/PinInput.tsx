import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface PinInputProps {
  pinLength: number;
  pin: string;
}

const PinInput: React.FC<PinInputProps> = ({ pinLength, pin }) => {
  const pinArray = Array(pinLength).fill(0);
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.container}>
      {pinArray.map((_, index) => {
        const isFilled = index < pin.length;
        return (
          <View
            key={index}
            style={[
              styles.pinBox,
              {
                borderColor: isFilled ? primaryColor : textColor,
              },
            ]}
          >
            {isFilled && <View style={[styles.pinDot, { backgroundColor: primaryColor }]} />}
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
    marginVertical: 20,
  },
  pinBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default PinInput; 