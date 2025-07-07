import PinInput from '@/app/components/kyc/PinInput';
import NumericKeypad from '@/app/components/NumericKeypad';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useSettingsStore } from '@/app/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

const PIN_LENGTH = 4;

export default function PinConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pin: string }>();
  const originalPin = params.pin;
  const { setPin: savePin } = useSettingsStore();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const errorColor = useThemeColor({}, 'error');

  const handleKeyPress = (value: string) => {
    if (pin.length < PIN_LENGTH) {
      setError(false);
      const newPin = pin + value;
      setPin(newPin);
      if (newPin.length === PIN_LENGTH) {
        validatePin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const validatePin = async (currentPin: string) => {
    if (currentPin === originalPin) {
      await savePin(currentPin);
      Alert.alert('Éxito', 'Tu PIN ha sido configurado correctamente.');
      router.push('./welcome');
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Confirma tu PIN</ThemedText>
        <ThemedText style={styles.subtitle}>
          Vuelve a ingresar tu PIN de seguridad para confirmarlo.
        </ThemedText>
        <PinInput pinLength={PIN_LENGTH} pin={pin} />
        {error && <ThemedText style={{ color: errorColor }}>Los PINs no coinciden. Inténtalo de nuevo.</ThemedText>}
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