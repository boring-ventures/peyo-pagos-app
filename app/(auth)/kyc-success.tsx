import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { BridgeProgressIndicator } from '@/app/components/bridge/BridgeProgressIndicator';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useAuthStore } from '@/app/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export default function KycSuccessScreen() {
  const router = useRouter();
  const { updateKycStatus } = useAuthStore();
  const tintColor = useThemeColor({}, 'tint');
  const successColor = '#4CAF50';

  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [checkmarkAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Update KYC status to completed
    updateKycStatus('completed');

    // Start animations
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    console.log('handleContinue');
    router.replace('/(auth)/biometric-setup');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.checkCircle, { backgroundColor: successColor }]}>
            <Animated.View style={{ opacity: checkmarkAnim }}>
              <Ionicons name="checkmark" size={72} color="#FFF" />
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContent, { opacity: fadeAnim }]}>
          <ThemedText type="title" style={styles.title}>
            ¡Verificación Completada!
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funciones de Peyo Pagos.
          </ThemedText>

          {/* Completed Steps Summary */}
          {/* <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Ionicons name="person-circle" size={24} color={tintColor} />
              <ThemedText style={styles.summaryText}>Información personal</ThemedText>
              <Ionicons name="checkmark-circle" size={20} color={successColor} />
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="location" size={24} color={tintColor} />
              <ThemedText style={styles.summaryText}>Dirección</ThemedText>
              <Ionicons name="checkmark-circle" size={20} color={successColor} />
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="briefcase" size={24} color={tintColor} />
              <ThemedText style={styles.summaryText}>Actividad económica</ThemedText>
              <Ionicons name="checkmark-circle" size={20} color={successColor} />
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="document-text" size={24} color={tintColor} />
              <ThemedText style={styles.summaryText}>Documentos</ThemedText>
              <Ionicons name="checkmark-circle" size={20} color={successColor} />
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="camera" size={24} color={tintColor} />
              <ThemedText style={styles.summaryText}>Selfie</ThemedText>
              <Ionicons name="checkmark-circle" size={20} color={successColor} />
            </View>
          </View> */}

          {/* Bridge Integration Progress - Only show if Bridge is configured */}
          {process.env.EXPO_PUBLIC_BRIDGE_API_KEY && (
            <View style={styles.bridgeContainer}>
              <ThemedText style={styles.bridgeTitle}>
                Configurando tu Wallet
              </ThemedText>
              <BridgeProgressIndicator showOnlyWhenActive={false} />
              <ThemedText style={styles.bridgeDescription}>
                Estamos configurando tu wallet crypto automáticamente. Esto puede tardar unos momentos.
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Continue Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
        <ThemedButton
          title="Continuar a la App"
          type="outline"
          size="large"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 32,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  bridgeContainer: {
    width: '100%',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  bridgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  bridgeDescription: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    paddingVertical: 24,
  },
  continueButton: {
    width: '100%',
  },
}); 