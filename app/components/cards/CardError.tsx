import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    View
} from 'react-native';
import { ThemedButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';

interface CardErrorProps {
  error: string;
  onRetry?: () => void;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = CARD_WIDTH * 0.63;

export function CardError({ error, onRetry, style }: CardErrorProps) {
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'error');
  const errorColor = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor }, style]}>
      <View style={styles.errorContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${errorColor}20` }]}>
          <Ionicons name="alert-circle-outline" size={32} color={errorColor} />
        </View>
        
        <ThemedText style={[styles.errorTitle, { color: textColor }]}>
          Error cargando tarjeta
        </ThemedText>
        
        <ThemedText style={[styles.errorMessage, { color: textColor }]}>
          {error}
        </ThemedText>
        
        {onRetry && (
          <ThemedButton
            title="Reintentar"
            type="outline"
            size="small"
            onPress={onRetry}
            style={styles.retryButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 8,
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  retryButton: {
    minWidth: 120,
  },
}); 