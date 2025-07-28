import { BackButton, CardCreation } from '@/app/components/cards';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateCardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    cardProductId: string;
    cardProductName: string;
  }>();
  
  const backgroundColor = useThemeColor({}, 'background');

  const handleCardCreated = (cardId: string) => {
    // Navigate to the new card details and close the modal
    router.dismiss();
    router.push(`/(private)/cards/${cardId}` as any);
  };

  const handleGoBack = () => {
    router.dismiss(); // Use dismiss for modal navigation
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <BackButton 
          title="Cancelar" 
          onPress={handleGoBack}
          style={styles.backButton}
        />
        <CardCreation 
          onCardCreated={handleCardCreated} 
          style={styles.cardCreation}
          cardProductId={params.cardProductId}
          cardProductName={params.cardProductName}
        />
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
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 8,
  },
  cardCreation: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
}); 