import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { biometricService } from '@/app/services/biometricService';
import useSettingsStore from '@/app/store/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const {
    biometricEnabled,
    pinEnabled,
    enableBiometric,
    enablePin,
  } = useSettingsStore();

  const [bioToggle, setBioToggle] = useState(biometricEnabled);
  const [pinToggle, setPinToggle] = useState(pinEnabled);

  useEffect(() => setBioToggle(biometricEnabled), [biometricEnabled]);
  useEffect(() => setPinToggle(pinEnabled), [pinEnabled]);

  const handleBiometricToggle = async (value: boolean) => {
    setBioToggle(value);
    enableBiometric(value);

    if (value) {
      const isAvailable = await biometricService.isBiometricAvailable();
      if (!isAvailable) {
        Alert.alert('Biometría no disponible', 'Tu dispositivo no soporta biometría o no está configurada.');
        enableBiometric(false);
        setBioToggle(false);
        return;
      }
      await biometricService.setBiometricEnabled(true);
    } else {
      await biometricService.setBiometricEnabled(false);
    }
  };

  const handlePinToggle = (value: boolean) => {
    if (value) {
      // If enabling PIN, navigate to setup flow
      router.push('/(private)/change-pin?setup=true' as any);
    } else {
      Alert.alert('Deshabilitar PIN', '¿Estás seguro que deseas deshabilitar el PIN?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deshabilitar', style: 'destructive', onPress: () => {
            enablePin(false);
            setPinToggle(false);
          }
        }
      ]);
    }
  };

  const confirmClearBiometrics = () => {
    Alert.alert('Borrar datos biométricos', 'Esto eliminará la configuración biométrica. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
        await biometricService.clearBiometricData();
        enableBiometric(false);
        setBioToggle(false);
      } },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>Seguridad</ThemedText>

        {/* Biometric Toggle */}
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Ionicons name="finger-print" size={24} style={styles.icon} />
            <ThemedText style={styles.label}>Autenticación Biométrica</ThemedText>
          </View>
          <Switch value={bioToggle} onValueChange={handleBiometricToggle} />
        </View>

        {/* PIN Toggle */}
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Ionicons name="lock-closed" size={24} style={styles.icon} />
            <ThemedText style={styles.label}>PIN de Seguridad</ThemedText>
          </View>
          <Switch value={pinToggle} onValueChange={handlePinToggle} />
        </View>

        <ThemedButton
          title="Cambiar PIN"
          onPress={() => router.push('/(private)/change-pin' as any)}
          style={styles.button}
          disabled={!pinEnabled}
        />

        <ThemedButton
          title="Borrar Datos Biométricos"
          onPress={confirmClearBiometrics}
          type="outline"
          style={styles.button}
          disabled={!bioToggle}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  rowText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
  },
  button: {
    marginTop: 24,
  },
}); 