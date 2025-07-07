import PinInput from '@/app/components/kyc/PinInput';
import NumericKeypad from '@/app/components/NumericKeypad';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const PIN_LENGTH = 4;

export default function PinSetupScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');

  const handleKeyPress = (value: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + value;
      setPin(newPin);
      if (newPin.length === PIN_LENGTH) {
        // Navigate to confirmation screen with the pin
        router.push({
          pathname: './pin-confirm',
          params: { pin: newPin },
        });
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Crea un pin de seguridad</ThemedText>
        <ThemedText style={styles.subtitle}>
          Este PIN se usará para confirmar transacciones y acceder a la app.
        </ThemedText>
        <PinInput pinLength={PIN_LENGTH} pin={pin} />
      </View>
      <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
}); 