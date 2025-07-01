import { ProfileInfoRow } from '@/app/components/ProfileInfoRow';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { ThemeSelector } from '@/app/components/ThemeSelector';
import { UserAvatar } from '@/app/components/UserAvatar';
import { Colors } from '@/app/constants/Colors';
import { useColorScheme } from '@/app/hooks/useColorScheme';
import { useAuthStore } from '@/app/store/authStore';
import { useOnboardingStore } from '@/app/store/onboardingStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user, profile, isAuthenticated } = useAuthStore();
  const { resetOnboarding } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  // If not authenticated, ensure redirect happens (handled by _layout.tsx)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/(public)/login');
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await useAuthStore.getState().logout();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/(private)/edit-profile');
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset the onboarding status. You will see the onboarding screens again next time you login.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            Alert.alert('Success', 'Onboarding has been reset.');
          },
        },
      ],
    );
  };

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Cargando perfil...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Avatar and Name Section */}
        <View style={styles.avatarContainer}>
          <UserAvatar 
            imageUrl={profile?.avatar_url} 
            firstName={profile?.first_name}
            lastName={profile?.last_name}
            size={120}
          />
          <ThemedText type="title" style={styles.userName}>
            {profile?.first_name} {profile?.last_name}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <ThemedButton
            title="Editar Perfil"
            onPress={handleEditProfile}
            type="outline"
            style={styles.actionButton}
          />
          <ThemedButton
            title="Reset Onboarding (Test)"
            type="secondary"
            onPress={handleResetOnboarding}
            style={styles.actionButton}
          />
          <ThemedButton
            title="Cerrar Sesión"
            type="secondary"
            onPress={handleLogout}
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].error }]}
          />
        </View>

        {/* Profile Information */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Información Personal
          </ThemedText>

          <ProfileInfoRow
            label="Nombre"
            value={profile?.first_name ?? 'No especificado'}
            icon="person-outline"
          />
          <ProfileInfoRow
            label="Apellido"
            value={profile?.last_name ?? 'No especificado'}
            icon="people-outline"
          />
          <ProfileInfoRow
            label="Email"
            value={user?.email ?? 'No especificado'}
            icon="mail-outline"
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Preferencias
          </ThemedText>

          <ThemeSelector />

          <ProfileInfoRow
            label="Notificaciones"
            value="Activadas"
            icon="notifications-outline"
          />
          <ProfileInfoRow
            label="Idioma"
            value="Español"
            icon="language-outline"
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  userName: {
    fontSize: 24,
    marginTop: 15,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  actionButton: {
    marginHorizontal: 8,
    minWidth: 140,
  },
  sectionContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
}); 