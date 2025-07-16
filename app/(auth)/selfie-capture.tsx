import DocumentCamera from '@/app/components/kyc/DocumentCamera';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useKycStore } from '@/app/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelfieCaptureScreen() {
  const router = useRouter();
  const { uploadDocument } = useKycStore();

  const handlePictureTaken = async (base64: string) => {
    console.log("📷 Handling selfie picture...");
    try {
      // Wait for selfie upload to complete
      await uploadDocument({ type: 'selfie', file: base64 });
      console.log("✅ Selfie uploaded successfully");
      // Navigate to document-review, which will handle the final KYC completion
      router.push('./document-review');
    } catch (error) {
      console.error("❌ Error uploading selfie:", error);
      // Could show error alert here
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Selfie</ThemedText>
        </View>
        <ThemedText style={styles.subtitle}>
          Centra tu rostro en el óvalo y asegúrate de que haya buena iluminación.
        </ThemedText>
      </SafeAreaView>
      <View style={styles.cameraContainer}>
        <DocumentCamera onPictureTaken={handlePictureTaken} overlayType="face" />
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