import { useAuth } from "@/app/components/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  // Si está autenticado, redirigir a la ruta privada
  if (isAuthenticated) {
    return <Redirect href={"/(private)/home" as any} />;
  }

  return (
    <Stack 
      initialRouteName="onboarding/welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: "fade",
        animationDuration: 250,
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen
        name="get-started"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureEnabled: true,
          gestureDirection: "vertical",
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          animation: "simple_push",
          gestureEnabled: true,
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
          animation: "simple_push",
          gestureEnabled: true,
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: false,
          animation: "simple_push",
          gestureEnabled: true,
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          headerShown: false,
          animation: "simple_push",
          gestureEnabled: true,
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="otp-verification"
        options={{
          headerShown: false,
          animation: "simple_push",
          gestureEnabled: true,
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="onboarding/welcome"
        options={{
          headerShown: false,
          animation: "fade",
          gestureEnabled: false,
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="onboarding/carousel"
        options={{
          headerShown: false,
          animation: "simple_push",
          gestureEnabled: true,
          animationDuration: 250,
        }}
      />
    </Stack>
  );
}
