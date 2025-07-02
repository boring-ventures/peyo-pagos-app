import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type IllustrationType = 'welcome' | 'management' | 'tech' | 'companion';

type OnboardingIllustrationProps = {
  type: IllustrationType;
  size?: number;
};

// Import onboarding images
const images = {
  welcome: require('@/assets/images/onboarding/about-team.png'),
  management: require('@/assets/images/onboarding/performance.png'),
  tech: require('@/assets/images/onboarding/modular-coding.png'),
  companion: require('@/assets/images/onboarding/trophy.png'),
};

export function OnboardingIllustration({ type, size = 200 }: OnboardingIllustrationProps) {
  
  const getImageSource = () => {
    return images[type];
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image 
        source={getImageSource()}
        style={[styles.image, { width: size * 0.9, height: size * 0.9 }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    borderRadius: 20,
  },
});

export default OnboardingIllustration; 