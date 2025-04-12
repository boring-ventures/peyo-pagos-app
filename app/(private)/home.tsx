import { ActionCard } from '@/app/components/ActionCard';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useAuthStore } from '@/app/store/authStore';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user, isAuthenticated } = useAuthStore();

  // If not authenticated, ensure redirect happens (handled by _layout.tsx)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/(public)/login');
    }
  }, [isAuthenticated, user, router]);

  const greeting = profile?.first_name 
    ? `¡Hola ${profile.first_name}!` 
    : '¡Hola!';

  const handleLogout = () => {
    useAuthStore.getState().logout();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.greeting}>
            {greeting}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Bienvenido de nuevo a tu panel principal
          </ThemedText>
        </View>

        <View style={styles.cardsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Acciones rápidas
          </ThemedText>
          
          <ActionCard
            title="Ir al Perfil"
            subtitle="Ver y editar información de tu cuenta"
            icon="person-outline"
            onPress={() => router.push('/(private)/profile')}
          />
          
          <ActionCard
            title="Cerrar Sesión"
            subtitle="Finalizar sesión actual"
            icon="log-out-outline"
            onPress={handleLogout}
          />
          
          <ActionCard
            title="Ver más tarde..."
            subtitle="Otras funcionalidades estarán disponibles pronto"
            icon="time-outline"
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
  },
  headerContainer: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  cardsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
}); 