import { NumericKeypad } from '@/app/components/NumericKeypad';
import { OTPInput } from '@/app/components/OTPInput';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const OTP_LENGTH = 4;
const RESEND_COUNTDOWN = 23; // seconds per design

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleKeyPress = useCallback((key: string) => {
    setOtp((prev) => (prev.length < OTP_LENGTH ? prev + key : prev));
  }, []);

  const handleDelete = useCallback(() => {
    setOtp((prev) => prev.slice(0, -1));
  }, []);

  const handleVerifyOTP = () => {
    if (otp !== '1234') {
      Alert.alert('Invalid Code', 'The code entered is incorrect.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/(public)/reset-password',
        params: { email },
      });
    }, 1000);
  };

  const handleResendCode = () => {
    if (!canResend) return;
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);
    setOtp('');
    Alert.alert('Code Resent', `A new code has been sent to ${email}`);
  };

  const formatCountdown = (seconds: number) => `00:${seconds.toString().padStart(2, '0')}`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={'#fff'} />
        </TouchableOpacity>

        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Ingresar código
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Ingresa el código que se envió a tu correo para recuperar la contraseña
          </ThemedText>

          <OTPInput value={otp} length={OTP_LENGTH} />

          <View style={styles.resendContainer}>
            <ThemedText style={styles.resendText}>
              {canResend ? 'Resend Code' : `Resend Code in ${formatCountdown(countdown)}`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.keypadContainer}>
          <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
          <ThemedButton
            title="Continuar"
            type="primary"
            size="large"
            onPress={handleVerifyOTP}
            loading={isLoading}
            disabled={isLoading || otp.length !== OTP_LENGTH}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 48,
    maxWidth: '80%',
  },
  resendContainer: {
    marginTop: 24,
  },
  resendText: {
    opacity: 0.7,
  },
  keypadContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  button: {
    marginTop: 16,
  },
}); 