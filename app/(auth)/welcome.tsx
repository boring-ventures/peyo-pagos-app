import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { useAuthStore } from '@/app/store';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const successAsset = useThemedAsset(
    require('@/assets/images/onboarding/success.png'),
    require('@/assets/images/onboarding/success.png')
  );

  const handleContinue = () => {
    // Navigate to the main app dashboard
    router.replace('/(private)/home');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Image source={successAsset} style={styles.image} />
        <ThemedText type="title" style={styles.title}>
          ¡Gracias, {profile?.first_name}!
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Tus datos de verificación se enviaron correctamente.
        </ThemedText>
      </View>
      <ThemedButton
        onPress={handleContinue}
        title="Continuar"
        style={styles.button}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
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
    marginBottom: 16,
  },
}); 