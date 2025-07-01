import { useAuth } from '@/app/components/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  // Si está autenticado, redirigir a la ruta privada
  if (isAuthenticated) {
    return <Redirect href={'/(private)/home' as any} />;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          headerTitle: 'Registro' 
        }} 
      />
      <Stack.Screen 
        name="onboarding/welcome" 
        options={{ 
          headerShown: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="onboarding/carousel" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }} 
      />
    </Stack>
  );
} 