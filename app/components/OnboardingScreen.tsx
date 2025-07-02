import { OnboardingIllustration } from '@/app/components/OnboardingIllustration';
import { OnboardingProgress } from '@/app/components/OnboardingProgress';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import { Dimensions, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

type IllustrationType = 'welcome' | 'management' | 'tech' | 'companion';

type OnboardingScreenProps = {
  title: string;
  subtitle: string;
  buttonText: string;
  illustrationType: IllustrationType;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  showSkip?: boolean;
};

export function OnboardingScreen({
  title,
  subtitle,
  buttonText,
  illustrationType,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  showSkip = true,
}: OnboardingScreenProps) {
  const textSecondaryColor = useThemeColor({}, 'textSecondary');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Skip Button */}
        {showSkip && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <ThemedText style={[styles.skipText, { color: textSecondaryColor }]}>
                Skip
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
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

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Progress Indicator */}
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            style={styles.progress}
          />

          {/* Action Button */}
          <ThemedButton
            title={buttonText}
            onPress={onNext}
            size="large"
            style={styles.actionButton}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  bottomSection: {
    paddingBottom: 32,
  },
  progress: {
    marginBottom: 32,
  },
  actionButton: {
    width: '100%',
    marginHorizontal: 0,
  },
});

export default OnboardingScreen; 