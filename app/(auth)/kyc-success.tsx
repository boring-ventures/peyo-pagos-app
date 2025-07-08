import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
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
    router.replace('/(auth)/biometric-setup');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon with Animation */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: successColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={{
              opacity: checkmarkAnim,
              transform: [
                {
                  scale: checkmarkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="checkmark" size={60} color="white" />
          </Animated.View>
        </Animated.View>

        {/* Success Content */}
        <Animated.View style={[styles.textContent, { opacity: fadeAnim }]}>
          <ThemedText type="title" style={styles.title}>
            ¡Verificación Completada!
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funciones de Peyo Pagos.
          </ThemedText>

          {/* Completed Steps Summary */}
          <View style={styles.summaryContainer}>
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
          </View>
        </Animated.View>
      </View>

      {/* Continue Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
        <ThemedButton
          title="Continuar a la App"
          type="primary"
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
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 32,
    maxWidth: '90%',
    lineHeight: 24,
  },
  summaryContainer: {
    width: '100%',
    maxWidth: 300,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  summaryText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  buttonContainer: {
    paddingBottom: 16,
  },
  continueButton: {
    marginTop: 16,
  },
}); 