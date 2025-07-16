import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';
import { kycService } from '../../services/kycService';
import { useBridgeStore } from '../../store';
import { ThemedButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface BridgeIntegrationCardProps {
  onViewWallets?: () => void;
}

export const BridgeIntegrationCard: React.FC<BridgeIntegrationCardProps> = ({ onViewWallets }) => {
  const {
    bridgeCustomerId,
    bridgeVerificationStatus,
    hasAcceptedTermsOfService,
    wallets,
    integrationError,
    isLoading,
    isInitialized,
    syncCustomerStatus,
    retryFailedOperation,
    clearError
  } = useBridgeStore();

  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({ light: '#FFFFFF', dark: '#1A2B42' }, 'background');
  const errorColor = '#FF6B6B';
  const successColor = '#4CAF50';
  const warningColor = '#FF9800';

  // Determine status and colors
  const getStatusInfo = () => {
    if (isLoading) {
      return {
        status: 'Configurando...',
        color: tintColor,
        icon: 'hourglass-outline' as const,
        description: 'Iniciando integración con Bridge'
      };
    }

    if (integrationError) {
      return {
        status: 'Error',
        color: errorColor,
        icon: 'alert-circle-outline' as const,
        description: integrationError
      };
    }

    if (!isInitialized || !bridgeCustomerId) {
      return {
        status: 'No configurado',
        color: warningColor,
        icon: 'ellipse-outline' as const,
        description: 'Bridge no ha sido configurado'
      };
    }

    if (!hasAcceptedTermsOfService) {
      return {
        status: 'Pendiente ToS',
        color: warningColor,
        icon: 'document-text-outline' as const,
        description: 'Términos de servicio pendientes'
      };
    }

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
    }
  };

  const handleRetryIntegration = async () => {
    clearError();
    
    const result = await retryFailedOperation(async () => {
      return kycService.retryBridgeIntegration();
    });

    if (!result.success) {
      Alert.alert('Error de Integración', result.error || 'No se pudo reintentar la integración');
    }
  };

  const handleViewWallets = () => {
    if (onViewWallets) {
      onViewWallets();
    } else {
      // Default navigation or modal
      Alert.alert('Wallets Bridge', `Tienes ${wallets.length} wallet(s) configurada(s)`);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: cardBackground }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="wallet-outline" size={24} color={tintColor} />
          <ThemedText type="subtitle" style={styles.title}>
            Bridge Wallet
          </ThemedText>
        </View>
        
        {bridgeCustomerId && (
          <ThemedButton
            title="Sync"
            type="outline"
            size="small"
            onPress={handleSyncStatus}
            disabled={isLoading}
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

      {/* Customer ID */}
      {bridgeCustomerId && (
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Customer ID:</ThemedText>
          <ThemedText style={styles.infoValue}>
            {bridgeCustomerId.substring(0, 8)}...
          </ThemedText>
        </View>
      )}

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
        {integrationError && (
          <ThemedButton
            title="Reintentar"
            type="primary"
            onPress={handleRetryIntegration}
            disabled={isLoading}
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

        {!isInitialized && !isLoading && (
          <ThemedButton
            title="Configurar Bridge"
            type="primary"
            onPress={handleRetryIntegration}
            style={styles.actionButton}
          />
        )}
      </View>
    </ThemedView>
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