import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useAuthStore } from '@/app/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  
  // Fixed Peyo logo
  const logoAsset = require('@/assets/images/icon-dark.png');

  // Animation values
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Start celebration animations
    Animated.sequence([
      // Confetti falls down
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      // Content scales up
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      // Text fades in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    router.replace('/(private)/home');
  };

  // Confetti pieces data
  const confettiPieces = [
    { color: '#FFD700', size: 12, left: 60, delay: 0 },
    { color: '#FF6B6B', size: 8, left: 100, delay: 100 },
    { color: '#4ECDC4', size: 10, left: 140, delay: 200 },
    { color: '#45B7D1', size: 6, left: 180, delay: 50 },
    { color: '#96CEB4', size: 14, left: 220, delay: 150 },
    { color: '#FFEAA7', size: 9, left: 260, delay: 300 },
    { color: '#DDA0DD', size: 11, left: 300, delay: 250 },
    { color: '#98D8C8', size: 7, left: 340, delay: 180 },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#1A2B42' }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Image source={logoAsset} style={styles.logo} />
      </SafeAreaView>

      {/* Confetti Animation */}
      <View style={styles.confettiContainer}>
        {confettiPieces.map((piece, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.size,
                left: piece.left,
                transform: [
                  {
                    translateY: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 600],
                    }),
                  },
                  {
                    rotate: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Celebration Content */}
      <View style={styles.content}>
        {/* Celebration Emojis */}
        <Animated.View
          style={[
            styles.emojiContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.emojiRow}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.emoji}>🎊</Text>
          </View>
          <View style={styles.confettiDotsContainer}>
            <View style={[styles.confettiDot, { backgroundColor: '#FF6B6B' }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#4ECDC4' }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#FFD700' }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#45B7D1' }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#96CEB4' }]} />
          </View>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View
          style={[
            styles.textContainer,
            { opacity: fadeAnim },
          ]}
        >
          <ThemedText type="title" style={styles.title}>
            Felicidades {profile?.first_name || 'Usuario'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Tu cuenta ha sido creada exitosamente y es hora de conectar tus pagos con todo el mundo
          </ThemedText>
        </Animated.View>
      </View>

      {/* Continue Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          { opacity: fadeAnim },
        ]}
      >
        <ThemedButton
          title="¡Vamos!"
          type="primary"
          size="large"
          onPress={handleContinue}
          style={styles.button}
        />
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emojiContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emojiRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 60,
    marginHorizontal: 10,
  },
  confettiDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confettiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: '90%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 25,
    paddingVertical: 16,
  },
}); 