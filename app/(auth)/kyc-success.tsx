import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { BridgeToSWebView } from '@/app/components/bridge/BridgeToSWebView';
import { UserTagDisplay } from '@/app/components/profile/UserTagDisplay';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { profileService } from '@/app/services/profileService';
import { walletService } from '@/app/services/walletService';
import { useBridgeStore } from '@/app/store';
import { useAuthStore } from '@/app/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet, View } from 'react-native';

// Bridge integration steps
type BridgeStep = 'initializing' | 'generating_tos' | 'accepting_tos' | 'creating_customer' | 'creating_wallet' | 'syncing_wallets' | 'completed' | 'error';

export default function KycSuccessScreen() {
  const router = useRouter();
  const { updateKycStatus, user, userTag } = useAuthStore();
  const {
    initializeBridgeIntegration,
    bridgeCustomerId,
    wallets,
    integrationError,
    isLoading: bridgeLoading,
    
    // New ToS states
    tosUrl,
    isPendingTosAcceptance,
    handleTosAcceptance,
    cancelTosFlow,
    createBridgeCustomer,
    retryFailedOperation,
    clearError,
  } = useBridgeStore();
  
  const tintColor = useThemeColor({}, 'tint');
  const successColor = '#4CAF50';
  const warningColor = '#FF9800';
  const errorColor = '#FF6B6B';

  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [checkmarkAnim] = useState(new Animated.Value(0));
  const [bridgeIntegrationStarted, setBridgeIntegrationStarted] = useState(false);
  const [bridgeIntegrationCompleted, setBridgeIntegrationCompleted] = useState(false);
  
  // Enhanced Bridge integration states
  const [currentBridgeStep, setCurrentBridgeStep] = useState<BridgeStep>('initializing');
  const [bridgeStepProgress, setBridgeStepProgress] = useState(0);
  const [stepMessages, setStepMessages] = useState<string[]>([]);
  
  // ToS related states
  const [showToSWebView, setShowToSWebView] = useState(false);
  const [currentKycProfile, setCurrentKycProfile] = useState<any>(null);
  
  // Wallet sync states
  const [isWalletSyncing, setIsWalletSyncing] = useState(false);
  const [walletSyncCompleted, setWalletSyncCompleted] = useState(false);
  const [walletSyncError, setWalletSyncError] = useState<string | null>(null);
  
  // Check if we're in production mode
  const isProductionMode = process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE !== 'true';

  // Step configurations
  const bridgeSteps = {
    initializing: {
      title: 'Iniciando configuración',
      description: 'Preparando integración con Bridge',
      icon: 'settings-outline',
      color: tintColor,
    },
    generating_tos: {
      title: 'Generando términos',
      description: 'Preparando términos de servicio',
      icon: 'document-text-outline',
      color: warningColor,
    },
    accepting_tos: {
      title: 'Aceptando términos',
      description: 'Esperando tu confirmación',
      icon: 'checkmark-circle-outline',
      color: warningColor,
    },
    creating_customer: {
      title: 'Creando cuenta',
      description: 'Configurando tu cuenta Bridge',
      icon: 'person-add-outline',
      color: warningColor,
    },
    creating_wallet: {
      title: 'Creando wallet',
      description: 'Configurando tu wallet crypto',
      icon: 'wallet-outline',
      color: warningColor,
    },
    syncing_wallets: {
      title: 'Sincronizando',
      description: 'Sincronizando wallets',
      icon: 'sync-outline',
      color: warningColor,
    },
    completed: {
      title: '¡Configuración completa!',
      description: 'Tu wallet está lista para usar',
      icon: 'checkmark-circle',
      color: successColor,
    },
    error: {
      title: 'Error en configuración',
      description: 'Hubo un problema con la configuración',
      icon: 'alert-circle',
      color: errorColor,
    },
  };

  useEffect(() => {
    // Update KYC status to completed
    updateKycStatus('completed');

    // Start animations
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Start Bridge integration after animations
    const startBridgeIntegration = async () => {
      if (!user?.id) {
        console.log('⚠️ No user ID available for Bridge integration');
        setCurrentBridgeStep('error');
        return;
      }

      try {
        console.log('🌉 Starting automatic Bridge integration after KYC completion...');
        setBridgeIntegrationStarted(true);
        setCurrentBridgeStep('initializing');
        setStepMessages(['Iniciando configuración de Bridge...']);

        // Step 1: Get profile data
        setCurrentBridgeStep('generating_tos');
        setStepMessages(prev => [...prev, 'Obteniendo datos del perfil...']);
        
        const profileData = await profileService.getProfileForBridge(user.id);
        
        if (!profileData) {
          console.log('⚠️ No profile data available for Bridge integration');
          setCurrentBridgeStep('error');
          setStepMessages(prev => [...prev, '❌ No se encontraron datos del perfil']);
          setBridgeIntegrationCompleted(true);
          return;
        }

        console.log('✅ Profile data loaded for Bridge integration');
        setStepMessages(prev => [...prev, '✅ Datos del perfil obtenidos']);
        
        // Store profile data for potential ToS flow
        setCurrentKycProfile(profileData);

        // Step 2: Initialize Bridge integration
        setCurrentBridgeStep('generating_tos');
        setStepMessages(prev => [...prev, 'Generando términos de servicio...']);
        
        const result = await initializeBridgeIntegration(profileData);
        
        if (result.success) {
          setStepMessages(prev => [...prev, '✅ Términos de servicio generados']);
          
          // Check if we're waiting for ToS acceptance in production
          if (isProductionMode && isPendingTosAcceptance && tosUrl) {
            console.log('🔐 Production mode: ToS required, showing WebView');
            setCurrentBridgeStep('accepting_tos');
            setStepMessages(prev => [...prev, 'Esperando aceptación de términos...']);
            setShowToSWebView(true);
            // Don't mark as completed yet - wait for ToS
          } else {
            console.log('✅ Bridge integration completed successfully');
            setCurrentBridgeStep('completed');
            setStepMessages(prev => [...prev, '✅ Configuración completada']);
            
            // Auto-sync wallets after successful Bridge integration
            await autoSyncWallets();
            
            setBridgeIntegrationCompleted(true);
          }
        } else {
          console.log('⚠️ Bridge integration failed:', result.error);
          setCurrentBridgeStep('error');
          setStepMessages(prev => [...prev, `❌ Error: ${result.error}`]);
          setBridgeIntegrationCompleted(true);
        }
      } catch (error) {
        console.error('❌ Error during Bridge integration:', error);
        setCurrentBridgeStep('error');
        setStepMessages(prev => [...prev, `❌ Error inesperado: ${error}`]);
        setBridgeIntegrationCompleted(true);
      }
    };

    // Start Bridge integration after a short delay
    const timer = setTimeout(startBridgeIntegration, 2000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  const handleContinue = () => {
    console.log('handleContinue');
    router.replace('/(private)/home');
  };

  const handleSkipBridge = () => {
    console.log('Skipping Bridge integration');
    setBridgeIntegrationCompleted(true);
    setCurrentBridgeStep('completed');
  };

  const handleRetryBridgeIntegration = async () => {
    console.log('🔄 Retrying Bridge integration...');
    setCurrentBridgeStep('initializing');
    setStepMessages(['Reintentando configuración...']);
    clearError();
    
    try {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      const profileData = await profileService.getProfileForBridge(user.id);
      if (!profileData) {
        throw new Error('No profile data available');
      }

      const result = await retryFailedOperation(async () => {
        return initializeBridgeIntegration(profileData);
      });

      if (result.success) {
        setCurrentBridgeStep('completed');
        setStepMessages(prev => [...prev, '✅ Reintento exitoso']);
        setBridgeIntegrationCompleted(true);
      } else {
        setCurrentBridgeStep('error');
        setStepMessages(prev => [...prev, `❌ Error en reintento: ${result.error}`]);
      }
    } catch (error) {
      console.error('❌ Error during retry:', error);
      setCurrentBridgeStep('error');
      setStepMessages(prev => [...prev, `❌ Error en reintento: ${error}`]);
    }
  };

  // ToS WebView handlers
  const handleTosAccept = async (signedAgreementId: string) => {
    console.log('🔐 ToS accepted, continuing Bridge integration...', signedAgreementId);
    setShowToSWebView(false);
    setCurrentBridgeStep('creating_customer');
    setStepMessages(prev => [...prev, '✅ Términos aceptados', 'Creando cuenta Bridge...']);

    try {
      // Save signed_agreement_id to database first
      if (user?.id) {
        console.log('🗄️ Saving signed_agreement_id to database...');
        const dbSaveResult = await profileService.updateSignedAgreementId(user.id, signedAgreementId);
        
        if (!dbSaveResult.success) {
          console.warn('⚠️ Failed to save signed_agreement_id to database:', dbSaveResult.error);
          setStepMessages(prev => [...prev, '⚠️ Advertencia: Error al guardar en base de datos']);
        } else {
          console.log('✅ Signed agreement ID saved to database successfully');
          setStepMessages(prev => [...prev, '✅ Términos guardados en base de datos']);
        }
      }

      // Handle the ToS acceptance in store
      await handleTosAcceptance(signedAgreementId);
      
      // Continue with customer creation if we have the KYC profile
      if (currentKycProfile) {
        console.log('🌉 Creating Bridge customer after ToS acceptance...');
        setCurrentBridgeStep('creating_customer');
        setStepMessages(prev => [...prev, 'Creando cuenta Bridge...']);
        
        const customerResult = await createBridgeCustomer(currentKycProfile, signedAgreementId);
        
        if (customerResult.success) {
          console.log('✅ Bridge customer created successfully after ToS');
          setCurrentBridgeStep('creating_wallet');
          setStepMessages(prev => [...prev, '✅ Cuenta Bridge creada', 'Configurando wallet...']);
          
          // Auto-sync wallets
          await autoSyncWallets();
          
          setCurrentBridgeStep('completed');
          setStepMessages(prev => [...prev, '✅ Wallet configurada']);
          setBridgeIntegrationCompleted(true);
        } else {
          console.error('❌ Failed to create Bridge customer:', customerResult.error);
          setCurrentBridgeStep('error');
          setStepMessages(prev => [...prev, `❌ Error al crear cuenta: ${customerResult.error}`]);
          setBridgeIntegrationCompleted(true);
        }
      } else {
        console.error('❌ No KYC profile available for customer creation');
        setCurrentBridgeStep('error');
        setStepMessages(prev => [...prev, '❌ No hay datos de perfil disponibles']);
        setBridgeIntegrationCompleted(true);
      }
    } catch (error) {
      console.error('❌ Error handling ToS acceptance:', error);
      setCurrentBridgeStep('error');
      setStepMessages(prev => [...prev, `❌ Error procesando aceptación: ${error}`]);
      setBridgeIntegrationCompleted(true);
    }
  };

  const handleTosCancel = () => {
    console.log('❌ ToS cancelled by user');
    setShowToSWebView(false);
    cancelTosFlow();
    setCurrentBridgeStep('error');
    setStepMessages(prev => [...prev, '❌ Términos cancelados por el usuario']);
    setBridgeIntegrationCompleted(true);
    
    Alert.alert(
      'Términos Requeridos',
      'Los términos de servicio de Bridge son requeridos para usar la funcionalidad de wallet. Puedes continuar sin esta función.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  const handleTosError = (error: string) => {
    console.error('❌ ToS WebView error:', error);
    setShowToSWebView(false);
    setCurrentBridgeStep('error');
    setStepMessages(prev => [...prev, `❌ Error en términos: ${error}`]);
    setBridgeIntegrationCompleted(true);
    
    Alert.alert(
      'Error en Términos',
      `Error al procesar términos de servicio: ${error}`,
      [{ text: 'Continuar sin Bridge', style: 'default' }]
    );
  };

  // Auto-sync wallets after successful Bridge integration
  const autoSyncWallets = async () => {
    if (!user?.id || !bridgeCustomerId) {
      console.log('⚠️ Missing user ID or Bridge customer ID for wallet sync');
      return;
    }

    console.log('💳 Starting auto-sync wallets after KYC success...');
    setIsWalletSyncing(true);
    setWalletSyncError(null);
    setCurrentBridgeStep('syncing_wallets');
    setStepMessages(prev => [...prev, 'Sincronizando wallets...']);

    try {
      console.log('💳 Syncing wallets for user:', { userId: user.id, customerId: bridgeCustomerId });

      // Sync wallets from Bridge to database using user.id as profileId
      const syncResult = await walletService.syncWallets(user.id, bridgeCustomerId);
      
      if (syncResult.success) {
        console.log(`✅ Wallet sync completed successfully: ${syncResult.syncedCount} wallets synced`);
        setWalletSyncCompleted(true);
        setStepMessages(prev => [...prev, `✅ ${syncResult.createdCount} wallet(s) sincronizada(s)`]);
        
        // Show success message if wallets were found/created
        if (syncResult.createdCount > 0) {
          Alert.alert(
            'Wallets Synchronized',
            `Found and synchronized ${syncResult.createdCount} wallet${syncResult.createdCount > 1 ? 's' : ''} from Bridge.`,
            [{ text: 'Great!' }]
          );
        }
      } else {
        console.error('❌ Wallet sync failed:', syncResult.errors);
        setWalletSyncError(syncResult.errors.join(', '));
        setStepMessages(prev => [...prev, `❌ Error sincronizando wallets: ${syncResult.errors.join(', ')}`]);
      }
    } catch (error) {
      console.error('💥 Error during wallet sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setWalletSyncError(errorMessage);
      setStepMessages(prev => [...prev, `❌ Error sincronizando wallets: ${errorMessage}`]);
    } finally {
      setIsWalletSyncing(false);
    }
  };

  // Show Bridge integration status
  const showBridgeIntegration = process.env.EXPO_PUBLIC_BRIDGE_API_KEY && bridgeIntegrationStarted;
  const canContinue = bridgeIntegrationCompleted || !showBridgeIntegration;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.checkCircle, { backgroundColor: successColor }]}>
            <Animated.View style={{ opacity: checkmarkAnim }}>
              <Ionicons name="checkmark" size={72} color="#FFF" />
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContent, { opacity: fadeAnim }]}>
          <ThemedText type="title" style={styles.title}>
            ¡Verificación Completada!
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funciones de Peyo Pagos.
          </ThemedText>

          {/* User Tag Display */}
          {userTag && (
            <View style={{ marginVertical: 20, alignItems: 'center' }}>
              <ThemedText style={[styles.subtitle, { marginBottom: 12, fontWeight: '600' }]}>
                Tu código de usuario
              </ThemedText>
              <UserTagDisplay 
                userTag={userTag}
                size="large"
                showCopyButton={true}
              />
              <ThemedText style={[styles.subtitle, { marginTop: 12, fontSize: 14, opacity: 0.7, textAlign: 'center' }]}>
                Guarda este código para futuras referencias
              </ThemedText>
            </View>
          )}

          {/* Enhanced Bridge Integration Progress */}
          {showBridgeIntegration && (
            <View style={styles.bridgeContainer}>
              <ThemedText style={styles.bridgeTitle}>
                {bridgeSteps[currentBridgeStep].title}
              </ThemedText>
              
              {/* Current Step Indicator */}
              <View style={styles.currentStepContainer}>
                <Ionicons 
                  name={bridgeSteps[currentBridgeStep].icon as any} 
                  size={24} 
                  color={bridgeSteps[currentBridgeStep].color} 
                />
                <ThemedText style={[styles.currentStepText, { color: bridgeSteps[currentBridgeStep].color }]}>
                  {bridgeSteps[currentBridgeStep].description}
                </ThemedText>
              </View>
              
              {/* Progress Steps */}
              <View style={styles.stepsContainer}>
                {stepMessages.map((message, index) => (
                  <View key={index} style={styles.stepMessage}>
                    <ThemedText style={[
                      styles.stepText,
                      { color: message.startsWith('✅') ? successColor : 
                         message.startsWith('❌') ? errorColor : 
                         message.startsWith('⚠️') ? warningColor : 
                         '#666' }
                    ]}>
                      {message}
                    </ThemedText>
                  </View>
                ))}
              </View>
              
              {/* Error State with Retry */}
              {currentBridgeStep === 'error' && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={24} color={errorColor} />
                  <ThemedText style={styles.errorText}>
                    {integrationError || 'Error en la configuración'}
                  </ThemedText>
                  <ThemedButton
                    title="Reintentar Configuración"
                    type="primary"
                    onPress={handleRetryBridgeIntegration}
                    style={styles.retryButton}
                  />
                </View>
              )}
              
              {/* Success State */}
              {currentBridgeStep === 'completed' && bridgeCustomerId && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={successColor} />
                  <ThemedText style={styles.successText}>
                    Wallet configurada exitosamente
                  </ThemedText>
                </View>
              )}
              
              <ThemedText style={styles.bridgeDescription}>
                {currentBridgeStep === 'completed' 
                  ? (process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true' 
                      ? 'Tu cuenta Bridge está configurada. La wallet se activará en producción.'
                      : 'Tu wallet crypto está lista para usar.')
                  : 'Estamos configurando tu wallet crypto automáticamente. Esto puede tardar unos momentos.'
                }
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Continue Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
        {!canContinue ? (
          <ThemedButton
            title="Omitir Configuración"
            type="outline"
            size="large"
            onPress={handleSkipBridge}
            style={styles.skipButton}
          />
        ) : (
          <ThemedButton
            title="Continuar a la App"
            type="outline"
            size="large"
            onPress={handleContinue}
            style={styles.continueButton}
          />
        )}
      </Animated.View>

      {/* Bridge ToS WebView for Production */}
      {showToSWebView && tosUrl && (
        <BridgeToSWebView
          visible={showToSWebView}
          tosUrl={tosUrl}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 32,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  bridgeContainer: {
    width: '100%',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  bridgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  bridgeDescription: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
    lineHeight: 18,
  },
  bridgeSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  bridgeSuccessText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bridgeErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  bridgeErrorText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#FF6B6B',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    paddingVertical: 24,
  },
  continueButton: {
    width: '100%',
  },
  skipButton: {
    width: '100%',
    borderColor: '#FF9800',
  },
  walletSyncContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingIndicator: {
    marginRight: 8,
  },
  syncingText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  syncErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  syncErrorText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#FF9800',
    flex: 1,
  },
  currentStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentStepText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  stepsContainer: {
    marginTop: 12,
  },
  stepMessage: {
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
  },
  errorContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
    color: '#FF6B6B',
  },
  retryButton: {
    width: '100%',
    borderColor: '#FF9800',
  },
  successContainer: {
    marginTop: 12,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  successText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
}); 