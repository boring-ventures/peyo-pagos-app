import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type IllustrationType = 'welcome' | 'management' | 'tech' | 'companion';

type OnboardingIllustrationProps = {
  type: IllustrationType;
  size?: number;
};

// Import onboarding images - using relative paths
const images = {
  welcome: require('@/assets/images/onboarding/welcome.png'),
  management: require('@/assets/images/onboarding/payments.png'),
  tech: require('@/assets/images/onboarding/card.png'),
  companion: require('@/assets/images/onboarding/receive.png'),
};

export function OnboardingIllustration({ type, size = 300 }: OnboardingIllustrationProps) {
  const backgroundColor = useThemeColor({}, 'background');
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image 
        source={images[type]}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default OnboardingIllustration; 