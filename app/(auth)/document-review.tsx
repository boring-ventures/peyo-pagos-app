import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useKycStore } from '@/app/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function DocumentReviewScreen() {
  const router = useRouter();
  const { documents, completeVerification, isLoading } = useKycStore();
  const cardColor = useThemeColor({}, 'card');
  const iconColor = useThemeColor({}, 'icon');

  const handleSubmit = async () => {
    await completeVerification();
    // In a real app, navigation would likely depend on the verification result
    router.push('./biometric-setup'); 
  };
  
  const handleRetake = (path: string) => {
    router.push(path as any);
  }

  return (
    <ThemedView style={styles.container}>
        <ScrollView>
            <ThemedText type="title" style={styles.title}>Revisa tus documentos</ThemedText>
            <ThemedText style={styles.subtitle}>Asegúrate que toda la información sea legible.</ThemedText>

            <View style={[styles.imageContainer, { backgroundColor: cardColor }]}>
                <ThemedText style={styles.imageLabel}>Frente del Documento</ThemedText>
                {documents.idFront && <Image source={{ uri: documents.idFront }} style={styles.image} />}
                <TouchableOpacity style={styles.retakeButton} onPress={() => handleRetake('./document-front')}>
                    <Ionicons name="camera-reverse-outline" size={16} color={iconColor} />
                    <ThemedText style={styles.retakeText}>Reintentar</ThemedText>
                </TouchableOpacity>
            </View>

            <View style={[styles.imageContainer, { backgroundColor: cardColor }]}>
                <ThemedText style={styles.imageLabel}>Dorso del Documento</ThemedText>
                {documents.idBack && <Image source={{ uri: documents.idBack }} style={styles.image} />}
                <TouchableOpacity style={styles.retakeButton} onPress={() => handleRetake('./document-back')}>
                    <Ionicons name="camera-reverse-outline" size={16} color={iconColor} />
                    <ThemedText style={styles.retakeText}>Reintentar</ThemedText>
                </TouchableOpacity>
            </View>

            <View style={[styles.imageContainer, { backgroundColor: cardColor }]}>
                <ThemedText style={styles.imageLabel}>Selfie</ThemedText>
                {documents.selfie && <Image source={{ uri: documents.selfie }} style={styles.image} />}
                <TouchableOpacity style={styles.retakeButton} onPress={() => handleRetake('./selfie-capture')}>
                    <Ionicons name="camera-reverse-outline" size={16} color={iconColor} />
                    <ThemedText style={styles.retakeText}>Reintentar</ThemedText>
                </TouchableOpacity>
            </View>
        </ScrollView>
      <ThemedButton
        onPress={handleSubmit}
        title="Enviar Verificación"
        loading={isLoading}
        disabled={isLoading || !documents.idFront || !documents.idBack || !documents.selfie}
        style={styles.button}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  imageLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 8,
    borderRadius: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  retakeText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 16,
  },
}); 