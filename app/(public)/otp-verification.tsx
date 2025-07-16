import { NumericKeypad } from "@/app/components/NumericKeypad";
import { OTPInput } from "@/app/components/OTPInput";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { authService } from "@/app/services/authService";
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
  const { phone, email, password, purpose } = useLocalSearchParams<{
    phone: string;
    email?: string;
    password?: string;
    purpose?: "signup" | "passwordReset";
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
      // Verify WhatsApp OTP
      const { user, session, error } = await authService.verifyWhatsAppOTP(
        phone, 
        otp, 
        purpose === "passwordReset" ? "recovery" : "signup"
      );

      if (error) {
        throw new Error(error.message);
      }

      if (purpose === "signup" && email && password && session) {
        // For signup, link WhatsApp verification to email account
        const profileData = {
          email,
          first_name: "", // Will be filled in personal-info screen
          last_name: "",  // Will be filled in personal-info screen
          phone,
        };

        const { error: linkError } = await authService.completeEmailRegistration(
          email,
          password,
          profileData,
          session
        );

        if (linkError) {
          console.warn("Account linking warning:", linkError.message);
          // Continue anyway as WhatsApp verification succeeded
        }

        router.replace("/(auth)/personal-info");
      } else if (purpose === "passwordReset") {
        router.push({
          pathname: "/(public)/reset-password",
          params: { phone },
        });
      } else {
        // Default signup flow without email linking
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
      const { error } = await authService.resendWhatsAppOTP(
        phone, 
        purpose === "passwordReset" ? "recovery" : "signup"
      );
      
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
