/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#fff',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#EAEAEA',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E0E0E0',
    card: '#FFFFFF',
    notification: '#FF3B30',
    success: '#4CD964',
    error: '#FF3B30',
    warning: '#FFCC00',
    info: '#0A84FF',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    backgroundSecondary: '#1C1E1F',
    backgroundTertiary: '#2A2D2E',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#2A2D2E',
    card: '#1C1E1F',
    notification: '#FF453A',
    success: '#32D74B',
    error: '#FF453A',
    warning: '#FFD60A',
    info: '#0A84FF',
  },
};

export default Colors; 