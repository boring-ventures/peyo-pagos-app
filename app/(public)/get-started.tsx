import { OnboardingIllustration } from '@/app/components/OnboardingIllustration';
import { SocialAuthButton } from '@/app/components/SocialAuthButton';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');

  const handleBack = () => {
    router.back();
  };

  const handleSocialAuth = (provider: string) => {
    // Placeholder for OAuth implementation
    Alert.alert(`${provider} Auth`, `${provider} authentication will be implemented here`);
  };

  const handleLogin = () => {
    router.push('/(public)/login' as any);
  };

  const handleSignUp = () => {
    router.push('/(public)/register' as any);
  };

  return (
    <View style={styles.container}>
      {/* Dark Background */}
      <View style={styles.backgroundOverlay} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Modal Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.card, { backgroundColor }]}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <OnboardingIllustration type="welcome" size={80} />
            </View>

            {/* Title and Subtitle */}
            <View style={styles.textContainer}>
              <ThemedText type="title" style={styles.title}>
                Begin Your Journey
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Get started today and take control of your finances effortlessly
              </ThemedText>
            </View>

            {/* Social Auth Buttons */}
            <View style={styles.socialButtonsContainer}>
              <SocialAuthButton
                provider="google"
                onPress={() => handleSocialAuth('Google')}
              />
              
              {Platform.OS === 'ios' && (
                <SocialAuthButton
                  provider="apple"
                  onPress={() => handleSocialAuth('Apple')}
                />
              )}
              
              <SocialAuthButton
                provider="twitter"
                onPress={() => handleSocialAuth('Twitter/X')}
              />
            </View>

            {/* Primary Login Button */}
            <View style={styles.primaryButtonContainer}>
              <ThemedButton
                title="Login"
                onPress={handleLogin}
                size="large"
                style={styles.loginButton}
              />
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <ThemedText style={[styles.signUpText, { color: textSecondaryColor }]}>
                Don't have an account?{' '}
              </ThemedText>
              <TouchableOpacity onPress={handleSignUp}>
                <ThemedText type="link" style={styles.signUpLink}>
                  Sign up
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A2B42', // Peyo brand dark color
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
    maxWidth: 280,
  },
  socialButtonsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  primaryButtonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  loginButton: {
    width: '100%',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 