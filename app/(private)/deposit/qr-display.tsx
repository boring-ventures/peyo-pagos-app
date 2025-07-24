import { PaymentSuccessModal } from "@/app/components/payments/PaymentSuccessModal";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface QRDisplayProps {
  amount?: string;
  usdAmount?: string;
  description?: string;
}

export default function QRDisplayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const successColor = useThemeColor({}, "success") || "#4CAF50";

  // Get payment data from navigation params or use defaults
  const [paymentData] = useState({
    amount: (params.amount as string) || "15.60",
    usdAmount: (params.usdAmount as string) || "1.04",
    description: (params.description as string) || "Depósito PeyoPagos",
    bankName: "Banco Nacional de Bolivia",
    accountNumber: "1234567890",
  });

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleBackPress = () => {
    router.back();
  };

  const handleShareQR = async () => {
    try {
      const shareData = {
        title: "Pago QR Bancario",
        message: `Escanea este QR para pagar ${paymentData.amount} Bs\nRecibirás: ${paymentData.usdAmount} USDT\nBanco: ${paymentData.bankName}\nCuenta: ${paymentData.accountNumber}`,
        url: "https://peyopagos.com/qr", // Placeholder URL
      };

      if (Platform.OS === "web") {
        await Share.share(shareData);
      } else {
        await Share.share(shareData);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir el QR");
    }
  };

  const handleSaveImage = async () => {
    try {
      // In a real implementation, this would save the QR code as an image
      Alert.alert("Éxito", "Imagen guardada en la galería");
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la imagen");
    }
  };

  const handleConfirmPayment = () => {
    Alert.alert(
      "Confirmar Pago",
      "¿Has realizado el pago bancario?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: () => {
            // Show success modal
            setShowSuccessModal(true);
          },
        },
      ]
    );
  };

  // Generate QR code data
  const generateQRData = () => {
    return JSON.stringify({
      amount: paymentData.amount,
      currency: "BOB",
      bank: paymentData.bankName,
      account: paymentData.accountNumber,
      description: paymentData.description,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle}>
                Pago QR Bancario
              </ThemedText>
            </View>
          </View>

          {/* QR Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrHeader}>
              <ThemedText style={styles.qrTitle}>Escanea para pagar</ThemedText>
              <ThemedText
                style={[styles.qrSubtitle, { color: subtextColor }]}
              >
                Monto: {paymentData.amount} Bs
              </ThemedText>
            </View>

            {/* QR Code Display */}
            <View style={[styles.qrContainer, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={120} color={textColor} />
                <ThemedText
                  style={[styles.qrPlaceholderText, { color: subtextColor }]}
                >
                  Código QR
                </ThemedText>
                <ThemedText
                  style={[styles.qrDataText, { color: subtextColor }]}
                >
                  {generateQRData().substring(0, 50)}...
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Payment Details Card */}
          <View style={[styles.detailsCard, { backgroundColor: cardColor, borderColor }]}>
            <ThemedText style={styles.detailsTitle}>Detalles del Pago</ThemedText>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Monto a pagar:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {paymentData.amount} Bs
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Recibirás:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {paymentData.usdAmount} USDT
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Banco:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {paymentData.bankName}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Cuenta:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {paymentData.accountNumber}
              </ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Share QR Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton, { backgroundColor: cardColor, borderColor }]}
              onPress={handleShareQR}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="share-outline" size={20} color={textColor} />
                <ThemedText style={[styles.buttonText, { color: textColor }]}>
                  Compartir QR
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Save Image Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton, { backgroundColor: cardColor, borderColor }]}
              onPress={handleSaveImage}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="download-outline" size={20} color={textColor} />
                <ThemedText style={[styles.buttonText, { color: textColor }]}>
                  Guardar imagen
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Confirm Payment Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, { backgroundColor: successColor }]}
              onPress={handleConfirmPayment}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <ThemedText style={[styles.buttonText, { color: "white" }]}>
                  Confirmar pago realizado
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        amount={paymentData.amount}
        usdAmount={paymentData.usdAmount}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  qrSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  qrHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  qrContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  qrPlaceholder: {
    alignItems: "center",
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 8,
  },
  qrDataText: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.7,
  },
  detailsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {
    borderWidth: 0,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
}); 