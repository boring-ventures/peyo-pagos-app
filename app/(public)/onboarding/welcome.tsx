import { OnboardingIllustration } from '@/app/components/OnboardingIllustration';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(public)/onboarding/carousel' as any);
  };

  const handleSkip = () => {
    router.push('/(public)/login' as any);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Content */}
        <View style={styles.content}>
          {/* Logo/Illustration */}
          <View style={styles.logoContainer}>
            <OnboardingIllustration type="welcome" size={250} />
          </View>
          
          {/* Text Content */}
          <View style={styles.textContainer}>
            <ThemedText type="title" style={styles.title}>
              {Strings.welcome.title}
            </ThemedText>
            
            <ThemedText style={styles.subtitle}>
              {Strings.welcome.subtitle}
            </ThemedText>
          </View>
        </View>
        
        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          <ThemedButton
            title="Get Started"
            size="large"
            onPress={handleGetStarted}
            style={styles.primaryButton}
          />
          
          <ThemedButton
            title="Skip to Login"
            type="text"
            onPress={handleSkip}
            style={styles.secondaryButton}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 10,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    maxWidth: 300,
  },
  actionsContainer: {
    paddingBottom: 32,
    gap: 16,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    alignSelf: 'center',
  },
}); 