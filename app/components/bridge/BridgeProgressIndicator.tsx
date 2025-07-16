import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useBridgeStore } from '../../store';
import { ThemedText } from '../ThemedText';

interface BridgeProgressIndicatorProps {
  showOnlyWhenActive?: boolean;
  compact?: boolean;
}

export const BridgeProgressIndicator: React.FC<BridgeProgressIndicatorProps> = ({ 
  showOnlyWhenActive = false,
  compact = false 
}) => {
  const {
    bridgeCustomerId,
    bridgeVerificationStatus,
    hasAcceptedTermsOfService,
    wallets,
    integrationError,
    isLoading,
    isInitialized
  } = useBridgeStore();

  const tintColor = useThemeColor({}, 'tint');
  const successColor = '#4CAF50';
  const errorColor = '#FF6B6B';
  const warningColor = '#FF9800';

  // Don't show if not active and showOnlyWhenActive is true
  if (showOnlyWhenActive && !isInitialized && !isLoading) {
    return null;
  }

  const getStepStatus = (step: string) => {
    if (integrationError) {
      return { color: errorColor, icon: 'close-circle' as const };
    }

    switch (step) {
      case 'tos':
        if (hasAcceptedTermsOfService) {
          return { color: successColor, icon: 'checkmark-circle' as const };
        }
        return { color: isLoading ? tintColor : warningColor, icon: isLoading ? 'ellipse' : 'ellipse-outline' as const };

      case 'customer':
        if (bridgeCustomerId) {
          return { color: successColor, icon: 'checkmark-circle' as const };
        }
        if (hasAcceptedTermsOfService) {
          return { color: isLoading ? tintColor : warningColor, icon: isLoading ? 'ellipse' : 'ellipse-outline' as const };
        }
        return { color: warningColor, icon: 'ellipse-outline' as const };

      case 'verification':
        if (bridgeVerificationStatus === 'active') {
          return { color: successColor, icon: 'checkmark-circle' as const };
        }
        if (bridgeVerificationStatus === 'pending' || bridgeVerificationStatus === 'in_review') {
          return { color: warningColor, icon: 'time' as const };
        }
        if (bridgeCustomerId) {
          return { color: warningColor, icon: 'ellipse-outline' as const };
        }
        return { color: warningColor, icon: 'ellipse-outline' as const };

      case 'wallet':
        if (wallets.length > 0 && wallets.some(w => w.is_enabled)) {
          return { color: successColor, icon: 'checkmark-circle' as const };
        }
        if (bridgeCustomerId) {
          return { color: isLoading ? tintColor : warningColor, icon: isLoading ? 'ellipse' : 'ellipse-outline' as const };
        }
        return { color: warningColor, icon: 'ellipse-outline' as const };

      default:
        return { color: warningColor, icon: 'ellipse-outline' as const };
    }
  };

  if (compact) {
    const overallStatus = bridgeVerificationStatus === 'active' && wallets.length > 0 ? 'completed' :
                         isLoading ? 'loading' :
                         integrationError ? 'error' : 'pending';

    const statusConfig = {
      completed: { color: successColor, icon: 'checkmark-circle' as const, text: 'Bridge Activo' },
      loading: { color: tintColor, icon: 'hourglass' as const, text: 'Configurando Bridge...' },
      error: { color: errorColor, icon: 'alert-circle' as const, text: 'Error Bridge' },
      pending: { color: warningColor, icon: 'time' as const, text: 'Bridge Pendiente' }
    };

    const config = statusConfig[overallStatus];

    return (
      <View style={styles.compactContainer}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <ThemedText style={[styles.compactText, { color: config.color }]}>
          {config.text}
        </ThemedText>
      </View>
    );
  }

  const tosStatus = getStepStatus('tos');
  const customerStatus = getStepStatus('customer');
  const verificationStatus = getStepStatus('verification');
  const walletStatus = getStepStatus('wallet');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="link" size={18} color={tintColor} />
        <ThemedText style={styles.title}>Integración Bridge</ThemedText>
      </View>

      <View style={styles.stepsContainer}>
        {/* ToS Step */}
        <View style={styles.step}>
          <Ionicons name={tosStatus.icon as any} size={16} color={tosStatus.color} />
          <ThemedText style={styles.stepText}>Términos aceptados</ThemedText>
        </View>

        {/* Customer Step */}
        <View style={styles.step}>
          <Ionicons name={customerStatus.icon as any} size={16} color={customerStatus.color} />
          <ThemedText style={styles.stepText}>Cliente creado</ThemedText>
        </View>

        {/* Verification Step */}
        <View style={styles.step}>
          <Ionicons name={verificationStatus.icon as any} size={16} color={verificationStatus.color} />
          <ThemedText style={styles.stepText}>Verificación</ThemedText>
        </View>

        {/* Wallet Step */}
        <View style={styles.step}>
          <Ionicons name={walletStatus.icon as any} size={16} color={walletStatus.color} />
          <ThemedText style={styles.stepText}>Wallet configurada</ThemedText>
        </View>
      </View>

      {/* Status Message */}
      {integrationError && (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {integrationError}
        </ThemedText>
      )}

      {isLoading && (
        <ThemedText style={[styles.loadingText, { color: tintColor }]}>
          Configurando integración...
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  stepsContainer: {
    gap: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 13,
    marginLeft: 8,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 