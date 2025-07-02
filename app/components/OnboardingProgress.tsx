import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
  style?: any;
};

export function OnboardingProgress({ currentStep, totalSteps, style }: OnboardingProgressProps) {
  const activeDotColor = useThemeColor({}, 'tint');
  const inactiveDotColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentStep ? activeDotColor : inactiveDotColor,
              transform: [{ scale: index === currentStep ? 1.2 : 1 }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default OnboardingProgress; 