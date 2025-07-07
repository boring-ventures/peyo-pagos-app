import DocumentCamera from '@/app/components/kyc/DocumentCamera';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useKycStore } from '@/app/store';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function SelfieCaptureScreen() {
  const router = useRouter();
  const { uploadDocument } = useKycStore();

  const handlePictureTaken = (base64: string) => {
    uploadDocument({ type: 'selfie', file: base64 });
    router.push('./document-review');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Selfie</ThemedText>
      <ThemedText style={styles.subtitle}>
        Centra tu rostro en el óvalo y asegúrate de que haya buena iluminación.
      </ThemedText>
      <View style={styles.cameraContainer}>
        <DocumentCamera onPictureTaken={handlePictureTaken} overlayType="face" />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
}); 