import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { biometricService } from '@/app/services/biometricService';
import { useSettingsStore } from '@/app/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

export default function BiometricSetupScreen() {
  const router = useRouter();
  const { enableBiometric } = useSettingsStore();
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  
  const faceIdAsset = useThemedAsset(
    require('@/assets/images/onboarding/face-id.png'),
    require('@/assets/images/onboarding/face-id.png')
  );

  useEffect(() => {
    async function checkBiometrics() {
      const supported = await biometricService.isBiometricAvailable();
      setIsBiometricSupported(supported);
    }
    checkBiometrics();
  }, []);

  const handleEnableBiometrics = async () => {
    if (isBiometricSupported) {
      const result = await biometricService.authenticateWithBiometrics('Confirma tu identidad para activar la biometría');
      if (result) {
        enableBiometric(true);
        Alert.alert('Éxito', 'La autenticación biométrica ha sido activada.');
        router.push('./pin-setup');
      } else {
        Alert.alert('Error', 'No se pudo activar la autenticación biométrica.');
      }
    }
  };

  const handleSkip = () => {
    enableBiometric(false);
    router.push('./pin-setup');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Image source={faceIdAsset} style={styles.image} />
        <ThemedText type="title" style={styles.title}>Activar Face ID</ThemedText>
        <ThemedText style={styles.subtitle}>
          Usa tu rostro para desbloquear la aplicación e iniciar sesión de forma segura.
        </ThemedText>
      </View>
      <View style={styles.buttonContainer}>
        <ThemedButton
          onPress={handleEnableBiometrics}
          title="Activar ahora"
          disabled={!isBiometricSupported}
        />
        <ThemedButton
          onPress={handleSkip}
          title="Lo haré luego"
          type="secondary"
          style={styles.skipButton}
        />
      </View>
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
    width: 100,
    height: 100,
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
  buttonContainer: {
    paddingBottom: 16,
  },
  skipButton: {
    marginTop: 16,
  },
}); 