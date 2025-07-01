import { useAuth } from '@/app/components/AuthContext';
import { Redirect, Stack } from 'expo-router';
import React, { useEffect } from 'react';

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('🌐 PublicLayout: Component mounted, isAuthenticated:', isAuthenticated);
  }, []);

  useEffect(() => {
    console.log('🌐 PublicLayout: Auth state changed, isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  // Si está autenticado, redirigir a la ruta privada
  if (isAuthenticated) {
    console.log('🔐 PublicLayout: User is authenticated, redirecting to private home');
    return <Redirect href={'/(private)/home' as any} />;
  }

  console.log('🌐 PublicLayout: Rendering public stack');

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