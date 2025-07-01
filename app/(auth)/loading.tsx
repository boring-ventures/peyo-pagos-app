import { LoadingScreen } from '@/app/components/LoadingScreen';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useAuthStore } from '@/app/store/authStore';
import { useOnboardingStore } from '@/app/store/onboardingStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

// Debug component
const DebugScreen: React.FC<{
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  onClearData: () => Promise<void>;
  onContinue: () => void;
}> = ({ isAuthenticated, hasCompletedOnboarding, onClearData, onContinue }) => {
  return (
    <ThemedView style={styles.debugContainer}>
      <ThemedText type="title" style={styles.debugTitle}>Debug Screen</ThemedText>
      
      <ThemedText style={styles.debugText}>
        🔐 Is Authenticated: {isAuthenticated ? 'YES' : 'NO'}
      </ThemedText>
      <ThemedText style={styles.debugText}>
        ✅ Onboarding Completed: {hasCompletedOnboarding ? 'YES' : 'NO'}
      </ThemedText>
      
      <View style={styles.debugButtons}>
        <ThemedButton
          title="Clear All Data & Restart"
          type="secondary"
          onPress={onClearData}
          style={styles.debugButton}
        />
        
        <ThemedButton
          title="Continue with Current State"
          type="primary"
          onPress={onContinue}
          style={styles.debugButton}
        />
      </View>
    </ThemedView>
  );
};

export default function AuthLoadingScreen() {
  const { isAuthenticated, isLoading: authLoading, restoreSession, logout } = useAuthStore();
  const { hasCompletedOnboarding, isLoading: onboardingLoading, checkOnboardingStatus, resetOnboarding } = useOnboardingStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDebug, setShowDebug] = useState(true); // Show debug screen for now

  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 AuthLoadingScreen: Starting initialization');
      
      await Promise.all([
        restoreSession(),
        checkOnboardingStatus()
      ]);
      setIsInitialized(true);
      console.log('✅ AuthLoadingScreen: Initialization complete');
    };

    initialize();
  }, [restoreSession, checkOnboardingStatus]);

  const handleClearData = async () => {
    try {
      console.log('🧹 Clearing all app data...');
      await AsyncStorage.clear();
      await logout();
      await resetOnboarding();
      
      // Re-initialize
      await Promise.all([
        restoreSession(),
        checkOnboardingStatus()
      ]);
      
      Alert.alert('Success', 'All data cleared. App will restart fresh.');
      setShowDebug(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const handleContinue = () => {
    setShowDebug(false);
  };

  console.log('🔍 AuthLoadingScreen state:', {
    authLoading,
    onboardingLoading,
    isInitialized,
    isAuthenticated,
    hasCompletedOnboarding,
    showDebug
  });

  if (authLoading || onboardingLoading || !isInitialized) {
    console.log('⏳ AuthLoadingScreen: Still loading...');
    return <LoadingScreen />;
  }

  // Show debug screen if enabled
  if (showDebug) {
    return (
      <DebugScreen
        isAuthenticated={isAuthenticated}
        hasCompletedOnboarding={hasCompletedOnboarding}
        onClearData={handleClearData}
        onContinue={handleContinue}
      />
    );
  }

  if (isAuthenticated) {
    console.log('🔐 AuthLoadingScreen: User is authenticated, redirecting to home');
    return <Redirect href={'/(private)/home' as any} />;
  }

  // Si no está autenticado, verificar si ha completado el onboarding
  if (!hasCompletedOnboarding) {
    console.log('👋 AuthLoadingScreen: First time user, redirecting to onboarding');
    return <Redirect href={'/(public)/onboarding/welcome' as any} />;
  }

  // Si ya completó el onboarding, ir directo al login
  console.log('🔑 AuthLoadingScreen: Returning user, redirecting to login');
  return <Redirect href={'/(public)/login' as any} />;
}

const styles = StyleSheet.create({
  debugContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  debugTitle: {
    marginBottom: 30,
    textAlign: 'center',
  },
  debugText: {
    marginBottom: 15,
    fontSize: 16,
  },
  debugButtons: {
    marginTop: 30,
    width: '100%',
    gap: 15,
  },
  debugButton: {
    marginBottom: 10,
  },
}); 