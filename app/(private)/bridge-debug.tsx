import { BridgeProgressIndicator } from '@/app/components/bridge/BridgeProgressIndicator';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { bridgeService } from '@/app/services/bridgeService';
import { kycService } from '@/app/services/kycService';
import { profileService } from '@/app/services/profileService';
import { supabaseAdmin } from '@/app/services/supabaseAdmin';
import { supabase } from '@/app/services/supabaseClient';
import { useBridgeStore } from '@/app/store';
import { useAuthStore } from '@/app/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function BridgeDebugScreen() {
  const router = useRouter();
  const { profile, user, isAuthenticated } = useAuthStore();
  const [isLoadingBridgeAction, setIsLoadingBridgeAction] = useState(false);
  const [bridgeProfile, setBridgeProfile] = useState<any>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<any>(null);

  const {
    bridgeCustomerId,
    bridgeVerificationStatus,
    hasAcceptedTermsOfService,
    wallets,
    integrationError,
    isLoading: bridgeLoading,
    isInitialized,
    generateTosLink,
    acceptTermsOfService,
    createBridgeCustomer,
    createDefaultWallet,
    syncCustomerStatus,
    resetBridgeIntegration,
    clearError,
    initializeBridgeIntegration,
    showToSForUser,
    isPendingTosAcceptance,
    tosUrl
  } = useBridgeStore();

  // Check environment mode
  const isSandboxMode = process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true';

  // Load Bridge profile data and environment info on mount
  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        try {
          console.log('🌉 Loading Bridge profile data...');
          const profileData = await profileService.getProfileForBridge(user.id);
          setBridgeProfile(profileData);
          console.log('✅ Bridge profile loaded:', !!profileData);

          // Load environment info
          setEnvironmentInfo({
            sandboxMode: isSandboxMode,
            apiUrl: process.env.EXPO_PUBLIC_BRIDGE_API_URL,
            hasApiKey: !!process.env.EXPO_PUBLIC_BRIDGE_API_KEY,
            appUrl: process.env.EXPO_PUBLIC_APP_URL,
            userId: user.id,
            userEmail: user.email
          });
        } catch (error) {
          console.error('❌ Error loading Bridge profile:', error);
        }
      }
    };

    loadData();
  }, [user?.id, isSandboxMode]);

  // Bridge action handlers
  const handleBridgeAction = async (action: () => Promise<any>, actionName: string) => {
    setIsLoadingBridgeAction(true);
    try {
      console.log(`🌉 Executing ${actionName}...`);
      const result = await action();
      
      if (result.success === false) {
        Alert.alert('Error', result.error || `Failed to ${actionName}`);
      } else {
        Alert.alert('Éxito', `${actionName} completado correctamente`);
      }
    } catch (error) {
      console.error(`💥 Error in ${actionName}:`, error);
      Alert.alert('Error', `Error executing ${actionName}`);
    } finally {
      setIsLoadingBridgeAction(false);
    }
  };

  const handleGenerateToS = async () => {
    if (isSandboxMode) {
      await handleBridgeAction(async () => {
        const result = await generateTosLink();
        if (result.agreementId) {
          acceptTermsOfService(result.agreementId);
          return { success: true };
        }
        return { success: false, error: result.error };
      }, 'Generar ToS (Sandbox)');
    } else {
      await handleBridgeAction(async () => {
        return await showToSForUser();
      }, 'Mostrar ToS (Producción)');
    }
  };

  const handleCreateCustomer = async () => {
    if (!bridgeProfile || !hasAcceptedTermsOfService) {
      Alert.alert('Error', 'Debe aceptar los términos primero');
      return;
    }

    await handleBridgeAction(async () => {
      console.log('🔄 Converting database profile to Bridge format for customer creation...');
      
      const convertedProfile = await kycService.convertDatabaseProfileToBridge(bridgeProfile);
      
      if (!convertedProfile) {
        throw new Error('No se pudo convertir el perfil para Bridge');
      }
      
      console.log('✅ Profile converted successfully for Bridge customer creation');
      return await createBridgeCustomer(convertedProfile, useBridgeStore.getState().signedAgreementId || '');
    }, 'Crear Customer');
  };

  const handleCreateWallet = async () => {
    if (!bridgeCustomerId) {
      Alert.alert('Error', 'Debe crear un customer primero');
      return;
    }

    await handleBridgeAction(async () => {
      return await createDefaultWallet();
    }, 'Crear Wallet');
  };

  const handleSyncStatus = async () => {
    if (!bridgeCustomerId) {
      Alert.alert('Error', 'No hay customer para sincronizar');
      return;
    }

    await handleBridgeAction(async () => {
      return await syncCustomerStatus();
    }, 'Sincronizar Estado');
  };

  const handleFullBridgeIntegration = async () => {
    if (!bridgeProfile) {
      Alert.alert('Error', 'No se encontraron datos de perfil para Bridge');
      return;
    }

    Alert.alert(
      'Integración Completa',
      `¿Desea ejecutar todo el proceso de integración Bridge automáticamente? (${isSandboxMode ? 'Sandbox' : 'Producción'})`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            await handleBridgeAction(async () => {
              return await initializeBridgeIntegration(bridgeProfile);
            }, 'Integración Bridge Completa');
          },
        },
      ]
    );
  };

  const handleResetBridge = () => {
    Alert.alert(
      'Resetear Bridge',
      '¿Está seguro de que desea resetear toda la integración Bridge?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: () => {
            resetBridgeIntegration();
            setBridgeProfile(null);
            Alert.alert('Éxito', 'Integración Bridge reseteada');
          },
        },
      ]
    );
  };

  const handleTestConnection = async () => {
    await handleBridgeAction(async () => {
      return await bridgeService.testConnection();
    }, 'Test Conexión');
  };

  const handleDebugInfo = async () => {
    console.log('🐛 ===== DEBUG INFO START =====');
    
    // Environment Info
    console.log('🔍 Environment Info:', environmentInfo);
    
    // Auth Store
    console.log('🔍 Auth Store Complete:', {
      isAuthenticated,
      user: user ? {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
      } : null,
      profile: profile ? {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        status: profile.status,
        role: profile.role,
      } : null,
    });

    // Bridge Store State
    console.log('🔍 Bridge Store State:', {
      bridgeCustomerId,
      bridgeVerificationStatus,
      hasAcceptedTermsOfService,
      isPendingTosAcceptance,
      tosUrl,
      wallets: wallets.length,
      isInitialized,
      integrationError,
      isLoading: bridgeLoading
    });

    // AsyncStorage Deep Dive
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔍 All AsyncStorage keys:', allKeys);
      
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`🔍 AsyncStorage[${key}]:`, value ? JSON.parse(value) : null);
      }
    } catch (storageError) {
      console.error('❌ Error reading AsyncStorage:', storageError);
    }

    // Direct Supabase Session Check
    const { data: currentSession } = await supabase.auth.getSession();
    console.log('🔍 Direct Supabase session:', {
      hasSession: !!currentSession?.session,
      userId: currentSession?.session?.user?.id,
      email: currentSession?.session?.user?.email,
      role: currentSession?.session?.user?.role,
      aud: currentSession?.session?.user?.aud,
    });

    // Test direct profile query with admin
    if (user?.id) {
      console.log('🔍 Testing direct admin query...');
      try {
        const { data: adminProfile, error: adminError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('userId', user.id)
          .single();
        
        console.log('🔍 Admin query result:', {
          success: !adminError,
          error: adminError,
          profile: adminProfile,
        });
      } catch (adminQueryError) {
        console.error('❌ Admin query error:', adminQueryError);
      }

      // Test regular profile query
      console.log('🔍 Testing regular client query...');
      try {
        const { data: regularProfile, error: regularError } = await supabase
          .from('profiles')
          .select('*')
          .eq('userId', user.id)
          .single();
        
        console.log('🔍 Regular query result:', {
          success: !regularError,
          error: regularError,
          profile: regularProfile,
        });
      } catch (regularQueryError) {
        console.error('❌ Regular query error:', regularQueryError);
      }
    }

    console.log('🐛 ===== DEBUG INFO END =====');
    Alert.alert('Debug', 'Información de debug enviada a consola. Revisa los logs.');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Pressable 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </Pressable>
          
          <ThemedText type="title" style={styles.title}>
            Bridge Debug Panel
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Panel de testing y depuración Bridge ({isSandboxMode ? 'Sandbox' : 'Producción'})
          </ThemedText>
        </View>

        {/* Environment Info */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Configuración del Entorno
          </ThemedText>
          
          {environmentInfo && (
            <View style={styles.environmentContainer}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Modo:</ThemedText>
                <ThemedText style={[styles.infoValue, { 
                  color: isSandboxMode ? '#FF9800' : '#4CAF50' 
                }]}>
                  {isSandboxMode ? 'Sandbox' : 'Producción'}
                </ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>API URL:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {environmentInfo.apiUrl || 'No configurado'}
                </ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>API Key:</ThemedText>
                <ThemedText style={[styles.infoValue, { 
                  color: environmentInfo.hasApiKey ? '#4CAF50' : '#FF6B6B' 
                }]}>
                  {environmentInfo.hasApiKey ? 'Configurado' : 'No configurado'}
                </ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>App URL:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {environmentInfo.appUrl || 'No configurado'}
                </ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>User ID:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {environmentInfo.userId?.substring(0, 8)}...
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Bridge Integration Status */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Estado Bridge
          </ThemedText>
          
          <BridgeProgressIndicator />
          
          {integrationError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
              <ThemedText style={styles.errorText}>{integrationError}</ThemedText>
              <Pressable onPress={clearError} style={styles.clearErrorButton}>
                <Ionicons name="close" size={16} color="#FF6B6B" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Bridge Actions */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Acciones Bridge
          </ThemedText>

          {/* Quick Integration */}
          <View style={styles.quickActionsContainer}>
            <ThemedButton
              title="🚀 Integración Completa"
              onPress={handleFullBridgeIntegration}
              disabled={isLoadingBridgeAction || bridgeLoading || !bridgeProfile}
              style={styles.primaryButton}
            />
            
            <ThemedButton
              title="🔄 Test Conexión"
              onPress={handleTestConnection}
              disabled={isLoadingBridgeAction}
              style={styles.secondaryButton}
            />
          </View>

          {/* Debug button */}
          <ThemedButton
            title="🐛 Debug Info"
            onPress={handleDebugInfo}
            disabled={isLoadingBridgeAction}
            style={styles.debugButton}
          />

          {/* Step by step actions */}
          <View style={styles.stepActionsContainer}>
            <ThemedText style={styles.stepTitle}>Acciones paso a paso:</ThemedText>
            
            <ThemedButton
              title={`1. ${hasAcceptedTermsOfService ? '✅' : '⏳'} ${isSandboxMode ? 'Generar/Aceptar ToS (Sandbox)' : 'Mostrar ToS (Producción)'}`}
              onPress={handleGenerateToS}
              disabled={isLoadingBridgeAction || hasAcceptedTermsOfService}
              style={hasAcceptedTermsOfService ? styles.completedButton : styles.pendingButton}
            />
            
            <ThemedButton
              title={`2. ${bridgeCustomerId ? '✅' : '⏳'} Crear Customer`}
              onPress={handleCreateCustomer}
              disabled={isLoadingBridgeAction || !hasAcceptedTermsOfService || !!bridgeCustomerId}
              style={bridgeCustomerId ? styles.completedButton : styles.pendingButton}
            />
            
            <ThemedButton
              title={`3. ${wallets.length > 0 ? '✅' : '⏳'} Crear Wallet`}
              onPress={handleCreateWallet}
              disabled={isLoadingBridgeAction || !bridgeCustomerId || wallets.length > 0}
              style={wallets.length > 0 ? styles.completedButton : styles.pendingButton}
            />
            
            <ThemedButton
              title="🔄 Sincronizar Estado"
              onPress={handleSyncStatus}
              disabled={isLoadingBridgeAction || !bridgeCustomerId}
              style={styles.syncButton}
            />
          </View>

          {/* Reset action */}
          <ThemedButton
            title="🗑️ Resetear Bridge"
            onPress={handleResetBridge}
            disabled={isLoadingBridgeAction}
            style={styles.dangerButton}
          />
        </View>

        {/* Bridge Info */}
        {(bridgeCustomerId || wallets.length > 0) && (
          <View style={styles.sectionContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Información Bridge
            </ThemedText>
            
            {bridgeCustomerId && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Customer ID:</ThemedText>
                <ThemedText style={styles.infoValue}>{bridgeCustomerId}</ThemedText>
              </View>
            )}
            
            {bridgeVerificationStatus && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Estado:</ThemedText>
                <ThemedText style={styles.infoValue}>{bridgeVerificationStatus}</ThemedText>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>ToS Aceptado:</ThemedText>
              <ThemedText style={[styles.infoValue, { 
                color: hasAcceptedTermsOfService ? '#4CAF50' : '#FF9800' 
              }]}>
                {hasAcceptedTermsOfService ? 'Sí' : 'No'}
              </ThemedText>
            </View>
            
            {wallets.length > 0 && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Wallets:</ThemedText>
                <ThemedText style={styles.infoValue}>{wallets.length} configuradas</ThemedText>
              </View>
            )}
          </View>
        )}
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
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: '#FF6B6B',
    fontSize: 14,
  },
  clearErrorButton: {
    padding: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stepActionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  completedButton: {
    backgroundColor: '#4CAF50',
    opacity: 0.7,
  },
  pendingButton: {
    backgroundColor: '#FF9800',
  },
  syncButton: {
    backgroundColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  debugButton: {
    backgroundColor: '#9C27B0',
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  infoLabel: {
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    flex: 2,
    textAlign: 'right',
    opacity: 0.8,
  },
  environmentContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
}); 