import { useThemeColor } from '@/app/hooks/useThemeColor';
import { moonService } from '@/app/services/moonService';
import { useAuthStore } from '@/app/store/authStore';
import { useCardStore } from '@/app/store/cardStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [moonBalance, setMoonBalance] = useState<number | null>(null);
  
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const subtextColor = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');

  // Use the provided cardProductId or fallback to default
  const productId = cardProductId || process.env.EXPO_PUBLIC_MOON_CARD_PRODUCT_ID || 'default-card-product';

  // Check Moon Reserve balance on component mount
  useEffect(() => {
    const checkMoonBalance = async () => {
      try {
        console.log('🌙 Auto-checking Moon Reserve balance...');
        const balanceResult = await moonService.getMoonReserveBalance();
        
        if (balanceResult.success && balanceResult.data) {
          setMoonBalance(balanceResult.data.balance);
          console.log('✅ Auto-check Moon Reserve balance:', balanceResult.data.balance);
        } else {
          console.warn('⚠️ Auto-check Moon Reserve balance failed:', balanceResult.error);
        }
      } catch (error) {
        console.error('❌ Auto-check Moon Reserve balance error:', error);
      }
    };

    checkMoonBalance();
  }, []);

  const handleCreateCard = async () => {
    if (!user || !profile) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario');
      return;
    }

    try {
      console.log('🔄 Starting card creation process with Moon Reserve verification...');
      console.log('👤 User ID:', user.id);
      console.log('📋 Profile:', profile);
      console.log('💳 Product ID:', productId);
      
      // Step 1: Check Moon Reserve balance
      setIsCheckingBalance(true);
      console.log('🌙 Checking Moon Reserve balance...');
      
      const balanceResult = await moonService.getMoonReserveBalance();
      
      if (!balanceResult.success || !balanceResult.data) {
        console.error('❌ Failed to get Moon Reserve balance:', balanceResult.error);
        Alert.alert('Error', 'No se pudo verificar el balance de Moon Reserve');
        return;
      }

      const balance = balanceResult.data.balance;
      setMoonBalance(balance);
      console.log('✅ Moon Reserve balance:', balance);
      
      // Check if there's sufficient balance (you can adjust this threshold)
      const minimumBalance = 1.0; // Minimum $1.00 required
      if (balance < minimumBalance) {
        Alert.alert(
          'Balance Insuficiente',
          `El balance de Moon Reserve ($${balance.toFixed(2)}) es insuficiente para crear una tarjeta. Se requiere un mínimo de $${minimumBalance.toFixed(2)}.`
        );
        return;
      }

      setIsCheckingBalance(false);
      
      // Step 2: Get profile ID for card creation
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

      console.log('🚀 Calling createCard with:', { profileId, productId, userId: user.id });
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Card creation took too long')), 30000);
      });
      
      const createCardPromise = createCard(profileId, productId, user.id);
      const result = await Promise.race([createCardPromise, timeoutPromise]) as any;
      
      console.log('📊 Create card result:', result);
      
      if (result.success && result.card) {
        console.log('✅ Card created successfully:', result.card.id);
        Alert.alert(
          '¡Tarjeta creada!',
          `Tu tarjeta de débito virtual ha sido creada exitosamente.\n\nBalance de Moon Reserve: $${balance.toFixed(2)}`,
          [
            {
              text: 'Ver tarjeta',
              onPress: () => onCardCreated?.(result.card!.id),
            },
          ]
        );
      } else {
        console.error('❌ Card creation failed:', result.error);
        Alert.alert(
          'Error',
          result.error || 'No se pudo crear la tarjeta. Inténtalo de nuevo.'
        );
      }
    } catch (error) {
      setIsCheckingBalance(false);
      console.error('💥 Unexpected error in handleCreateCard:', error);
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack available');
      
      // Check if it's a timeout error
      if (error instanceof Error && error.message.includes('Timeout')) {
        Alert.alert('Error', 'La creación de la tarjeta tardó demasiado. Inténtalo de nuevo.');
      } else {
        Alert.alert('Error', 'Error inesperado al crear la tarjeta');
      }
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
            ? `Crea tu ${cardProductName.toLowerCase()} usando el balance de Moon Reserve para hacer compras en línea y retirar efectivo en cajeros automáticos.`
            : 'Crea tu tarjeta de débito virtual usando el balance de Moon Reserve para hacer compras en línea y retirar efectivo en cajeros automáticos.'
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

          <View style={styles.featureItem}>
            <Ionicons name="moon" size={16} color={tintColor} />
            <ThemedText style={[styles.featureText, { color: textColor }]}>
              Fondos desde Moon Reserve
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

        {/* Moon Reserve Balance Display */}
        {moonBalance !== null && (
          <View style={[styles.balanceContainer, { backgroundColor: `${tintColor}20` }]}>
            <Ionicons name="wallet" size={16} color={tintColor} />
            <ThemedText style={[styles.balanceText, { color: tintColor }]}>
              Balance Moon Reserve: ${moonBalance.toFixed(2)}
            </ThemedText>
          </View>
        )}

        <ThemedButton
          title={
            isCheckingBalance 
              ? "Verificando balance..." 
              : isCreatingCard 
                ? "Creando tarjeta..." 
                : "Crear tarjeta"
          }
          type="primary"
          loading={isCheckingBalance || isCreatingCard}
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
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'stretch',
    marginTop: 16,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 