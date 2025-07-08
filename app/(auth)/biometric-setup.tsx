import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { biometricService, BiometricType } from '@/app/services/biometricService';
import { useSettingsStore } from '@/app/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function BiometricSetupScreen() {
  const router = useRouter();
  const { enableBiometric } = useSettingsStore();
  const tintColor = useThemeColor({}, 'tint');
  
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBiometrics() {
      setIsLoading(true);
      try {
        const supported = await biometricService.isBiometricAvailable();
        const type = await biometricService.getBiometricType();
        
        console.log('supported', supported);
        console.log('type', type);
        setIsBiometricSupported(supported);
        setBiometricType(type);
      } catch (error) {
        console.error('Error checking biometrics:', error);
        setIsBiometricSupported(false);
        setBiometricType('none');
      } finally {
        setIsLoading(false);
      }
    }
    checkBiometrics();
  }, []);

  const getBiometricContent = () => {
    switch (biometricType) {
      case 'facial':
        return {
          icon: 'scan' as const,
          title: 'Activar Face ID',
          subtitle: 'Usa tu rostro para desbloquear la aplicación e iniciar sesión de forma segura.',
          buttonText: 'Activar Face ID',
          confirmMessage: 'Confirma tu identidad con Face ID para activar esta función',
        };
      case 'fingerprint':
        return {
          icon: 'finger-print' as const,
          title: 'Activar Touch ID',
          subtitle: 'Usa tu huella digital para desbloquear la aplicación e iniciar sesión de forma segura.',
          buttonText: 'Activar Touch ID',
          confirmMessage: 'Confirma tu identidad con tu huella digital para activar esta función',
        };
      case 'iris':
        return {
          icon: 'eye' as const,
          title: 'Activar Reconocimiento de Iris',
          subtitle: 'Usa el escaneo de iris para desbloquear la aplicación e iniciar sesión de forma segura.',
          buttonText: 'Activar Iris',
          confirmMessage: 'Confirma tu identidad con el escaneo de iris para activar esta función',
        };
      default:
        return {
          icon: 'lock-closed' as const,
          title: 'Biometría no Disponible',
          subtitle: 'Tu dispositivo no tiene biometría configurada o no es compatible. Puedes configurar un PIN de seguridad en el siguiente paso.',
          buttonText: 'Continuar sin Biometría',
          confirmMessage: '',
        };
    }
  };

  const handleEnableBiometrics = async () => {
    if (biometricType === 'none') {
      // If no biometrics available, just continue
      handleSkip();
      return;
    }

    if (isBiometricSupported) {
      const content = getBiometricContent();
      const result = await biometricService.authenticateWithBiometrics(content.confirmMessage);
      
      if (result) {
        enableBiometric(true);
        await biometricService.setBiometricEnabled(true);
        
        const successMessage = `${content.title.replace('Activar ', '')} ha sido activado exitosamente.`;
        Alert.alert('¡Perfecto!', successMessage);
        router.push('./pin-setup');
      } else {
        Alert.alert('Error', `No se pudo activar ${content.title.replace('Activar ', '').toLowerCase()}.`);
      }
    }
  };

  const handleSkip = () => {
    enableBiometric(false);
    router.push('./pin-setup');
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="scan" size={80} color={tintColor} />
          </View>
          <ThemedText type="title" style={styles.title}>
            Detectando biometría...
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Verificando las opciones de seguridad disponibles en tu dispositivo.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const content = getBiometricContent();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={content.icon} size={80} color={tintColor} />
        </View>
        
        <ThemedText type="title" style={styles.title}>
          {content.title}
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          {content.subtitle}
        </ThemedText>

        {/* Additional info for unsupported devices */}
        {biometricType === 'none' && (
          <View style={styles.infoContainer}>
            <ThemedText style={styles.infoText}>
              💡 Tip: Para mayor seguridad, asegúrate de tener configurada biometría en la configuración de tu dispositivo.
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <ThemedButton
          onPress={handleEnableBiometrics}
          title={content.buttonText}
          disabled={!isBiometricSupported && biometricType !== 'none'}
          type={biometricType === 'none' ? 'secondary' : 'primary'}
        />
        
        {biometricType !== 'none' && (
          <ThemedButton
            onPress={handleSkip}
            title="Lo haré luego"
            type="secondary"
            style={styles.skipButton}
          />
        )}
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
  iconContainer: {
    marginBottom: 32,
    padding: 20,
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
    lineHeight: 24,
    maxWidth: '90%',
  },
  infoContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    maxWidth: '90%',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 16,
  },
  skipButton: {
    marginTop: 16,
  },
}); 