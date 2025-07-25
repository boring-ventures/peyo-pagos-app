import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    View,
} from 'react-native';
import { ThemedText } from '../ThemedText';

interface CardLoadingProps {
  message?: string;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = CARD_WIDTH * 0.63;

export function CardLoading({ message = 'Cargando tarjeta...', style }: CardLoadingProps) {
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'textSecondary');

  return (
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor }, style]}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={[styles.loadingText, { color: textColor }]}>
          {message}
        </ThemedText>
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
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 8,
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 