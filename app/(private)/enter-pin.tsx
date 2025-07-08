import { NumericKeypad } from '@/app/components/NumericKeypad';
import { OTPInput } from '@/app/components/OTPInput';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { biometricService } from '@/app/services/biometricService';
import useSettingsStore from '@/app/store/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 30000; // 30 seconds

export default function EnterPinScreen() {
  const router = useRouter();
  const { biometricEnabled } = useSettingsStore();
  const iconColor = useThemeColor({}, 'icon');
  
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await biometricService.isBiometricAvailable();
      setIsBiometricAvailable(available && biometricEnabled);
    };
    checkBiometric();
  }, [biometricEnabled]);

  // Lockout timer
  useEffect(() => {
    let interval: any;
    if (isLockedOut && lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutTime]);

  const handleKeyPress = useCallback((key: string) => {
    if (isLockedOut) return;
    setPin((prev) => (prev.length < PIN_LENGTH ? prev + key : prev));
  }, [isLockedOut]);

  const handleDelete = useCallback(() => {
    if (isLockedOut) return;
    setPin((prev) => prev.slice(0, -1));
  }, [isLockedOut]);

  const handleVerifyPin = async () => {
    if (isLockedOut) return;

    setIsLoading(true);
    
    try {
      // Mock PIN verification - accept any 4-digit PIN after brief delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isValid = await biometricService.verifyPin(pin);
      
      if (isValid) {
        // Reset attempts and navigate to home
        setAttempts(0);
        router.replace('/(private)/home');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLockedOut(true);
          setLockoutTime(LOCKOUT_TIME / 1000);
          Alert.alert(
            'Demasiados intentos',
            `Has excedido el número máximo de intentos. Inténtalo de nuevo en ${LOCKOUT_TIME / 1000} segundos.`
          );
        } else {
          Alert.alert(
            'PIN Incorrecto',
            `El PIN ingresado no es válido. Te quedan ${MAX_ATTEMPTS - newAttempts} intentos.`
          );
        }
        setPin('');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar el PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await biometricService.authenticateWithBiometrics(
        'Autentícate para acceder a la aplicación'
      );
      
      if (result) {
        setAttempts(0);
      router.replace('/(private)/home');
      } else {
        Alert.alert('Error', 'Autenticación biométrica fallida');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la autenticación biométrica');
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'PIN Olvidado',
      'Para recuperar tu PIN necesitas volver a iniciar sesión',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Ir a login', 
          onPress: () => router.replace('/(public)/login')
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            {isLockedOut ? 'Cuenta bloqueada' : 'Ingresa tu PIN'}
          </ThemedText>
          
          {isLockedOut ? (
            <ThemedText style={styles.subtitle}>
              Inténtalo de nuevo en {lockoutTime} segundos
            </ThemedText>
          ) : (
          <ThemedText style={styles.subtitle}>
              Ingresa el código de 4 dígitos para continuar
          </ThemedText>
          )}

          <OTPInput value={pin} length={PIN_LENGTH} />
          
          {attempts > 0 && !isLockedOut && (
            <ThemedText style={styles.attemptsText}>
              Intentos restantes: {MAX_ATTEMPTS - attempts}
            </ThemedText>
          )}
        </View>

        <View style={styles.keypadContainer}>
          <NumericKeypad 
            onKeyPress={handleKeyPress} 
            onDelete={handleDelete}
            disabled={isLockedOut}
          />
          
          <ThemedButton
            title="Ingresar"
            type="primary"
            size="large"
            onPress={handleVerifyPin}
            loading={isLoading}
            disabled={isLoading || pin.length !== PIN_LENGTH || isLockedOut}
            style={styles.button}
          />
          
          {/* Biometric option */}
          {isBiometricAvailable && !isLockedOut && (
            <TouchableOpacity 
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
            >
              <Ionicons name="finger-print" size={24} color={iconColor} />
              <ThemedText style={styles.biometricText}>
                Usar biometría
              </ThemedText>
            </TouchableOpacity>
          )}
          
          {/* Forgot PIN */}
          <TouchableOpacity 
            style={styles.forgotButton}
            onPress={handleForgotPin}
          >
            <ThemedText type="link">¿Olvidaste tu PIN?</ThemedText>
          </TouchableOpacity>
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 48,
    maxWidth: '85%',
  },
  keypadContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    marginTop: 16,
  },
  attemptsText: {
    marginTop: 16,
    textAlign: 'center',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  biometricText: {
    marginLeft: 8,
  },
  forgotButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
}); 