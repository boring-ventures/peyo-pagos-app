import PinInput from '@/app/components/kyc/PinInput';
import { NumericKeypad } from '@/app/components/NumericKeypad';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { biometricService } from '@/app/services/biometricService';
import useSettingsStore from '@/app/store/settingsStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default function ChangePinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setupOnly = params?.setup === 'true';

  const { setPin } = useSettingsStore();

  const [step, setStep] = useState<'verify' | 'create' | 'confirm'>(setupOnly ? 'create' : 'verify');
  const [currentInput, setCurrentInput] = useState('');
  const [newPin, setNewPin] = useState('');

  const handleKeyPress = (key: string) => {
    if (currentInput.length >= 4) return;
    setCurrentInput(prev => prev + key);
  };

  const handleDelete = () => {
    setCurrentInput(prev => prev.slice(0, -1));
  };

  const resetInputs = () => {
    setCurrentInput('');
    setNewPin('');
  };

  const proceed = async (input: string) => {
    if (step === 'verify') {
      const isValid = await biometricService.verifyPin(input);
      if (!isValid) {
        Alert.alert('PIN incorrecto');
        resetInputs();
        return;
      }
      setStep('create');
      setCurrentInput('');
      return;
    }

    if (step === 'create') {
      setNewPin(input);
      setStep('confirm');
      setCurrentInput('');
      return;
    }

    if (step === 'confirm') {
      if (input === newPin) {
        await biometricService.savePin(input);
        await setPin(input);
        Alert.alert('PIN actualizado');
        router.back();
      } else {
        Alert.alert('Los PIN no coinciden');
        resetInputs();
        setStep('create');
      }
    }
  };

  React.useEffect(() => {
    if (currentInput.length === 4) {
      proceed(currentInput);
    }
  }, [currentInput]);

  const getTitle = () => {
    if (step === 'verify') return 'Ingresa tu PIN actual';
    if (step === 'create') return 'Nuevo PIN';
    return 'Confirma tu PIN';
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>{getTitle()}</ThemedText>
      <PinInput pinLength={4} pin={currentInput} />
      <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 24,
  },
}); 