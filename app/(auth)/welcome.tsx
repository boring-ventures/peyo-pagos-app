import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { useAuthStore } from '@/app/store';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const successAsset = useThemedAsset(
    require('@/assets/images/onboarding/success.png'),
    require('@/assets/images/onboarding/success.png')
  );

  // fixed dark logo as requested
  const logoAsset = require('@/assets/images/icon-dark.png');

  const colorScheme = useColorScheme();
  console.log(colorScheme)
  const cardBg = colorScheme === 'dark' ? '#1A2B42' : '#FFFFFF';

  const handleContinue = () => {
    // Navigate to the main app dashboard
    router.replace('/(private)/home');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Image source={logoAsset} style={styles.logo} />
      </SafeAreaView>
      <View style={styles.cardSheetWrapper}>
        <View style={[styles.cardSheet, { backgroundColor: cardBg }]}>
          <Image source={successAsset} style={styles.image} />
          <ThemedText type="title" style={styles.title}>
            ¡Gracias, {profile?.first_name}!
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Tus datos de verificación se enviaron correctamente.
          </ThemedText>
          <ThemedButton
            onPress={handleContinue}
            title="Continuar"
            style={styles.button}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    alignItems: 'center',
    paddingTop: 12,
  },
  logo: {
    width: 120,
    height: 24,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  cardSheetWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  cardSheet: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
}); 