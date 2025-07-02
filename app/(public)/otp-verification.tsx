import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { NumericKeypad } from '@/app/components/NumericKeypad';
import { OTPInput } from '@/app/components/OTPInput';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { authService } from '@/app/services/authService';

const OTP_LENGTH = 4;
const RESEND_COUNTDOWN = 30; // seconds

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  // Early validation - if no email provided, redirect back
  useEffect(() => {
    if (!email) {
      Alert.alert(
        'Error',
        'Email is required for verification',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [email, router]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleKeyPress = useCallback((key: string) => {
    if (otp.length < OTP_LENGTH) {
      const newOtp = otp + key;
      setOtp(newOtp);
      setHasError(false);
    }
  }, [otp]);

  const handleDelete = useCallback(() => {
    if (otp.length > 0) {
      setOtp(otp.slice(0, -1));
      setHasError(false);
    }
  }, [otp]);

  const handleVerifyOTP = async () => {
    if (otp.length !== OTP_LENGTH) {
      setHasError(true);
      return;
    }

    if (!email) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      const { user, error } = await authService.verifyOTP(email, otp, 'signup');

      if (error) {
        setHasError(true);
        Alert.alert(Strings.common.error, error.message || Strings.auth.otp.invalidCode);
      } else if (user) {
        Alert.alert(
          Strings.common.success,
          'Account verified successfully!',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(private)/home'),
            },
          ]
        );
      } else {
        setHasError(true);
        Alert.alert(Strings.common.error, Strings.auth.otp.invalidCode);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setHasError(true);
      Alert.alert(Strings.common.error, Strings.auth.errors.otpFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || !email) return;

    try {
      const { error } = await authService.resendOTP(email, 'signup');
      
      if (error) {
        Alert.alert(Strings.common.error, error.message || 'Failed to resend verification code');
      } else {
        // Reset states
        setOtp('');
        setHasError(false);
        setCountdown(RESEND_COUNTDOWN);
        setCanResend(false);
        
        Alert.alert(Strings.common.success, Strings.auth.otp.resendSuccess);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert(Strings.common.error, 'Failed to resend verification code');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isOTPComplete = otp.length === OTP_LENGTH;

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#1A2B42' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.cardContainer, { backgroundColor }]}>
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              {Strings.auth.otp.title}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: textSecondaryColor }]}>
              {Strings.auth.otp.subtitle} {email || 'your email'}
            </ThemedText>
          </View>

          <View style={styles.otpContainer}>
            <OTPInput
              value={otp}
              length={OTP_LENGTH}
              error={hasError}
            />
          </View>

          <NumericKeypad
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            disabled={isLoading}
          />

          <View style={styles.resendContainer}>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={!canResend}
              style={styles.resendButton}
            >
              <ThemedText
                style={[
                  styles.resendText,
                  {
                    color: canResend ? tintColor : textSecondaryColor,
                  },
                ]}
              >
                {canResend
                  ? Strings.auth.otp.resendNow
                  : `${Strings.auth.otp.resendCode} ${formatCountdown(countdown)}`}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedButton
            title={Strings.auth.otp.continueButton}
            onPress={handleVerifyOTP}
            loading={isLoading}
            disabled={!isOTPComplete || isLoading}
            style={styles.continueButton}
            size="large"
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  otpContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    marginTop: 'auto',
  },
}); 