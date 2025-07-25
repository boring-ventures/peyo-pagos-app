import { BackButton, CardDisplay, CardError, CardLoading } from '@/app/components/cards';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useCardStore } from '@/app/store/cardStore';
import { Card } from '@/app/types/Card';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CardDetailsScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    getCardById,
    toggleCardFreeze,
    isLoading,
    clearError,
  } = useCardStore();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const subtextColor = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const loadCardDetails = useCallback(async () => {
    if (!cardId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const card = await getCardById(cardId);
      if (card) {
        setCurrentCard(card);
      } else {
        setError('No se pudo encontrar la tarjeta');
      }
    } catch (err) {
      setError('Error cargando detalles de la tarjeta');
    } finally {
      setLoading(false);
    }
  }, [cardId, getCardById]);

  useFocusEffect(
    useCallback(() => {
      loadCardDetails();
    }, [loadCardDetails])
  );

  const handleToggleFreeze = async () => {
    if (!currentCard) return;

    const action = currentCard.frozen ? 'descongelar' : 'congelar';
    const actionTitle = currentCard.frozen ? 'Descongelar' : 'Congelar';

    Alert.alert(
      `${actionTitle} tarjeta`,
      `¿Estás seguro de que quieres ${action} esta tarjeta?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: actionTitle,
          style: currentCard.frozen ? 'default' : 'destructive',
          onPress: async () => {
            const success = await toggleCardFreeze(currentCard.id, !currentCard.frozen);
            if (success) {
              setCurrentCard(prev => 
                prev ? { ...prev, frozen: !prev.frozen } : null
              );
              Alert.alert(
                'Éxito',
                `Tarjeta ${currentCard.frozen ? 'descongelada' : 'congelada'} exitosamente`
              );
            } else {
              Alert.alert('Error', 'No se pudo actualizar el estado de la tarjeta');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <BackButton style={styles.backButton} />
          <View style={styles.loadingContainer}>
            <CardLoading message="Cargando detalles de la tarjeta..." />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error || !currentCard) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <BackButton style={styles.backButton} />
          <View style={styles.errorContainer}>
            <CardError 
              error={error || 'Tarjeta no encontrada'} 
              onRetry={() => {
                clearError();
                loadCardDetails();
              }} 
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadCardDetails}
              tintColor={tintColor}
            />
          }
        >
          {/* Back Button */}
          <BackButton style={styles.backButton} />

          {/* Card Display */}
          <CardDisplay
            card={currentCard}
            showFullPan={false}
            style={styles.cardDisplay}
          />

          {/* Card Actions */}
          <View style={styles.actionsSection}>
            <ThemedButton
              title={currentCard.frozen ? "Descongelar tarjeta" : "Congelar tarjeta"}
              type={currentCard.frozen ? "primary" : "outline"}
              onPress={handleToggleFreeze}
              loading={isLoading}
              style={styles.actionButton}
            />
          </View>

          {/* Card Information */}
          <View style={styles.infoSection}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Información de la tarjeta
            </ThemedText>

            <View style={[styles.infoCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons name="card-outline" size={20} color={tintColor} />
                  <ThemedText style={[styles.infoLabel, { color: subtextColor }]}>
                    Número de tarjeta
                  </ThemedText>
                </View>
                <ThemedText style={[styles.infoValue, { color: textColor }]}>
                  •••• •••• •••• {currentCard.pan.slice(-4)}
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons name="calendar-outline" size={20} color={tintColor} />
                  <ThemedText style={[styles.infoLabel, { color: subtextColor }]}>
                    Válida hasta
                  </ThemedText>
                </View>
                <ThemedText style={[styles.infoValue, { color: textColor }]}>
                  {currentCard.display_expiration}
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons 
                    name={currentCard.frozen ? "snow-outline" : "flame-outline"} 
                    size={20} 
                    color={currentCard.frozen ? '#6B7280' : tintColor} 
                  />
                  <ThemedText style={[styles.infoLabel, { color: subtextColor }]}>
                    Estado
                  </ThemedText>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot, 
                    { backgroundColor: currentCard.frozen ? '#6B7280' : '#10B981' }
                  ]} />
                  <ThemedText style={[styles.infoValue, { color: textColor }]}>
                    {currentCard.frozen ? 'Congelada' : 'Activa'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons name="time-outline" size={20} color={tintColor} />
                  <ThemedText style={[styles.infoLabel, { color: subtextColor }]}>
                    Creada
                  </ThemedText>
                </View>
                <ThemedText style={[styles.infoValue, { color: textColor }]}>
                  {formatDate(currentCard.createdAt)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Balance Information */}
          <View style={styles.balanceSection}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              Balance
            </ThemedText>

            <View style={[styles.infoCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons name="wallet-outline" size={20} color={tintColor} />
                  <ThemedText style={[styles.infoLabel, { color: subtextColor }]}>
                    Balance total
                  </ThemedText>
                </View>
                <ThemedText style={[styles.balanceValue, { color: textColor }]}>
                  ${currentCard.balance.toFixed(2)}
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons name="cash-outline" size={20} color={tintColor} />
                  <ThemedText style={[styles.infoLabel, { color: subtextColor }]}>
                    Balance disponible
                  </ThemedText>
                </View>
                <ThemedText style={[styles.balanceValue, { color: textColor }]}>
                  ${currentCard.available_balance.toFixed(2)}
                </ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardDisplay: {
    marginBottom: 24,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionButton: {
    alignSelf: 'stretch',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  balanceSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 