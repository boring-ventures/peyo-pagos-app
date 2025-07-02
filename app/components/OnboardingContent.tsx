import { OnboardingIllustration } from '@/app/components/OnboardingIllustration';
import { ThemedText } from '@/app/components/ThemedText';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

type IllustrationType = 'welcome' | 'management' | 'tech' | 'companion';

type OnboardingContentProps = {
  title: string;
  subtitle: string;
  illustrationType: IllustrationType;
};

export function OnboardingContent({
  title,
  subtitle,
  illustrationType,
}: OnboardingContentProps) {
  return (
    <View style={styles.container}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <OnboardingIllustration type={illustrationType} size={240} />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    maxWidth: 320,
  },
});

export default OnboardingContent; 