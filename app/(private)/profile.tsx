import { ActionCard } from '@/app/components/ActionCard';
import { BridgeIntegrationCard } from '@/app/components/bridge/BridgeIntegrationCard';
import { ProfileInfoRow } from '@/app/components/ProfileInfoRow';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { ThemeSelector } from '@/app/components/ThemeSelector';
import { UserAvatar } from '@/app/components/UserAvatar';
import { useAuthStore } from '@/app/store/authStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated, userTag, loadUserTag } = useAuthStore(); // 🏷️ NEW: Include userTag and loadUserTag
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserTag, setIsLoadingUserTag] = useState(false);

  // If not authenticated, ensure redirect happens (handled by _layout.tsx)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/(public)/login');
    }
  }, [isAuthenticated, user, router]);

  // 🏷️ NEW: Load user tag if not available
  useEffect(() => {
    const loadUserTagIfNeeded = async () => {
      if (isAuthenticated && user && !userTag) {
        console.log('🏷️ User tag not loaded, fetching from database...');
        setIsLoadingUserTag(true);
        try {
          await loadUserTag();
        } catch (error) {
          console.error('❌ Error loading user tag:', error);
        } finally {
          setIsLoadingUserTag(false);
        }
      }
    };

    loadUserTagIfNeeded();
  }, [isAuthenticated, user, userTag, loadUserTag]);

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

  const handleViewWallets = () => {
    // Could navigate to a dedicated wallets screen
    Alert.alert('Bridge Wallets', 'Función de wallets Bridge será implementada próximamente');
  };

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
            size={100}
          />
          
          <ThemedText type="title" style={styles.displayName}>
            {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Usuario'}
          </ThemedText>
          
          <ThemedText style={styles.email}>
            {user?.email}
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Editar Perfil"
            type="outline"
            onPress={handleEditProfile}
            style={styles.actionButton}
          />
          <ThemedButton
            title="Configuración"
            type="outline"
            onPress={() => router.push('/(private)/security-settings')}
            style={styles.actionButton}
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

        {/* Bridge Integration Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Bridge Wallet Integration
          </ThemedText>
          
          <BridgeIntegrationCard onViewWallets={handleViewWallets} />
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

        {/* Developer Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Desarrollador
          </ThemedText>
          
          <ActionCard
            title="Bridge Debug Panel"
            subtitle="Panel de testing y depuración Bridge"
            icon="code-outline"
            onPress={() => router.push('/(private)/bridge-debug')}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <ThemedButton
            title="Cerrar Sesión"
            type="primary"
            onPress={handleLogout}
            loading={isLoading}
            style={styles.logoutButton}
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
    paddingVertical: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  displayName: {
    marginTop: 16,
    textAlign: 'center',
  },
  email: {
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    width: '100%',
  },
}); 