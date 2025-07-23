import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useBridgeToS } from '../../hooks/useBridgeToS';
import { useThemeColor } from '../../hooks/useThemeColor';
import { kycService } from '../../services/kycService';
import { useBridgeStore } from '../../store';
import { ThemedButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { BridgeToSWebView } from './BridgeToSWebView';

interface BridgeIntegrationCardProps {
  onViewWallets?: () => void;
}

export const BridgeIntegrationCard: React.FC<BridgeIntegrationCardProps> = ({ onViewWallets }) => {
  const [showToSWebView, setShowToSWebView] = useState(false);
  const [tosUrl, setTosUrl] = useState<string>('');

  const {
    bridgeCustomerId,
    bridgeVerificationStatus,
    wallets,
    integrationError,
    isLoading,
    isInitialized,
    syncCustomerStatus,
    retryFailedOperation,
    clearError
  } = useBridgeStore();

  // Use the new ToS hook
  const {
    isLoading: tosLoading,
    error: tosError,
    hasAcceptedTermsOfService,
    isPendingTosAcceptance,
    isToSReady,
    startToSFlow,
    clearError: clearToSError,
    retryAttempt,
    isRetrying,
    retryToSFlow,
    cancelToSFlow
  } = useBridgeToS();

  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({ light: '#FFFFFF', dark: '#1A2B42' }, 'background');
  const errorColor = '#FF6B6B';
  const successColor = '#4CAF50';
  const warningColor = '#FF9800';

  // Check if we're in sandbox mode
  const isSandboxMode = process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true';

  // Determine status and colors based on Bridge API documentation
  const getStatusInfo = () => {
    if (isLoading || tosLoading || isRetrying) {
      return {
        status: 'Configurando...',
        color: tintColor,
        icon: 'hourglass-outline' as const,
        description: isRetrying ? `Reintentando integración... (Intento ${retryAttempt + 1})` : 'Iniciando integración con Bridge'
      };
    }

    if (integrationError || tosError) {
      return {
        status: 'Error',
        color: errorColor,
        icon: 'alert-circle-outline' as const,
        description: integrationError || tosError || 'Error en la integración'
      };
    }

    if (!isInitialized || !bridgeCustomerId) {
      return {
        status: 'No configurado',
        color: warningColor,
        icon: 'ellipse-outline' as const,
        description: isSandboxMode 
          ? 'Bridge no ha sido configurado (Sandbox)' 
          : 'Bridge no ha sido configurado'
      };
    }

    if (!hasAcceptedTermsOfService) {
      return {
        status: 'Pendiente ToS',
        color: warningColor,
        icon: 'document-text-outline' as const,
        description: isSandboxMode 
          ? 'Términos de servicio pendientes (Sandbox)' 
          : 'Términos de servicio pendientes'
      };
    }

    // Based on Bridge API documentation: kyc_status and endorsement status
    switch (bridgeVerificationStatus) {
      case 'active':
        return {
          status: 'Activo',
          color: successColor,
          icon: 'checkmark-circle-outline' as const,
          description: 'Bridge configurado y verificado'
        };
      case 'pending':
        return {
          status: 'Pendiente',
          color: warningColor,
          icon: 'time-outline' as const,
          description: 'Verificación en proceso'
        };
      case 'in_review':
        return {
          status: 'En revisión',
          color: warningColor,
          icon: 'eye-outline' as const,
          description: 'Documentos bajo revisión'
        };
      case 'rejected':
        return {
          status: 'Rechazado',
          color: errorColor,
          icon: 'close-circle-outline' as const,
          description: 'Verificación rechazada'
        };
      case null:
        return {
          status: 'No iniciado',
          color: warningColor,
          icon: 'ellipse-outline' as const,
          description: 'KYC no iniciado'
        };
      default:
        return {
          status: 'Desconocido',
          color: warningColor,
          icon: 'help-circle-outline' as const,
          description: 'Estado no disponible'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleSyncStatus = async () => {
    const result = await syncCustomerStatus();
    if (!result.success) {
      Alert.alert('Error de Sincronización', result.error || 'No se pudo sincronizar');
    } else {
      Alert.alert('Éxito', 'Estado sincronizado correctamente');
    }
  };

  const handleRetryIntegration = async () => {
    clearError();
    clearToSError();
    
    const result = await retryFailedOperation(async () => {
      return kycService.forceRetryBridgeIntegration();
    });

    if (!result.success) {
      Alert.alert('Error de Integración', result.error || 'No se pudo reintentar la integración');
    }
  };

  const handleShowToS = async () => {
    if (isSandboxMode) {
      Alert.alert('Sandbox Mode', 'ToS se maneja automáticamente en modo sandbox');
      return;
    }

    try {
      console.log('🔐 Starting manual ToS flow from BridgeIntegrationCard...');
      
      // Get ToS URL from store
      const result = await useBridgeStore.getState().showToSForUser();
      
      if (result.success && result.url) {
        console.log('✅ ToS URL ready for manual flow:', result.url);
        setTosUrl(result.url);
        setShowToSWebView(true);
      } else {
        Alert.alert('Error', result.error || 'No se pudo mostrar los términos de servicio');
      }
    } catch (error) {
      console.error('💥 Error in manual ToS flow:', error);
      Alert.alert('Error', 'Error al mostrar términos de servicio');
    }
  };

  // ToS WebView handlers
  const handleTosAccept = async (signedAgreementId: string) => {
    console.log('🔐 ToS accepted manually, agreement ID:', signedAgreementId);
    setShowToSWebView(false);
    
    try {
      // Handle the ToS acceptance in store
      const result = await useBridgeStore.getState().handleTosAcceptance(signedAgreementId);
      
      if (result.success) {
        Alert.alert('Éxito', 'Términos de servicio aceptados correctamente');
      } else {
        Alert.alert('Error', result.error || 'Error al procesar la aceptación');
      }
    } catch (error) {
      console.error('💥 Error handling manual ToS acceptance:', error);
      Alert.alert('Error', 'Error al procesar la aceptación de términos');
    }
  };

  const handleTosCancel = () => {
    console.log('❌ Manual ToS flow cancelled');
    setShowToSWebView(false);
    Alert.alert('Cancelado', 'Proceso de términos de servicio cancelado');
  };

  const handleTosError = (error: string) => {
    console.error('❌ Manual ToS flow error:', error);
    setShowToSWebView(false);
    Alert.alert('Error', 'Error en el proceso de términos de servicio: ' + error);
  };

  const handleViewWallets = () => {
    if (onViewWallets) {
      onViewWallets();
    } else {
      // Default navigation or modal
      Alert.alert('Wallets Bridge', `Tienes ${wallets.length} wallet(s) configurada(s)`);
    }
  };

  // Feedback visual para ToS y Bridge
  const renderProgressFeedback = () => {
    if (isLoading || tosLoading || isRetrying) {
      return (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Ionicons name="hourglass-outline" size={32} color={tintColor} />
          <ThemedText style={{ marginTop: 8, color: tintColor }}>
            {isRetrying ? `Reintentando integración... (Intento ${retryAttempt + 1})` : 'Procesando integración con Bridge...'}
          </ThemedText>
        </View>
      );
    }
    if (integrationError || tosError) {
      return (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Ionicons name="alert-circle-outline" size={32} color={errorColor} />
          <ThemedText style={{ marginTop: 8, color: errorColor }}>
            {integrationError || tosError}
          </ThemedText>
          <ThemedButton
            title="Reintentar"
            type="primary"
            onPress={handleRetryIntegration}
            style={{ marginTop: 8 }}
          />
        </View>
      );
    }
    if (isPendingTosAcceptance) {
      return (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Ionicons name="document-text-outline" size={32} color={warningColor} />
          <ThemedText style={{ marginTop: 8, color: warningColor }}>
            Esperando que aceptes los términos de servicio en el navegador...
          </ThemedText>
          <ThemedButton
            title="Cancelar ToS"
            type="outline"
            onPress={cancelToSFlow}
            style={{ marginTop: 8 }}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: cardBackground }]}> 
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="wallet-outline" size={24} color={tintColor} />
            <ThemedText type="subtitle" style={styles.title}>
              Bridge Wallet {isSandboxMode && '(Sandbox)'}
            </ThemedText>
          </View>
          
          {bridgeCustomerId && (
            <ThemedButton
              title="Sync"
              type="outline"
              size="small"
              onPress={handleSyncStatus}
              disabled={isLoading || tosLoading || isRetrying}
              style={styles.syncButton}
            />
          )}
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
          <ThemedText style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.status}
          </ThemedText>
        </View>

        <ThemedText style={styles.description}>
          {statusInfo.description}
        </ThemedText>

        {/* Feedback visual de progreso y errores */}
        {renderProgressFeedback()}

        {/* Customer ID */}
        {bridgeCustomerId && (
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Customer ID:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {bridgeCustomerId.substring(0, 8)}...
            </ThemedText>
          </View>
        )}

        {/* ToS Status */}
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Términos de Servicio:</ThemedText>
          <ThemedText style={[styles.infoValue, { 
            color: hasAcceptedTermsOfService ? successColor : warningColor 
          }]}> 
            {hasAcceptedTermsOfService ? 'Aceptados' : 'Pendientes'}
          </ThemedText>
        </View>

        {/* Wallets Info */}
        {wallets.length > 0 && (
          <View style={styles.walletsContainer}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Wallets:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {wallets.length} configurada(s)
              </ThemedText>
            </View>

            {/* Show first wallet as preview */}
            {wallets[0] && (
              <View style={styles.walletPreview}>
                <ThemedText style={styles.walletCurrency}>
                  {wallets[0].currency.toUpperCase()}
                </ThemedText>
                <ThemedText style={styles.walletAddress}>
                  {wallets[0].address.substring(0, 10)}...
                </ThemedText>
                <ThemedText style={[
                  styles.walletStatus,
                  { color: wallets[0].is_enabled ? successColor : warningColor }
                ]}>
                  {wallets[0].is_enabled ? 'Activa' : 'Inactiva'}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {(integrationError || tosError) && (
            <ThemedButton
              title="Reintentar"
              type="primary"
              onPress={handleRetryIntegration}
              disabled={isLoading || tosLoading || isRetrying}
              style={styles.actionButton}
            />
          )}

          {isToSReady && !isSandboxMode && !hasAcceptedTermsOfService && (
            <ThemedButton
              title="Aceptar ToS"
              type="primary"
              onPress={handleShowToS}
              disabled={isLoading || tosLoading || isRetrying}
              style={styles.actionButton}
            />
          )}

          {wallets.length > 0 && (
            <ThemedButton
              title="Ver Wallets"
              type="outline"
              onPress={handleViewWallets}
              style={styles.actionButton}
            />
          )}

          {!isInitialized && !isLoading && !tosLoading && !isRetrying && (
            <ThemedButton
              title="Configurar Bridge"
              type="primary"
              onPress={handleRetryIntegration}
              style={styles.actionButton}
            />
          )}
        </View>
      </ThemedView>

      {/* Bridge ToS WebView for Manual Flow */}
      {showToSWebView && tosUrl && (
        <BridgeToSWebView
          visible={showToSWebView}
          tosUrl={tosUrl}
          onAccept={handleTosAccept}
          onClose={handleTosCancel}
          onError={handleTosError}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontWeight: '600',
  },
  syncButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  walletsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  walletPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  walletCurrency: {
    fontSize: 14,
    fontWeight: '600',
  },
  walletAddress: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  walletStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
}); 