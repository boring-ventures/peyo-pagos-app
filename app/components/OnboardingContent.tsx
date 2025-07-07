import { OnboardingIllustration } from '@/app/components/OnboardingIllustration';
import { ThemedText } from '@/app/components/ThemedText';
import React from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');

type IllustrationType = 'welcome' | 'management' | 'tech' | 'companion';

type OnboardingContentProps = {
  title: string;
  subtitle: string;
  illustrationType: IllustrationType;
  style?: ViewStyle;
};

export function OnboardingContent({
  title,
  subtitle,
  illustrationType,
  style,
}: OnboardingContentProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <OnboardingIllustration type={illustrationType} size={350} />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
    width: '100%',
  },
});

export default OnboardingContent; 