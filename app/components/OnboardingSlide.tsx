import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import React from 'react';
import { Dimensions, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

type OnboardingSlideProps = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
};

const { width, height } = Dimensions.get('window');

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  title,
  subtitle,
  image,
}) => {
  return (
    <ThemedView style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="contain" />
      </View>
      
      <View style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  slide: {
    width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
}); 