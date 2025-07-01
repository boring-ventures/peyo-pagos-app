import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

// Placeholder para los logos hasta que el usuario los coloque
const logoLight = require('@/assets/images/icon-light.png');
const logoDark = require('@/assets/images/icon-dark.png');

export const LoadingScreen: React.FC = () => {
  const logo = useThemedAsset(logoLight, logoDark);
  const fadeAnim = useRef(new Animated.Value(0.3)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const fadeIn = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    });

    const fadeOut = Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 1000,
      useNativeDriver: true,
    });

    const scaleUp = Animated.timing(scaleAnim, {
      toValue: 1.05,
      duration: 1000,
      useNativeDriver: true,
    });

    const scaleDown = Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 1000,
      useNativeDriver: true,
    });

    // Animación continua
    Animated.loop(
      Animated.parallel([
        Animated.sequence([fadeIn, fadeOut]),
        Animated.sequence([scaleUp, scaleDown]),
      ])
    ).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ThemedText type="subtitle">{Strings.common.loading}</ThemedText>
      </Animated.View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
  },
  textContainer: {
    alignItems: 'center',
  },
});

export default LoadingScreen; 