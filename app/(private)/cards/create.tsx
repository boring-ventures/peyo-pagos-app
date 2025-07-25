import { CardCreation } from '@/app/components/cards';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateCardScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');

  const handleCardCreated = (cardId: string) => {
    // Navigate to the new card details and close the modal
    router.dismiss();
    router.push(`/(private)/cards/${cardId}` as any);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <CardCreation onCardCreated={handleCardCreated} style={styles.cardCreation} />
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardCreation: {
    alignSelf: 'center',
  },
}); 