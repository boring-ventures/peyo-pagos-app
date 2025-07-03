import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const PIN_KEY = '@security_pin';

export type BiometricType = 'none' | 'fingerprint' | 'facial' | 'iris';

class BiometricService {
  private static instance: BiometricService;

  private constructor() {}

  static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  async isBiometricAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  }

  async getBiometricType(): Promise<BiometricType> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'facial';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }
      
      return 'none';
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return 'none';
    }
  }

  async authenticateWithBiometrics(promptMessage: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving biometric preference:', error);
      throw error;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error('Error reading biometric preference:', error);
      return false;
    }
  }

  async savePin(pin: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(PIN_KEY, pin, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error('Error saving PIN:', error);
      throw error;
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      const savedPin = await SecureStore.getItemAsync(PIN_KEY);
      return savedPin === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  async clearBiometricData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY),
        SecureStore.deleteItemAsync(PIN_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing biometric data:', error);
      throw error;
    }
  }
}

export const biometricService = BiometricService.getInstance(); 