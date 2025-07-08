import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useAuthStore } from '@/app/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Linking, StyleSheet, View } from 'react-native';

export default function KycPendingScreen() {
  const router = useRouter();
  const { updateKycStatus } = useAuthStore();
  const tintColor = useThemeColor({}, 'tint');
  const warningColor = '#FF9800';

  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Update KYC status to under review
    updateKycStatus('in_progress');

    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the clock icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleContinue = () => {
    router.replace('/(private)/home');
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contactar Soporte',
      'Elige una opción para contactar a nuestro equipo de soporte:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:soporte@peyopagos.com'),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/1234567890'),
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Pending Icon with Animation */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: warningColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="time" size={60} color="white" />
        </Animated.View>

        {/* Pending Content */}
        <View style={styles.textContent}>
          <ThemedText type="title" style={styles.title}>
            Verificación en Proceso
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Tu documentación está siendo revisada por nuestro equipo. Te notificaremos cuando el proceso esté completo.
          </ThemedText>

          {/* Timeline Info */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: tintColor }]} />
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineTitle}>Tiempo estimado</ThemedText>
                <ThemedText style={styles.timelineText}>24-48 horas hábiles</ThemedText>
              </View>
            </View>
            
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: tintColor }]} />
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineTitle}>Próximo paso</ThemedText>
                <ThemedText style={styles.timelineText}>Te notificaremos por email cuando esté listo</ThemedText>
              </View>
            </View>
            
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: tintColor }]} />
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineTitle}>Mientras tanto</ThemedText>
                <ThemedText style={styles.timelineText}>Puedes explorar la app con funcionalidad limitada</ThemedText>
              </View>
            </View>
          </View>

          {/* Contact Support */}
          <View style={styles.supportContainer}>
            <ThemedText style={styles.supportText}>
              ¿Tienes alguna pregunta?
            </ThemedText>
            <ThemedButton
              title="Contactar Soporte"
              type="outline"
              onPress={handleContactSupport}
              style={styles.supportButton}
            />
          </View>
        </View>
      </Animated.View>

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
    width: '100%',
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
  timelineContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 32,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  supportContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  supportText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  supportButton: {
    minWidth: 160,
  },
  buttonContainer: {
    paddingBottom: 16,
  },
  continueButton: {
    marginTop: 16,
  },
}); 