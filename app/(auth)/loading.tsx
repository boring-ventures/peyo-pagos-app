import { LoadingScreen } from '@/app/components/LoadingScreen';
import { useAuthStore } from '@/app/store/authStore';
import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';

export default function AuthLoadingScreen() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    const bootstrapAsync = async () => {
      await restoreSession();
    };

    bootstrapAsync();
  }, [restoreSession]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Si está autenticado, redirigir a la pantalla privada
    return <Redirect href={'/(private)/home' as any} />;
  }

  // Si no está autenticado, redirigir al onboarding
  return <Redirect href={'/(public)/onboarding/welcome' as any} />;
} 