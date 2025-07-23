import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useBridgeRefreshOnScreen } from '@/app/hooks/useBridgeAutoRefresh';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { bridgeStatusService } from '@/app/services/bridgeStatusService';
import { useAuthStore } from '@/app/store/authStore';
import { useBridgeStore } from '@/app/store/bridgeStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StatusStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'not_started';
  error?: string;
}

export default function BridgeStatusScreen() {
  const router = useRouter();
  const logo = useThemedAsset(
    require('@/assets/images/icon-light.png'),
    require('@/assets/images/icon-dark.png')
  );

  const { user } = useAuthStore();
  const { syncCustomerStatus } = useBridgeStore();
  
  // Auto-refresh Bridge status on this screen
  const { refreshNow } = useBridgeRefreshOnScreen('bridge-status');

  const [isLoading, setIsLoading] = useState(true);
  const [bridgeStatus, setBridgeStatus] = useState<any>(null);
  const [canAccessHome, setCanAccessHome] = useState(false);
  const [reason, setReason] = useState<string>('');

  const [steps, setSteps] = useState<StatusStep[]>([
    {
      id: 'bridge_customer',
      title: 'Customer de Bridge',
      description: 'Verificando si existe customer en Bridge...',
      status: 'pending'
    },
    {
      id: 'verification_status',
      title: 'Estado de Verificación',
      description: 'Verificando estado de verificación en Bridge...',
      status: 'pending'
    },
    {
      id: 'wallet_status',
      title: 'Estado de Wallet',
      description: 'Verificando si la wallet está activa...',
      status: 'pending'
    },
    {
      id: 'access_granted',
      title: 'Acceso a Home',
      description: 'Verificando si puede acceder a la aplicación...',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: StatusStep['status'], error?: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, status, error }
          : step
      )
    );
  };

  // Verificar estado al cargar la pantalla
  useEffect(() => {
    if (user?.id) {
      checkBridgeStatus();
    }
  }, [user]);

  const checkBridgeStatus = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Verificando estado de Bridge para acceso a home...');
      
      // Verificar si puede acceder a home
      const accessResult = await bridgeStatusService.canUserAccessHome(user!.id);
      
      setCanAccessHome(accessResult.canAccess);
      setReason(accessResult.reason || '');
      setBridgeStatus(accessResult.bridgeStatus);

      // Actualizar pasos basado en el resultado
      if (accessResult.bridgeStatus) {
        const status = accessResult.bridgeStatus;
        
        // Step 1: Bridge Customer
        if (status.bridgeCustomerId) {
          updateStepStatus('bridge_customer', 'completed');
        } else {
          updateStepStatus('bridge_customer', 'error', 'No se encontró customer de Bridge');
        }

        // Step 2: Verification Status
        if (status.verificationStatus === 'active') {
          updateStepStatus('verification_status', 'completed');
        } else if (status.verificationStatus === 'pending' || status.verificationStatus === 'in_review') {
          updateStepStatus('verification_status', 'in_progress');
        } else if (status.verificationStatus === 'rejected') {
          updateStepStatus('verification_status', 'error', 'Verificación rechazada');
        } else {
          updateStepStatus('verification_status', 'not_started');
        }

        // Step 3: Wallet Status
        if (status.hasActiveWallet) {
          updateStepStatus('wallet_status', 'completed');
        } else if (status.verificationStatus === 'active') {
          updateStepStatus('wallet_status', 'error', 'Wallet no está activa');
        } else {
          updateStepStatus('wallet_status', 'pending');
        }

        // Step 4: Access Granted
        if (status.canAccessHome) {
          updateStepStatus('access_granted', 'completed');
        } else {
          updateStepStatus('access_granted', 'error', accessResult.reason || 'Acceso denegado');
        }
      }

    } catch (error) {
      console.error('💥 Error verificando estado de Bridge:', error);
      setReason('Error verificando estado de Bridge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncStatus = async () => {
    setIsLoading(true);
    
    try {
      const result = await syncCustomerStatus();
      if (result.success) {
        Alert.alert('Éxito', 'Estado sincronizado correctamente');
        // Re-verificar estado después de sincronizar
        await checkBridgeStatus();
      } else {
        Alert.alert('Error', result.error || 'No se pudo sincronizar');
      }
    } catch (error) {
      Alert.alert('Error', 'Error sincronizando estado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryBridge = async () => {
    Alert.alert(
      'Reintentar Bridge',
      '¿Quieres intentar completar la integración con Bridge nuevamente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reintentar', 
          onPress: () => {
            router.push('/(auth)/document-review');
          }
        }
      ]
    );
  };

  const handleGoToHome = () => {
    router.replace('/(private)/home');
  };

  const getStepIcon = (step: StatusStep) => {
    if (step.status === 'completed') {
      return <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />;
    } else if (step.status === 'error') {
      return <Ionicons name="close-circle" size={24} color="#F87171" />;
    } else if (step.status === 'in_progress') {
      return <ActivityIndicator size="small" color="#3B82F6" />;
    } else if (step.status === 'not_started') {
      return <Ionicons name="ellipse-outline" size={24} color="#9CA3AF" />;
    } else {
      return <Ionicons name="time-outline" size={24} color="#F59E0B" />;
    }
  };

  const getStatusMessage = () => {
    if (isLoading) {
      return {
        title: 'Verificando estado...',
        subtitle: 'Estamos verificando el estado de tu cuenta en Bridge',
        color: '#3B82F6'
      };
    }

    if (canAccessHome) {
      return {
        title: '¡Todo listo!',
        subtitle: 'Tu cuenta está verificada y puedes acceder a la aplicación',
        color: '#4ADE80'
      };
    }

    return {
      title: 'Acceso temporalmente limitado',
      subtitle: reason || 'Hay un problema con tu verificación',
      color: '#F59E0B'
    };
  };

  const statusMessage = getStatusMessage();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.statusCircle, { backgroundColor: statusMessage.color }]}>
            {isLoading ? (
              <ActivityIndicator size={48} color="#fff" />
            ) : canAccessHome ? (
              <Ionicons name="checkmark" size={48} color="#fff" />
            ) : (
              <Ionicons name="information-circle" size={48} color="#fff" />
            )}
          </View>
          <ThemedText type="title" style={styles.title}>
            {statusMessage.title}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {statusMessage.subtitle}
          </ThemedText>
        </View>

        {/* Status Steps */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                {getStepIcon(step)}
                <View style={styles.stepContent}>
                  <ThemedText style={[styles.stepTitle, {
                    color: step.status === 'error' ? '#F87171' : undefined
                  }]}>
                    {step.title}
                  </ThemedText>
                  <ThemedText style={[styles.stepDescription, {
                    color: step.status === 'error' ? '#F87171' : '#6B7280'
                  }]}>
                    {step.status === 'error' ? step.error : step.description}
                  </ThemedText>
                </View>
              </View>
              
              {index < steps.length - 1 && (
                <View style={[styles.stepConnector, {
                  backgroundColor: step.status === 'completed' ? '#4ADE80' : '#E5E7EB'
                }]} />
              )}
            </View>
          ))}
        </View>

        {/* Bridge Status Details */}
        {bridgeStatus && (
          <View style={styles.detailsContainer}>
            <ThemedText type="subtitle" style={styles.detailsTitle}>
              Detalles del Estado
            </ThemedText>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Customer ID:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {bridgeStatus.bridgeCustomerId || 'No disponible'}
              </ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Estado:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {bridgeStatus.verificationStatus || 'No disponible'}
              </ThemedText>
            </View>
            
            {bridgeStatus.requirementsDue && bridgeStatus.requirementsDue.length > 0 && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Requerimientos:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {bridgeStatus.requirementsDue.join(', ')}
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {canAccessHome ? (
          <ThemedButton 
            title="Ir a mi cuenta"
            onPress={handleGoToHome}
            style={styles.button}
          />
        ) : (
          <>
            <ThemedButton 
              title="Sincronizar Estado"
              onPress={handleSyncStatus}
              disabled={isLoading}
              style={styles.button}
            />
            
            <ThemedButton 
              title="Reintentar Bridge"
              onPress={handleRetryBridge}
              type="outline"
              style={[styles.button, { marginTop: 12 }]}
            />
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 24,
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  progressContainer: {
    marginVertical: 24,
  },
  stepContainer: {
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  stepContent: {
    marginLeft: 16,
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepConnector: {
    width: 2,
    height: 16,
    marginLeft: 11,
    marginTop: 8,
  },
  detailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 24,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 12,
  },
}); 