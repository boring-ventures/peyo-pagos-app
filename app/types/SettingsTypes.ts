export interface SettingsState {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  notificationsEnabled: boolean;
  language: 'es' | 'en';
  securityPin: string | null;
}

export interface SettingsActions {
  enableBiometric: (enabled: boolean) => void;
  enablePin: (enabled: boolean) => void;
  setPin: (pin: string) => Promise<void>;
  updateSettings: (settings: Partial<SettingsState>) => void;
  setLanguage: (language: 'es' | 'en') => void;
} 