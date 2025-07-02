import { useAuth } from "@/app/components/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  // Si está autenticado, redirigir a la ruta privada
  if (isAuthenticated) {
    return <Redirect href={"/(private)/home" as any} />;
  }

  return (
    <Stack initialRouteName="onboarding/welcome">
      <Stack.Screen
        name="get-started"
        options={{
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="onboarding/welcome"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="onboarding/carousel"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
