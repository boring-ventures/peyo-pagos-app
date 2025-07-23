import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { supabaseAdmin } from '@/app/services/supabaseAdmin';
import { useAuthStore } from '@/app/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RejectionReason {
  id: string;
  reason: string;
  description: string;
  category: string;
}

export default function KycRejectedScreen() {
  const router = useRouter();
  const logo = useThemedAsset(
    require('@/assets/images/icon-light.png'),
    require('@/assets/images/icon-dark.png')
  );

  const { user, profile, logout } = useAuthStore();
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
  const [requirementsDue, setRequirementsDue] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRejectionData();
  }, []);

  const loadRejectionData = async () => {
    try {
      setIsLoading(true);
      
      // Primero obtener el profile ID del usuario
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', user?.id)
        .single();

      if (profileError || !userProfile) {
        console.error('❌ Error obteniendo profile:', profileError);
        return;
      }

      // Obtener datos de rechazo desde la base de datos
      const { data: kycProfile, error } = await supabaseAdmin
        .from('kyc_profiles')
        .select('kyc_rejection_reason, requirements_due, bridge_raw_response')
        .eq('profile_id', userProfile.id)
        .single();

      if (error) {
        console.error('❌ Error loading rejection data:', error);
        return;
      }

      // Parsear rejection reasons desde bridge_raw_response
      if (kycProfile?.bridge_raw_response) {
        const bridgeData = kycProfile.bridge_raw_response;
        const reasons = bridgeData.rejection_reasons || [];
        
        const mappedReasons: RejectionReason[] = reasons.map((reason: any, index: number) => ({
          id: `reason-${index}`,
          reason: reason.reason || 'Rechazo general',
          description: reason.description || 'No se proporcionó descripción específica',
          category: reason.category || 'general'
        }));
        
        setRejectionReasons(mappedReasons);
      }

      // Parsear requirements due
      if (kycProfile?.requirements_due) {
        setRequirementsDue(kycProfile.requirements_due);
      }

    } catch (error) {
      console.error('❌ Error loading rejection data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contactar Soporte',
      '¿Deseas contactar al equipo de soporte para revisar tu caso?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Contactar', 
          onPress: () => {
            // Aquí podrías abrir un enlace de soporte o mostrar información de contacto
            Alert.alert(
              'Información de Contacto',
              'Email: soporte@peyo.com\nTeléfono: +1-800-PEYO\nHorario: Lunes a Viernes 9AM-6PM'
            );
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(public)/login');
          }
        }
      ]
    );
  };

  const getRejectionIcon = (category: string) => {
    switch (category) {
      case 'document':
        return 'document-outline';
      case 'identity':
        return 'person-outline';
      case 'address':
        return 'location-outline';
      case 'financial':
        return 'card-outline';
      default:
        return 'warning-outline';
    }
  };

  const getRequirementIcon = (requirement: string) => {
    switch (requirement) {
      case 'external_account':
        return 'card-outline';
      case 'identity_verification':
        return 'person-outline';
      case 'address_verification':
        return 'location-outline';
      case 'document_verification':
        return 'document-outline';
      default:
        return 'checkmark-circle-outline';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Cargando información...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} />
          <ThemedText style={styles.title}>Cuenta Rechazada</ThemedText>
          <ThemedText style={styles.subtitle}>
            Tu solicitud de verificación ha sido rechazada
          </ThemedText>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="close-circle" size={24} color="#EF4444" />
            <ThemedText style={styles.statusTitle}>Estado: Rechazado</ThemedText>
          </View>
          <ThemedText style={styles.statusDescription}>
            Tu cuenta no cumple con los requisitos de verificación. Revisa las razones a continuación.
          </ThemedText>
        </View>

        {/* Rejection Reasons */}
        {rejectionReasons.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Razones del Rechazo</ThemedText>
            {rejectionReasons.map((reason) => (
              <View key={reason.id} style={styles.reasonCard}>
                <View style={styles.reasonHeader}>
                  <Ionicons 
                    name={getRejectionIcon(reason.category) as any} 
                    size={20} 
                    color="#EF4444" 
                  />
                  <ThemedText style={styles.reasonTitle}>{reason.reason}</ThemedText>
                </View>
                <ThemedText style={styles.reasonDescription}>
                  {reason.description}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Requirements Due */}
        {requirementsDue.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Requerimientos Pendientes</ThemedText>
            {requirementsDue.map((requirement, index) => (
              <View key={index} style={styles.requirementCard}>
                <View style={styles.requirementHeader}>
                  <Ionicons 
                    name={getRequirementIcon(requirement) as any} 
                    size={20} 
                    color="#F59E0B" 
                  />
                  <ThemedText style={styles.requirementTitle}>
                    {requirement === 'external_account' ? 'Cuenta Externa Requerida' : requirement}
                  </ThemedText>
                </View>
                <ThemedText style={styles.requirementDescription}>
                  {requirement === 'external_account' 
                    ? 'Necesitas agregar una cuenta bancaria externa para completar la verificación.'
                    : 'Este requerimiento debe ser completado para aprobar tu cuenta.'
                  }
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <ThemedButton
            title="Contactar Soporte"
            onPress={handleContactSupport}
            type="primary"
          />
          
          <ThemedButton
            title="Cerrar Sesión"
            onPress={handleLogout}
            type="secondary"
          />
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <ThemedText style={styles.helpText}>
            Si crees que esto es un error, contacta a nuestro equipo de soporte.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  statusCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#DC2626',
  },
  statusDescription: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reasonCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#DC2626',
  },
  reasonDescription: {
    fontSize: 14,
    color: '#7F1D1D',
    marginLeft: 28,
  },
  requirementCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FED7AA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#D97706',
  },
  requirementDescription: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 28,
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  helpContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 