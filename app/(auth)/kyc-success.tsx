import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { BridgeProgressIndicator } from '@/app/components/bridge/BridgeProgressIndicator';
import { BridgeToSWebView } from '@/app/components/bridge/BridgeToSWebView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { profileService } from '@/app/services/profileService';
import { useBridgeStore } from '@/app/store';
import { useAuthStore } from '@/app/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet, View } from 'react-native';

export default function KycSuccessScreen() {
  const router = useRouter();
  const { updateKycStatus, user, userTag } = useAuthStore(); // 🏷️ NEW: Include userTag
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
  } = useBridgeStore();
  
  const tintColor = useThemeColor({}, 'tint');
  const successColor = '#4CAF50';

  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [checkmarkAnim] = useState(new Animated.Value(0));
  const [bridgeIntegrationStarted, setBridgeIntegrationStarted] = useState(false);
  const [bridgeIntegrationCompleted, setBridgeIntegrationCompleted] = useState(false);
  
  // ToS related states
  const [showToSWebView, setShowToSWebView] = useState(false);
  const [currentKycProfile, setCurrentKycProfile] = useState<any>(null);
  
  // Check if we're in production mode
  const isProductionMode = process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE !== 'true';

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
        return;
      }

      try {
        console.log('🌉 Starting automatic Bridge integration after KYC completion...');
        setBridgeIntegrationStarted(true);

        // Get profile data for Bridge
        const profileData = await profileService.getProfileForBridge(user.id);
        
        if (!profileData) {
          console.log('⚠️ No profile data available for Bridge integration');
          setBridgeIntegrationCompleted(true);
          return;
        }

        console.log('✅ Profile data loaded for Bridge integration');
        
        // Store profile data for potential ToS flow
        setCurrentKycProfile(profileData);

        // Initialize Bridge integration
        const result = await initializeBridgeIntegration(profileData);
        
        if (result.success) {
          // Check if we're waiting for ToS acceptance in production
          if (isProductionMode && isPendingTosAcceptance && tosUrl) {
            console.log('🔐 Production mode: ToS required, showing WebView');
            setShowToSWebView(true);
            // Don't mark as completed yet - wait for ToS
          } else {
            console.log('✅ Bridge integration completed successfully');
            setBridgeIntegrationCompleted(true);
          }
        } else {
          console.log('⚠️ Bridge integration failed:', result.error);
          setBridgeIntegrationCompleted(true);
        }
      } catch (error) {
        console.error('❌ Error during Bridge integration:', error);
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
  };

  // ToS WebView handlers
  const handleTosAccept = async (signedAgreementId: string) => {
    console.log('🔐 ToS accepted, continuing Bridge integration...', signedAgreementId);
    setShowToSWebView(false);

    try {
      // 🚨 NEW: Save signed_agreement_id to database first
      if (user?.id) {
        console.log('🗄️ Saving signed_agreement_id to database...');
        const dbSaveResult = await profileService.updateSignedAgreementId(user.id, signedAgreementId);
        
        if (!dbSaveResult.success) {
          console.warn('⚠️ Failed to save signed_agreement_id to database:', dbSaveResult.error);
          Alert.alert('Warning', 'ToS aceptado pero error al guardar en base de datos: ' + dbSaveResult.error);
          // Continue anyway - the store will have the value
        } else {
          console.log('✅ Signed agreement ID saved to database successfully');
        }
      }

      // Handle the ToS acceptance in store
      await handleTosAcceptance(signedAgreementId);
      
      // Continue with customer creation if we have the KYC profile
      if (currentKycProfile) {
        console.log('🌉 Creating Bridge customer after ToS acceptance...');
        const customerResult = await createBridgeCustomer(currentKycProfile, signedAgreementId);
        
        if (customerResult.success) {
          console.log('✅ Bridge customer created successfully after ToS');
          setBridgeIntegrationCompleted(true);
        } else {
          console.error('❌ Failed to create Bridge customer:', customerResult.error);
          Alert.alert('Error', 'Error al crear el cliente Bridge: ' + customerResult.error);
          setBridgeIntegrationCompleted(true);
        }
      } else {
        console.error('❌ No KYC profile available for customer creation');
        setBridgeIntegrationCompleted(true);
      }
    } catch (error) {
      console.error('❌ Error handling ToS acceptance:', error);
      Alert.alert('Error', 'Error procesando la aceptación de términos');
      setBridgeIntegrationCompleted(true);
    }
  };

  const handleTosCancel = () => {
    console.log('❌ ToS cancelled by user');
    setShowToSWebView(false);
    cancelTosFlow();
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
    setBridgeIntegrationCompleted(true);
    
    Alert.alert(
      'Error en Términos',
      `Error al procesar términos de servicio: ${error}`,
      [{ text: 'Continuar sin Bridge', style: 'default' }]
    );
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

          {/* Bridge Integration Progress */}
          {showBridgeIntegration && (
            <View style={styles.bridgeContainer}>
              <ThemedText style={styles.bridgeTitle}>
                {bridgeIntegrationCompleted ? 'Wallet Configurada' : 'Configurando tu Wallet'}
              </ThemedText>
              
              {!bridgeIntegrationCompleted && (
                <BridgeProgressIndicator showOnlyWhenActive={false} />
              )}
              
              {bridgeIntegrationCompleted && bridgeCustomerId && (
                <View style={styles.bridgeSuccessContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={successColor} />
                  <ThemedText style={styles.bridgeSuccessText}>
                    Wallet configurada exitosamente
                  </ThemedText>
                </View>
              )}
              
              {bridgeIntegrationCompleted && (
                <View style={styles.bridgeSuccessContainer}>
                  <Ionicons name="wallet" size={24} color={successColor} />
                  <ThemedText style={styles.bridgeSuccessText}>
                    {process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true' 
                      ? 'Wallet se creará en producción'
                      : `${wallets.length} wallet${wallets.length > 1 ? 's' : ''} creada${wallets.length > 1 ? 's' : ''}`
                    }
                  </ThemedText>
                </View>
              )}
              
              {integrationError && (
                <View style={styles.bridgeErrorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                  <ThemedText style={styles.bridgeErrorText}>
                    Error en configuración: {integrationError}
                  </ThemedText>
                </View>
              )}
              
              <ThemedText style={styles.bridgeDescription}>
                {bridgeIntegrationCompleted 
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
}); 