import { NumericKeypad } from "@/app/components/NumericKeypad";
import { OTPInput } from "@/app/components/OTPInput";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

const OTP_LENGTH = 4;
const RESEND_COUNTDOWN = 23; // seconds per design

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email, purpose } = useLocalSearchParams<{
    email: string;
    purpose?: "signup" | "passwordReset";
  }>();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);

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

  const handleVerifyOTP = () => {
    if (otp !== "1234") {
      Alert.alert("Invalid Code", "The code entered is incorrect.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (purpose === "signup") {
        router.replace("/(auth)/personal-info");
      } else {
        router.push({
          pathname: "/(public)/reset-password",
          params: { email },
        });
      }
    }, 1000);
  };

  const handleResendCode = () => {
    if (!canResend) return;
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);
    setOtp("");
    Alert.alert("Code Resent", `A new code has been sent to ${email}`);
  };

  const handleSendViaWhatsapp = () => {
    setShowWhatsappModal(true);
  };

  const formatCountdown = (seconds: number) =>
    `00:${seconds.toString().padStart(2, "0")}`;

  return (
    <ThemedView style={styles.container}>
      {/* WhatsApp confirmation modal */}
      <Modal
        visible={showWhatsappModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWhatsappModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colorScheme === "dark" ? "#1A2B42" : "#FFFFFF" },
            ]}
          >
            <View style={styles.modalIconWrapper}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <ThemedText type="title" style={styles.modalTitle}>
              Se envió el código al WhatsApp
            </ThemedText>
            <ThemedButton
              title="Ingresar código"
              type="primary"
              size="large"
              style={styles.modalButton}
              onPress={() => setShowWhatsappModal(false)}
            />
          </View>
        </View>
      </Modal>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.cardSheet,
            { backgroundColor: colorScheme === "dark" ? "#1A2B42" : "#FFFFFF" },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="title" style={styles.title}>
              Verifica tu cuenta
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Por favor ingresa el codigo de {OTP_LENGTH} digitos que se envio al correo
              {email ? `\n${email}` : ""}
            </ThemedText>
            <OTPInput value={otp} length={OTP_LENGTH} />
            <View style={styles.resendSection}>
              <TouchableOpacity onPress={handleResendCode} disabled={!canResend}>
                <ThemedText style={styles.resendText}>
                  {canResend
                    ? "Reenviar código"
                    : `Reenviar código en ${formatCountdown(countdown)}`}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.whatsappContainer}>
                <ThemedText style={styles.whatsappText}>
                  O usa enviar al
                </ThemedText>
                <TouchableOpacity onPress={handleSendViaWhatsapp}>
                  <ThemedText style={[styles.whatsappLink, { color: linkColor }]}>WhatsApp</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
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
          </ScrollView>
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
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  cardSheet: {
    flex: 1,
    marginTop: 100,
    backgroundColor: "#1A2B42",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
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
    marginBottom: 5,
    marginTop: 10,
  },
  whatsappContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  whatsappText: {
    marginRight: 4,
  },
  resendText: {
    textAlign: "center",
    opacity: 0.8,
  },
  whatsappLink: {
    textDecorationLine: "underline",
  },
  continueButton: {
    marginTop: 16,
    alignSelf: "stretch",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "80%",
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#45D483",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  modalButton: {
    alignSelf: "stretch",
  },
});
