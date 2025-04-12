import { AuthProvider } from "@/app/components/AuthContext";
import { useColorScheme } from "@/app/hooks/useColorScheme";
import { useAuthStore } from "@/app/store/authStore";
import { useThemeStore } from "@/app/store/themeStore";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore(state => state.initialize);
  const loadTheme = useThemeStore(state => state.loadTheme);

  // Initialize auth and theme state
  useEffect(() => {
    initialize();
    loadTheme();
  }, [initialize, loadTheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(private)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="index" redirect={true} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
