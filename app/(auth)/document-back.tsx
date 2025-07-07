import DocumentCamera from '@/app/components/kyc/DocumentCamera';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useKycStore } from '@/app/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DocumentBackScreen() {
  const router = useRouter();
  const { uploadDocument } = useKycStore();

  const handlePictureTaken = (base64: string) => {
    uploadDocument({ type: 'idBack', file: base64 });
    router.push('./selfie-capture');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Documento (Dorso)</ThemedText>
        </View>
        <ThemedText style={styles.subtitle}>
          Ahora, captura el lado posterior de tu documento.
        </ThemedText>
      </SafeAreaView>
      <View style={styles.cameraContainer}>
        <DocumentCamera onPictureTaken={handlePictureTaken} overlayType="id-card" />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    paddingHorizontal: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
}); 