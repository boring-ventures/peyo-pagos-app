import { useThemeStore } from '@/app/store/themeStore';
import { useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  const nativeColorScheme = useNativeColorScheme();
  const { theme, loadTheme } = useThemeStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initTheme = async () => {
      await loadTheme();
      setIsReady(true);
    };
    
    initTheme();
  }, [loadTheme]);

  // Return native color scheme until theme is loaded
  if (!isReady) {
    return nativeColorScheme || 'light';
  }

  // If theme is set to auto, return the native color scheme
  if (theme === 'auto') {
    return nativeColorScheme || 'light';
  }

  // Otherwise, return the explicitly set theme
  return theme;
}
