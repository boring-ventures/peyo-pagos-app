import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerificationSuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const logo = useThemedAsset(
    require('@/assets/images/icon-light.png'),
    require('@/assets/images/icon-dark.png')
  );

  const handleContinue = () => {
    router.replace('/(private)/home');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.logoWrapper}>
          <Ionicons name="logo-buffer" size={1} color="transparent" />
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} />
          </View>
        </View>
      </SafeAreaView>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={72} color="#fff" />
        </View>
        <ThemedText type="title" style={styles.title}>Gracias</ThemedText>
        <ThemedText style={styles.subtitle}>Tus datos de verificación se enviaron correctamente</ThemedText>
      </View>
      <ThemedButton title="Continuar" onPress={handleContinue} style={styles.button} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    justifyContent: 'space-between',
  },
  safeArea: {
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 24,
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
}); 