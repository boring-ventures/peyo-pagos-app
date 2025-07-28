import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useAuthStore } from '@/app/store/authStore';
import { useCardStore } from '@/app/store/cardStore';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    View,
} from 'react-native';
import { ThemedButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';

interface CardCreationProps {
  onCardCreated?: (cardId: string) => void;
  style?: any;
  cardProductId?: string;
  cardProductName?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = CARD_WIDTH * 0.63;

export function CardCreation({ onCardCreated, style, cardProductId, cardProductName }: CardCreationProps) {
  const { user, profile } = useAuthStore();
  const { createCard, isCreatingCard, createCardError, clearCreateCardError } = useCardStore();
  
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const subtextColor = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');

  // Use the provided cardProductId or fallback to default
  const productId = cardProductId || process.env.EXPO_PUBLIC_MOON_CARD_PRODUCT_ID || 'default-card-product';

  const handleCreateCard = async () => {
    if (!user || !profile) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario');
      return;
    }

    // Get the actual profile.id from profiles table (same pattern as in authStore)
    try {
      const { supabaseAdmin } = await import('@/app/services/supabaseAdmin');
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Failed to get profile for creating card:', profileError);
        Alert.alert('Error', 'No se pudo obtener el perfil del usuario');
        return;
      }

      const profileId = profileData.id;
      console.log('✅ Using profile.id for card creation:', profileId);

      clearCreateCardError();

      const result = await createCard(profileId, productId);
      
      if (result.success && result.card) {
        Alert.alert(
          '¡Tarjeta creada!',
          'Tu tarjeta de débito virtual ha sido creada exitosamente.',
          [
            {
              text: 'Ver tarjeta',
              onPress: () => onCardCreated?.(result.card!.id),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'No se pudo crear la tarjeta. Inténtalo de nuevo.'
        );
      }
    } catch (error) {
      console.error('❌ Error in handleCreateCard:', error);
      Alert.alert('Error', 'Error inesperado al crear la tarjeta');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor }, style]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${tintColor}20` }]}>
          <Ionicons name="card-outline" size={40} color={tintColor} />
        </View>
        
        <ThemedText style={[styles.title, { color: textColor }]}>
          {cardProductName ? `Crear ${cardProductName}` : 'Crear tarjeta de débito'}
        </ThemedText>
        
        <ThemedText style={[styles.description, { color: subtextColor }]}>
          {cardProductName 
            ? `Crea tu ${cardProductName.toLowerCase()} para hacer compras en línea y retirar efectivo en cajeros automáticos.`
            : 'Crea tu tarjeta de débito virtual para hacer compras en línea y retirar efectivo en cajeros automáticos.'
          }
        </ThemedText>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={tintColor} />
            <ThemedText style={[styles.featureText, { color: textColor }]}>
              Compras en línea seguras
            </ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={tintColor} />
            <ThemedText style={[styles.featureText, { color: textColor }]}>
              Retiros en cajeros ATM
            </ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={tintColor} />
            <ThemedText style={[styles.featureText, { color: textColor }]}>
              Control total desde la app
            </ThemedText>
          </View>
        </View>

        {createCardError && (
          <View style={[styles.errorContainer, { backgroundColor: `${errorColor}20` }]}>
            <Ionicons name="alert-circle" size={16} color={errorColor} />
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {createCardError}
            </ThemedText>
          </View>
        )}

        <ThemedButton
          title={isCreatingCard ? "Creando tarjeta..." : "Crear tarjeta"}
          type="primary"
          loading={isCreatingCard}
          onPress={handleCreateCard}
          style={styles.createButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignSelf: 'center',
    marginVertical: 8,
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  features: {
    alignSelf: 'stretch',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  createButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
}); 