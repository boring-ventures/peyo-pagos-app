import { NumericKeypad } from "@/app/components/NumericKeypad";
import { OTPInput } from "@/app/components/OTPInput";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { authService } from "@/app/services/authService";
import { supabase } from "@/app/services/supabaseClient";
import { useAuthStore } from "@/app/store/authStore";
import { AuthError } from "@supabase/supabase-js";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 30; // seconds per design

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { initialize } = useAuthStore();
  const { phone, email, password, purpose, userId } = useLocalSearchParams<{
    phone: string;
    email?: string;
    password?: string;
    purpose?: "signup" | "passwordReset";
    userId?: string;
  }>();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  const colorScheme = useColorScheme();
  const linkColor = useThemeColor({}, "tint");

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

  const handleVerifyOTP = async () => {
    if (otp.length !== OTP_LENGTH) {
      Alert.alert("Código incompleto", "Por favor ingresa el código completo de 4 dígitos.");
      return;
    }

    setIsLoading(true);
    
    try {
      if (purpose === "signup" && userId && email && password) {
        // Simplified flow: Phone is already associated with main user, just verify OTP
        console.log('📱 Verifying OTP for main user (phone already associated)');
        
        // Login to main user first to establish session
        const { user: mainUser, session: mainSession, error: loginError } = await authService.signIn(email, password);
        
        if (loginError || !mainUser) {
          throw new Error("Error conectando con usuario principal.");
        }
        
        console.log('✅ Logged into main user:', mainUser.id);
        console.log('📱 Main user phone field:', mainUser.phone);
        console.log('📱 Attempting to verify OTP for phone:', phone);
        
        // Wait a moment to ensure session is established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Double-check current session
        const { data: currentSession } = await supabase.auth.getSession();
        console.log('📱 Current session user ID:', currentSession.session?.user?.id);
        console.log('📱 Current session user phone:', currentSession.session?.user?.phone);
        
        // Verify OTP for the phone change (now associated with main user)
        console.log('📱 Verifying OTP with type: phone_change, phone:', phone, 'token:', otp);
        
        // Check if phone verification is disabled in environment
        const isPhoneVerificationEnabled = process.env.EXPO_PUBLIC_PHONE_VERIFICATION_ENABLED === 'true';
        
        if (!isPhoneVerificationEnabled) {
          // Simulate successful verification when phone verification is disabled
          console.log('⚠️ Phone verification disabled in environment, simulating successful verification');
          console.log('✅ [TESTING] Phone verification bypassed successfully');
          // Don't perform any real verification - just mark as successful
        } else if (otp === "999999") {
          // TESTING: Try manual verification if OTP code is "999999" and verification is enabled
          console.log('🧪 [TESTING] Using manual verification bypass');
          const { error: manualError } = await authService.manuallyVerifyPhoneForTesting(phone);
          if (manualError) {
            throw new Error(`Manual verification failed: ${manualError.message}`);
          }
          console.log('✅ [TESTING] Phone manually verified successfully');
        } else {
          // Normal OTP verification
          const { data, error: otpError } = await supabase.auth.verifyOtp({
            phone,
            token: otp,
            type: 'phone_change', // Use phone_change type for phone verification
          });

          console.log('📱 OTP verification response:', { data: data?.user?.id, error: otpError?.message });

          if (otpError) {
            console.error('❌ OTP verification failed:', otpError);
            throw new Error(otpError.message);
          }

          if (!data.user) {
            throw new Error("Error de verificación. Intenta nuevamente.");
          }

          console.log('✅ OTP verified successfully for main user:', data.user.id);
        }
        
        // Mark phone as verified in main user (only if phone verification is enabled)
        if (isPhoneVerificationEnabled) {
          const { error: verifyError } = await authService.markPhoneAsVerified();
          if (verifyError) {
            console.warn('⚠️ Warning: Could not mark phone as verified:', verifyError.message);
          } else {
            console.log('✅ Phone marked as verified in main user');
          }
        } else {
          console.log('⚠️ Phone verification disabled, skipping markPhoneAsVerified call');
        }
        
        // Update auth store with verified user info
        await initialize();
        
        console.log('✅ Registration completed successfully, proceeding to KYC flow...');
        
        // Redirect to manual KYC flow
        router.replace("/(auth)/personal-info");
        
      } else if (purpose === "passwordReset") {
        // For password reset, use the original flow
        const { user, session, error } = await authService.verifyWhatsAppOTP(
          phone, 
          otp, 
          "recovery"
        );

        if (error) {
          throw new Error(error.message);
        }

        router.push({
          pathname: "/(public)/reset-password",
          params: { phone },
        });
      } else {
        // Default signup flow without email linking
        const { user, session, error } = await authService.verifyWhatsAppOTP(
          phone, 
          otp, 
          "signup"
        );

        if (error) {
          throw new Error(error.message);
        }

        router.replace("/(auth)/personal-info");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      const errorMessage = error instanceof Error ? error.message : "Código incorrecto";
      Alert.alert("Código incorrecto", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      let error: AuthError | null = null;
      
      // Use appropriate resend method based on purpose and userId
      if (purpose === "signup" && userId) {
        // For signup with existing user, use the method that associates phone with user
        const result = await authService.sendWhatsAppOTPToExistingUser(phone, userId);
        error = result.error;
      } else {
        // For password reset or other cases, use the original method
        const result = await authService.resendWhatsAppOTP(
          phone, 
          purpose === "passwordReset" ? "recovery" : "signup"
        );
        error = result.error;
      }
      
      if (error) {
        throw new Error(error.message);
      }

      setCountdown(RESEND_COUNTDOWN);
      setCanResend(false);
      setOtp("");
      Alert.alert("Código reenviado", `Se envió un nuevo código a tu WhatsApp ${authService.formatPhoneForDisplay(phone)}`);
    } catch (error) {
      console.error("Resend error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al reenviar código";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (seconds: number) =>
    `00:${seconds.toString().padStart(2, "0")}`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.cardSheet,
            { backgroundColor: colorScheme === "dark" ? "#1A2B42" : "#FFFFFF" },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.topSection}>
              <ThemedText type="title" style={styles.title}>
                Verifica tu cuenta
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Por favor ingresa el codigo de {OTP_LENGTH} digitos que se envio a tu WhatsApp
                {phone ? `\n${authService.formatPhoneForDisplay(phone)}` : ""}
              </ThemedText>
              <OTPInput value={otp} length={OTP_LENGTH} width={45} height={45} />
              <View style={styles.resendSection}>
                <TouchableOpacity onPress={handleResendCode} disabled={!canResend || isLoading}>
                  <ThemedText style={[styles.resendText, { opacity: (!canResend || isLoading) ? 0.5 : 1 }]}>
                    {canResend
                      ? "Reenviar código"
                      : `Reenviar código en ${formatCountdown(countdown)}`}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.bottomSection}>
              <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
              <ThemedButton
                title="Continuar"
                type="primary"
                size="large"
                onPress={handleVerifyOTP}
                loading={isLoading}
                disabled={isLoading || otp.length !== OTP_LENGTH}
                style={styles.continueButton}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  safeArea: {
    flex: 1,
  },
  cardSheet: {
    flex: 1,
    backgroundColor: "#1A2B42",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    paddingTop: 20,
  },
  bottomSection: {
    justifyContent: "flex-end",
    paddingBottom: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.8,
    paddingHorizontal: "5%",
  },
  resendSection: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  resendText: {
    textAlign: "center",
    opacity: 0.8,
  },
  continueButton: {
    marginTop: 16,
    alignSelf: "stretch",
  },
});
