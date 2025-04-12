import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Placeholder para los logos hasta que el usuario los coloque
const logoLight = require('@/assets/images/icon-light.png');
const logoDark = require('@/assets/images/icon-dark.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const logo = useThemedAsset(logoLight, logoDark);

  const handleStart = () => {
    router.push('/(public)/onboarding/carousel' as any);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.contentContainer}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        
        <ThemedText type="title" style={styles.title}>
          {Strings.welcome.title}
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          {Strings.welcome.subtitle}
        </ThemedText>
      </View>
      
      <View style={styles.buttonContainer}>
        <ThemedButton
          title={Strings.common.start}
          size="large"
          onPress={handleStart}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
}); 