import { BackButton } from '@/app/components/cards';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { moonService } from '@/app/services/moonService';
import { MoonCardProduct } from '@/app/types/Card';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CardTypeSelectionScreen() {
  const router = useRouter();
  const [cardProducts, setCardProducts] = useState<MoonCardProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MoonCardProduct | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const subtextColor = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');

  useEffect(() => {
    loadCardProducts();
  }, []);

  const loadCardProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await moonService.getCardProducts(10);

      if (response.success && response.data) {
        setCardProducts(response.data.card_products);
        console.log('✅ Loaded card products:', response.data.card_products.length);
      } else {
        const errorMsg = response.error || 'Error cargando tipos de tarjetas';
        setError(errorMsg);
        console.error('❌ Failed to load card products:', errorMsg);
      }
    } catch (error) {
      console.error('💥 Unexpected error loading card products:', error);
      setError('Error inesperado cargando tipos de tarjetas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSelectProduct = (product: MoonCardProduct) => {
    setSelectedProduct(product);
  };

  const handleContinue = () => {
    if (!selectedProduct) {
      Alert.alert('Selección requerida', 'Por favor selecciona un tipo de tarjeta');
      return;
    }

    // Navigate to card creation with the selected product ID
    router.push({
      pathname: '/(private)/cards/create',
      params: { cardProductId: selectedProduct.id, cardProductName: selectedProduct.name }
    } as any);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderCardProduct = ({ item }: { item: MoonCardProduct }) => {
    const isSelected = selectedProduct?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          {
            backgroundColor: cardBackground,
            borderColor: isSelected ? tintColor : borderColor,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleSelectProduct(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productHeader}>
          <View style={styles.productTitleContainer}>
            <ThemedText style={[styles.productName, { color: textColor }]}>
              {item.name}
            </ThemedText>
            {isSelected && (
              <View style={[styles.selectedBadge, { backgroundColor: tintColor }]}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: subtextColor }]}>
              Límite mínimo:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {formatCurrency(item.minimum_value)}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: subtextColor }]}>
              Límite máximo:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {formatCurrency(item.maximum_value)}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: subtextColor }]}>
              Comisión:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {formatCurrency(item.fee_amount)} ({item.fee_type})
            </ThemedText>
          </View>

          {item.categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              <ThemedText style={[styles.detailLabel, { color: subtextColor }]}>
                Categorías:
              </ThemedText>
              <View style={styles.categoriesRow}>
                {item.categories.map((category, index) => (
                  <View
                    key={index}
                    style={[styles.categoryBadge, { backgroundColor: `${tintColor}20` }]}
                  >
                    <ThemedText style={[styles.categoryText, { color: tintColor }]}>
                      {category}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <BackButton title="Volver" onPress={handleGoBack} style={styles.backButton} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={[styles.loadingText, { color: textColor }]}>
              Cargando tipos de tarjetas...
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <BackButton title="Volver" onPress={handleGoBack} style={styles.backButton} />
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={errorColor} />
            <ThemedText style={[styles.errorTitle, { color: errorColor }]}>
              Error
            </ThemedText>
            <ThemedText style={[styles.errorMessage, { color: subtextColor }]}>
              {error}
            </ThemedText>
            <ThemedButton
              title="Intentar de nuevo"
              type="secondary"
              onPress={loadCardProducts}
              style={styles.retryButton}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        <BackButton title="Volver" onPress={handleGoBack} style={styles.backButton} />
        
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: textColor }]}>
            Selecciona tu tipo de tarjeta
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: subtextColor }]}>
            Elige el producto que mejor se adapte a tus necesidades
          </ThemedText>
        </View>

        <FlatList
          data={cardProducts}
          renderItem={renderCardProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        <View style={styles.bottomContainer}>
          <ThemedButton
            title="Continuar"
            type="primary"
            onPress={handleContinue}
            disabled={!selectedProduct}
            style={styles.continueButton}
          />
        </View>
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
    marginHorizontal: 20,
    marginTop: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  separator: {
    height: 16,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
  },
  productHeader: {
    marginBottom: 12,
  },
  productTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  productDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    gap: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  continueButton: {
    width: '100%',
  },
}); 