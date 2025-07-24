import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface PaymentSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  amount?: string;
  usdAmount?: string;
}

export function PaymentSuccessModal({
  visible,
  onClose,
  amount = "15.60",
  usdAmount = "1.04",
}: PaymentSuccessModalProps) {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "background");
  const iconColor = useThemeColor({}, "icon");
  const successColor = useThemeColor({}, "success") || "#4CAF50";
  const subtextColor = useThemeColor({}, "textSecondary");

  const handleContinue = () => {
    onClose();
    // Navigate back to wallet/home
    router.push("/(private)/home");
  };

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <TouchableOpacity
          style={[styles.modalContent, { backgroundColor }]}
          activeOpacity={1}
          onPress={() => {}} // Prevent closing when clicking modal content
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={iconColor} />
          </TouchableOpacity>

          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.successIcon, { backgroundColor: successColor }]}>
              <Ionicons name="checkmark" size={48} color="white" />
            </View>
          </View>

          {/* Title */}
          <ThemedText style={styles.title}>
            ¡Pago exitoso!
          </ThemedText>

          {/* Description */}
          <ThemedText style={[styles.description, { color: subtextColor }]}>
            Tu depósito de {amount} Bs ha sido procesado correctamente.
          </ThemedText>

          {/* Secondary Text */}
          <ThemedText style={[styles.secondaryText, { color: subtextColor }]}>
            Recibirás {usdAmount} USDT en tu billetera en los próximos minutos.
          </ThemedText>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Continuar"
              type="primary"
              size="large"
              onPress={handleContinue}
              style={styles.continueButton}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  secondaryText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
  },
  continueButton: {
    width: "100%",
  },
});

export default PaymentSuccessModal; 