import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { BridgeToSWebView } from '@/app/components/bridge/BridgeToSWebView';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { convertDatabaseProfileToBridge, kycService } from '@/app/services/kycService';
import { profileService } from '@/app/services/profileService';
import { useBridgeStore } from '@/app/store';
import { useAuthStore } from '@/app/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  error?: string;
}

export default function VerificationSuccessScreen() {
  const router = useRouter();
  const logo = useThemedAsset(
    require('@/assets/images/icon-light.png'),
    require('@/assets/images/icon-dark.png')
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [processCompleted, setProcessCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showToSWebView, setShowToSWebView] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [steps, setSteps] = useState<ProcessStep[]>([
    {
      id: 'kyc_submission',
      title: 'Verificando datos KYC',
      description: 'Procesando tu información de verificación...',
      status: 'pending'
    },
    {
      id: 'profile_creation',
      title: 'Creando tu perfil',
      description: 'Guardando tu información en la base de datos...',
      status: 'pending'
    },
    {
      id: 'bridge_initialization',
      title: 'Conectando con Bridge',
      description: 'Preparando tu integración con Bridge...',
      status: 'pending'
    },
    {
      id: 'tos_generation',
      title: 'Términos de servicio',
      description: 'Generando enlace de términos y condiciones...',
      status: 'pending'
    },
    {
      id: 'tos_acceptance',
      title: 'Aceptación de términos',
      description: 'Esperando que aceptes los términos de Bridge...',
      status: 'pending'
    },
    {
      id: 'customer_creation',
      title: 'Creando perfil Bridge',
      description: 'Registrando tu cuenta en Bridge...',
      status: 'pending'
    },
    {
      id: 'wallet_creation',
      title: 'Creando tu wallet',
      description: 'Configurando tu wallet de Solana...',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: ProcessStep['status'], error?: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, status, error }
          : step
      )
    );
  };

  const findStepIndex = (stepId: string) => {
    return steps.findIndex(step => step.id === stepId);
  };

  // Función para refrescar el estado desde Bridge
  const refreshBridgeStatus = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log('🔄 Refrescando estado desde Bridge...');
      
      // Importar el servicio de Bridge
      const { bridgeStatusService } = await import('@/app/services/bridgeStatusService');
      const { useAuthStore } = await import('@/app/store/authStore');
      
      const { user } = useAuthStore.getState();
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        return;
      }

      const result = await bridgeStatusService.checkAndUpdateBridgeStatus(user.id);
      
      if (result.success) {
        console.log('✅ Estado de Bridge actualizado:', result);
        
        // Actualizar el estado local basado en el resultado
        if (result.verificationStatus === 'active') {
          // Usuario aprobado, redirigir a home
          router.replace('/(private)/home');
        } else if (result.verificationStatus === 'rejected') {
          // Usuario rechazado, redirigir a kyc-rejected
          router.replace('/(auth)/kyc-rejected');
        } else {
          // Estado pendiente, mostrar mensaje
          Alert.alert(
            'Estado Actualizado',
            `Tu estado actual es: ${result.verificationStatus || 'pendiente'}. Te notificaremos cuando esté listo.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        console.error('❌ Error refrescando estado:', result.error);
        Alert.alert(
          'Error',
          'No se pudo actualizar el estado. Inténtalo de nuevo.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('💥 Error en refreshBridgeStatus:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error al actualizar el estado.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-start the process when component mounts
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      console.log('🚀 Auto-starting KYC completion process...');
      
      // Check current state before starting
      checkCurrentState().then(() => {
        // Clear rate limit before starting
        const { clearRateLimit } = useBridgeStore.getState();
        clearRateLimit().then(() => {
          handleContinue();
        });
      });
    }
  }, []);

  // Check current state of KYC and Bridge
  const checkCurrentState = async () => {
    try {
      const { user } = useAuthStore.getState();
      if (!user?.id) {
        console.log('❌ No user found for state check');
        return;
      }

      console.log('🔍 Checking current state...');

      // Check if profile exists
      const { exists: profileExists } = await profileService.checkProfileExists(user.id);
      if (profileExists) {
        console.log('✅ Profile already exists');
        updateStepStatus('profile_creation', 'completed');
      }

      // Check Bridge state
      const { isInitialized, bridgeCustomerId, hasAcceptedTermsOfService } = useBridgeStore.getState();
      if (isInitialized && bridgeCustomerId) {
        console.log('✅ Bridge already initialized');
        updateStepStatus('bridge_initialization', 'completed');
        updateStepStatus('tos_generation', 'completed');
        updateStepStatus('tos_acceptance', 'completed');
        updateStepStatus('customer_creation', 'completed');
        updateStepStatus('wallet_creation', 'completed');
        
        setProcessCompleted(true);
        setCanContinue(true);
        return;
      }

      console.log('🔍 Current state check completed');
    } catch (error) {
      console.error('❌ Error checking current state:', error);
    }
  };

  const handleContinue = async () => {
    if (processCompleted) {
      // Si el proceso ya se completó, ir directamente a home
      router.replace('/(private)/home');
      return;
    }

    if (isProcessing) {
      console.log('⏳ Process already in progress, skipping...');
      return;
    }

    setIsProcessing(true);
    setCanContinue(false);

    try {
      // Step 1: KYC Submission
      console.log('🔄 Starting KYC submission process...');
      setCurrentStepIndex(0);
      updateStepStatus('kyc_submission', 'in_progress');

      // Check if we need to complete KYC or if it's already done
      const { user } = useAuthStore.getState();
      if (user?.id) {
        const { exists: profileExists } = await profileService.checkProfileExists(user.id);
        
        if (profileExists) {
          console.log('✅ Profile already exists, skipping KYC completion');
          updateStepStatus('kyc_submission', 'completed');
          updateStepStatus('profile_creation', 'completed');
        } else {
          // Complete the selfie step and trigger KYC completion
          console.log('🔄 Completing KYC process...');
          const kycAdvanceResult = await kycService.advanceToNextStep('selfie');
          
          if (!kycAdvanceResult.success) {
            throw new Error(kycAdvanceResult.error || 'KYC submission failed');
          }

          updateStepStatus('kyc_submission', 'completed');

          // Add delay to avoid rate limiting
          console.log('⏳ Waiting 1 second after KYC completion...');
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Step 2: Profile Creation (already handled by submitKycData in advanceToNextStep)
          console.log('✅ KYC submission completed, profiles should be created');
          setCurrentStepIndex(1);
          updateStepStatus('profile_creation', 'completed');
        }
      }

      // Step 3: Bridge Initialization
      console.log('🌉 Starting Bridge integration...');
      setCurrentStepIndex(2);
      updateStepStatus('bridge_initialization', 'in_progress');

      // Check if Bridge is already initialized
      const bridgeState = useBridgeStore.getState();
      
      if (bridgeState.isInitialized && bridgeState.bridgeCustomerId) {
        console.log('✅ Bridge already initialized');
        updateStepStatus('bridge_initialization', 'completed');
        updateStepStatus('tos_generation', 'completed');
        updateStepStatus('tos_acceptance', 'completed');
        updateStepStatus('customer_creation', 'completed');
        updateStepStatus('wallet_creation', 'completed');
        
        setProcessCompleted(true);
        setCanContinue(true);
        setIsProcessing(false);
        return;
      }

      // Check if we have a profile but Bridge is not initialized
      if (user?.id) {
        const { exists: profileExists } = await profileService.checkProfileExists(user.id);
        if (profileExists) {
          console.log('✅ Profile exists but Bridge not initialized, proceeding with Bridge setup');
        }
      }

             // Initialize Bridge integration with delay to avoid rate limiting
       console.log('⏳ Waiting 2 seconds before Bridge initialization...');
       await new Promise(resolve => setTimeout(resolve, 2000));
       
       const bridgeResult = await kycService.initializeBridgeIntegration();
       
       if (!bridgeResult.success) {
         throw new Error(bridgeResult.error || 'Bridge integration failed');
       }

      updateStepStatus('bridge_initialization', 'completed');

      // Step 4: ToS Generation - This is handled by the Bridge integration
      setCurrentStepIndex(3);
      updateStepStatus('tos_generation', 'completed');

      // Check if we're in production mode and need ToS acceptance
      const { isPendingTosAcceptance, tosUrl } = useBridgeStore.getState();
      const hasAcceptedTermsOfService = bridgeState.hasAcceptedTermsOfService;
      
      if (isPendingTosAcceptance && tosUrl) {
        // Step 5: Show WebView for ToS acceptance
        setCurrentStepIndex(4);
        updateStepStatus('tos_acceptance', 'in_progress');
        
        console.log('🔐 Production mode: ToS required, showing WebView');
        setShowToSWebView(true);
        
        // Don't mark as completed yet - wait for ToS acceptance via WebView
        return;
      } else if (hasAcceptedTermsOfService) {
        // ToS already accepted, complete remaining steps
        updateStepStatus('tos_acceptance', 'completed');
        updateStepStatus('customer_creation', 'completed');
        updateStepStatus('wallet_creation', 'completed');
        setProcessCompleted(true);
        setCanContinue(true);
      } else {
        // Sandbox mode or ToS not required
        updateStepStatus('tos_acceptance', 'completed');
        updateStepStatus('customer_creation', 'completed');
        updateStepStatus('wallet_creation', 'completed');
        setProcessCompleted(true);
        setCanContinue(true);
      }

    } catch (error) {
      console.error('💥 Error in process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update current step as error
      const currentStep = steps[currentStepIndex];
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', errorMessage);
      }

      Alert.alert(
        'Error en el proceso',
        `Ocurrió un error: ${errorMessage}\n\n¿Quieres reintentar?`,
        [
          { 
            text: 'Cancelar', 
            style: 'cancel',
            onPress: () => {
              setIsProcessing(false);
              setCanContinue(true);
            }
          },
          { 
            text: 'Reintentar', 
            onPress: () => {
              // Reset failed step and retry
              if (currentStep) {
                updateStepStatus(currentStep.id, 'pending');
              }
              handleContinue();
            }
          }
        ]
      );
    } finally {
      if (!useBridgeStore.getState().isPendingTosAcceptance) {
        setIsProcessing(false);
      }
    }
  };

  // ToS WebView handlers
  const handleTosAccept = async (signedAgreementId: string) => {
    console.log('🔐 ToS accepted via WebView, continuing process...', signedAgreementId);
    setShowToSWebView(false);
    updateStepStatus('tos_acceptance', 'completed');

    try {
      // Continue with customer creation
      setCurrentStepIndex(5);
      updateStepStatus('customer_creation', 'in_progress');
      
      // Get Bridge store functions
      const { createBridgeCustomer } = useBridgeStore.getState();
      
      // Get profile data for customer creation
      const { user } = useAuthStore.getState();
      if (!user?.id) {
        throw new Error('No user found for customer creation');
      }

      const profileData = await profileService.getProfileForBridge(user.id);
      if (!profileData) {
        throw new Error('No profile data available for customer creation');
      }

      // Convert profile data to Bridge format
      const bridgeProfile = convertDatabaseProfileToBridge(profileData);
      if (!bridgeProfile) {
        throw new Error('Failed to convert profile data for Bridge');
      }

      // Create Bridge customer
      const customerResult = await createBridgeCustomer(bridgeProfile, signedAgreementId);
      
      if (customerResult.success) {
        console.log('✅ Bridge customer created successfully');
        updateStepStatus('customer_creation', 'completed');
        
        // Step 6: Wallet creation
        setCurrentStepIndex(6);
        updateStepStatus('wallet_creation', 'in_progress');
        
        // Wallet creation is handled by Bridge automatically
        // We need to check the actual wallet status from Bridge
        console.log('🔄 Checking actual wallet status from Bridge...');
        
        // Get Bridge store functions
        const { syncCustomerStatus } = useBridgeStore.getState();
        
        // Sync customer status to get latest wallet information
        const syncResult = await syncCustomerStatus();
        
        if (syncResult.success) {
          const bridgeState = useBridgeStore.getState();
          const hasActiveWallet = bridgeState.wallets.length > 0 && 
                                 bridgeState.wallets.some(wallet => wallet.is_enabled);
          
          if (hasActiveWallet) {
            console.log('✅ Wallet is active, marking as completed');
            updateStepStatus('wallet_creation', 'completed');
            setProcessCompleted(true);
            setCanContinue(true);
            setIsProcessing(false);
          } else {
            console.log('⚠️ Wallet not yet active, marking as pending');
            updateStepStatus('wallet_creation', 'pending');
            setProcessCompleted(false);
            setCanContinue(true);
            setIsProcessing(false);
          }
        } else {
          console.log('⚠️ Could not sync wallet status, marking as pending');
          updateStepStatus('wallet_creation', 'pending');
          setProcessCompleted(false);
          setCanContinue(true);
          setIsProcessing(false);
        }
        
      } else {
        throw new Error(customerResult.error || 'Failed to create Bridge customer');
      }
    } catch (error) {
      console.error('❌ Error in customer creation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateStepStatus('customer_creation', 'error', errorMessage);
      setIsProcessing(false);
    }
  };

  const handleTosCancel = () => {
    console.log('❌ ToS cancelled by user');
    setShowToSWebView(false);
    updateStepStatus('tos_acceptance', 'error', 'ToS acceptance cancelled by user');
    setIsProcessing(false);
    
    Alert.alert(
      'Términos Requeridos',
      'Los términos de servicio de Bridge son requeridos para usar la funcionalidad de wallet. Puedes continuar sin esta función.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  const handleTosError = (error: string) => {
    console.error('❌ ToS WebView error:', error);
    setShowToSWebView(false);
    updateStepStatus('tos_acceptance', 'error', `Error en términos: ${error}`);
    setIsProcessing(false);
    
    Alert.alert(
      'Error en Términos',
      `Error al procesar términos de servicio: ${error}`,
      [{ text: 'Continuar sin Bridge', style: 'default' }]
    );
  };

  const getStepIcon = (step: ProcessStep, index: number) => {
    if (step.status === 'completed') {
      return <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />;
    } else if (step.status === 'error') {
      return <Ionicons name="close-circle" size={24} color="#F87171" />;
    } else if (step.status === 'in_progress') {
      return <ActivityIndicator size="small" color="#3B82F6" />;
    } else {
      return (
        <View style={[styles.stepNumber, { 
          backgroundColor: index <= currentStepIndex ? '#3B82F6' : '#E5E7EB' 
        }]}>
          <ThemedText style={[styles.stepNumberText, {
            color: index <= currentStepIndex ? '#FFFFFF' : '#9CA3AF'
          }]}>
            {index + 1}
          </ThemedText>
        </View>
      );
    }
  };

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
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={72} color="#fff" />
          </View>
          <ThemedText type="title" style={styles.title}>
            {processCompleted ? '¡Configuración Completa!' : 'Configurando tu cuenta'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {processCompleted 
              ? 'Tu cuenta de Bridge y wallet están listos para usar'
              : isProcessing 
                ? 'Por favor espera mientras configuramos tu cuenta...'
                : 'Tus datos de verificación se enviaron correctamente'
            }
          </ThemedText>
        </View>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                {getStepIcon(step, index)}
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

        {/* Special message for ToS acceptance */}
        {steps.find(s => s.id === 'tos_acceptance')?.status === 'in_progress' && (
          <View style={styles.tosMessage}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <ThemedText style={styles.tosMessageText}>
              Se abrirá una ventana para que aceptes los términos de servicio de Bridge.
              Una vez que los aceptes, el proceso continuará automáticamente.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <ThemedButton 
          title={processCompleted ? "Ir a mi cuenta" : isProcessing ? "Procesando..." : "Reintentar"}
          onPress={handleContinue}
          disabled={isProcessing && !canContinue}
          style={styles.button}
        />
        
        {isProcessing && !canContinue && (
          <ThemedText style={styles.processingText}>
            Este proceso puede tomar unos minutos...
          </ThemedText>
        )}
        
        {/* Debug buttons */}
        {!isProcessing && (
          <View style={{ width: '100%' }}>
            <ThemedButton 
              title="Limpiar Rate Limit (Debug)"
              onPress={async () => {
                const { clearRateLimit } = useBridgeStore.getState();
                await clearRateLimit();
                Alert.alert('Rate Limit Limpiado', 'El rate limit ha sido limpiado. Puedes intentar de nuevo.');
              }}
              type="outline"
              style={[styles.button, { marginTop: 8, backgroundColor: '#FEF3C7' }]}
            />
            
            <ThemedButton 
              title="Verificar Estado Actual"
              onPress={async () => {
                await checkCurrentState();
                Alert.alert('Estado Verificado', 'Se ha verificado el estado actual del proceso.');
              }}
              type="outline"
              style={[styles.button, { marginTop: 8, backgroundColor: '#E0F2FE' }]}
            />
            
            <ThemedButton 
              title={isRefreshing ? "Refrescando..." : "🔄 Refrescar Estado Bridge"}
              onPress={refreshBridgeStatus}
              disabled={isRefreshing}
              type="outline"
              style={[styles.button, { marginTop: 8, backgroundColor: '#F0FDF4' }]}
            />
          </View>
        )}
      </View>

      {/* Bridge ToS WebView */}
      {showToSWebView && (
        <BridgeToSWebView
          visible={showToSWebView}
          tosUrl={useBridgeStore.getState().tosUrl || ''}
          onAccept={handleTosAccept}
          onClose={handleTosCancel}
          onError={handleTosError}
        />
      )}
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
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4ADE80',
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
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepConnector: {
    width: 2,
    height: 16,
    marginLeft: 11,
    marginTop: 8,
  },
  tosMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF4FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  tosMessageText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1E40AF',
  },
  buttonContainer: {
    padding: 24,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 12,
  },
  processingText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
}); 