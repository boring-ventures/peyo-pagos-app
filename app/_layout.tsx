import { AuthProvider } from "@/app/components/AuthContext";
import { Colors } from "@/app/constants/Colors";
import { useColorScheme } from "@/app/hooks/useColorScheme";
import { useAuthStore } from "@/app/store/authStore";
import { useThemeStore } from "@/app/store/themeStore";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Custom themes that incorporate Peyo's brand colors
const PeyoLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.brand.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.notification,
  },
};

const PeyoDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.brand.primaryLight,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.notification,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore(state => state.initialize);
  const loadTheme = useThemeStore(state => state.loadTheme);

  // Initialize auth and theme state
  useEffect(() => {
    initialize();
    loadTheme();
  }, [initialize, loadTheme]);

  const theme = colorScheme === 'dark' ? PeyoDarkTheme : PeyoLightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <StatusBar 
          style={colorScheme === 'dark' ? 'light' : 'dark'} 
          backgroundColor={theme.colors.background}
        />
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(private)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="index" redirect={true} />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
