import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function DocumentIntroScreen() {
  const router = useRouter();
  const idVerificationAsset = useThemedAsset(
    require('@/assets/images/onboarding/id-verification.png'),
    require('@/assets/images/onboarding/id-verification.png')
  );

  const handleContinue = () => {
    router.push('./document-front');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Image source={idVerificationAsset} style={styles.image} />
        <ThemedText type="title" style={styles.title}>
          Verificación de identidad
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Te pediremos tu CI y una selfie. Es una forma rápida, segura y en la que
          confían millones de usuarios de todo el mundo.
        </ThemedText>
      </View>
      <ThemedButton
        onPress={handleContinue}
        title="Vamos"
        style={styles.button}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 48,
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
  button: {
    marginBottom: 16,
  },
});
