import { NumericKeypad } from '@/app/components/NumericKeypad';
import { OTPInput } from '@/app/components/OTPInput';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';

const PIN_LENGTH = 4;

export default function EnterPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = useCallback((key: string) => {
    setPin((prev) => (prev.length < PIN_LENGTH ? prev + key : prev));
  }, []);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleVerifyPin = () => {
    // Mock PIN verification
    if (pin !== '1234') {
      Alert.alert('PIN Incorrecto', 'El PIN ingresado no es válido.');
      setPin('');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to the main app screen after successful PIN entry
      router.replace('/(private)/home');
    }, 1000);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Ingrese con su PIN
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Ingrese el código de 4 dígitos que configuró cuando creó la cuenta
          </ThemedText>

          <OTPInput value={pin} length={PIN_LENGTH} isPin />
        </View>

        <View style={styles.keypadContainer}>
          <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
          <ThemedButton
            title="Ingresar"
            type="primary"
            size="large"
            onPress={handleVerifyPin}
            loading={isLoading}
            disabled={isLoading || pin.length !== PIN_LENGTH}
            style={styles.button}
          />
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
}); 