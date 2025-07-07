import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { SettingsActions, SettingsState } from '../types/SettingsTypes';

type SettingsStore = SettingsState & SettingsActions;

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      biometricEnabled: false,
      pinEnabled: false,
      notificationsEnabled: true,
      language: 'es',
      securityPin: null,

      enableBiometric: (enabled: boolean) => set({ biometricEnabled: enabled }),
      enablePin: (enabled: boolean) => {
        if (!enabled) {
          SecureStore.deleteItemAsync('user_pin');
        }
        set({ pinEnabled: enabled, securityPin: enabled ? get().securityPin : null });
      },
      setPin: async (pin: string) => {
        await SecureStore.setItemAsync('user_pin', pin);
        set({ securityPin: pin, pinEnabled: true });
      },
      updateSettings: (settings: Partial<SettingsState>) => set(settings),
      setLanguage: (language: 'es' | 'en') => set({ language }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
          biometricEnabled: state.biometricEnabled,
          pinEnabled: state.pinEnabled,
          notificationsEnabled: state.notificationsEnabled,
          language: state.language,
      }), // Don't persist securityPin in AsyncStorage
    }
  )
);

// Mock loading the pin from secure store on startup
SecureStore.getItemAsync('user_pin').then(pin => {
    if (pin) {
        useSettingsStore.setState({ securityPin: pin, pinEnabled: true });
    }
});


export default useSettingsStore; 