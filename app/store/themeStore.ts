import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'auto';

type ThemeState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  loadTheme: () => Promise<void>;
};

const THEME_STORAGE_KEY = 'app.theme';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'auto',
  
  setTheme: async (theme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      set({ theme });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },
  
  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        set({ theme: savedTheme as ThemeMode });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  },
})); 