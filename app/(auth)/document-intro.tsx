import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

export default function DocumentIntroScreen() {
  const router = useRouter();
  const idVerificationAsset = useThemedAsset(
    require('@/assets/images/onboarding/id-verification.png'),
    require('@/assets/images/onboarding/id-verification.png')
  );

  const colorScheme = useColorScheme();
  const cardBg = colorScheme === 'dark' ? '#1A2B42' : '#FFFFFF';

  const handleContinue = () => {
    router.push('./document-front');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardSheetWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.cardSheet, { backgroundColor: cardBg }]}>
            <Image source={idVerificationAsset} style={styles.image} />
            <ThemedText type="title" style={styles.title}>
              Verificación de identidad
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Te pediremos tu CI y una selfie. Es una forma rápida, segura y en la que
              confían millones de usuarios de todo el mundo.
            </ThemedText>
            <ThemedButton
              onPress={handleContinue}
              title="Vamos"
              style={styles.continueButton}
            />
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSheetWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 150,
    paddingHorizontal: 10,
  },
  cardSheet: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 24,
  },
  continueButton: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
