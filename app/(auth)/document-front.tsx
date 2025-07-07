import DocumentCamera from '@/app/components/kyc/DocumentCamera';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useKycStore } from '@/app/store';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function DocumentFrontScreen() {
  const router = useRouter();
  const { uploadDocument } = useKycStore();

  const handlePictureTaken = (base64: string) => {
    uploadDocument({ type: 'idFront', file: base64 });
    router.push('./document-back');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Documento (Frente)</ThemedText>
      <ThemedText style={styles.subtitle}>
        Asegúrate de que la imagen esté clara y todos los datos sean legibles.
      </ThemedText>
      <View style={styles.cameraContainer}>
        <DocumentCamera onPictureTaken={handlePictureTaken} overlayType="id-card" />
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