import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CryptoDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");

  // Get data from navigation params
  const cryptoType = (params.cryptoType as string) || "usdt";
  const cryptoName = (params.cryptoName as string) || "USDT";
  const networkType = (params.networkType as string) || "polygon";
  const networkName = (params.networkName as string) || "Polygon POS";

  // Wallet address (in a real app, this would be generated based on crypto/network)
  const walletAddress = "0x3395dfgdf49d7g9d7g9d7g9d7g9d7g9d7g9d7g9d";

  const handleBackPress = () => {
    router.back();
  };

  const handleCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(walletAddress);
      Alert.alert("Éxito", "Dirección copiada al portapapeles");
    } catch (error) {
      Alert.alert("Error", "No se pudo copiar la dirección");
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: "Depositar Crypto",
        message: `Deposita ${cryptoName} en ${networkName}\nDirección: ${walletAddress}`,
        url: "https://peyopagos.com/deposit", // Placeholder URL
      };

      await Share.share(shareData);
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir");
    }
  };

  // Generate QR code data
  const generateQRData = () => {
    return JSON.stringify({
      address: walletAddress,
      crypto: cryptoName,
      network: networkName,
      timestamp: new Date().toISOString(),
    });
  };

  // Get currency display info
  const getCurrencyInfo = () => {
    switch (cryptoType) {
      case "usdt":
        return {
          name: "USDT Tether USD",
          color: "#26A69A",
        };
      case "usdc":
        return {
          name: "USDC USD Coin",
          color: "#2775CA",
        };
      default:
        return {
          name: "USDT Tether USD",
          color: "#26A69A",
        };
    }
  };

  // Get network display info
  const getNetworkInfo = () => {
    switch (networkType) {
      case "polygon":
        return {
          name: "Polygon POS Red nativa de MATIC",
          color: "#8247E5",
        };
      case "solana":
        return {
          name: "Solana Red nativa de SOL",
          color: "#9945FF",
        };
      default:
        return {
          name: "Polygon POS Red nativa de MATIC",
          color: "#8247E5",
        };
    }
  };

  const currencyInfo = getCurrencyInfo();
  const networkInfo = getNetworkInfo();

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
                Depositar Crypto
              </ThemedText>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
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

          {/* Deposit Information */}
          <View style={styles.infoContainer}>
            {/* Currency Info */}
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Moneda</ThemedText>
              <View style={styles.infoValue}>
                <View style={[styles.indicator, { backgroundColor: currencyInfo.color }]} />
                <ThemedText style={styles.infoText}>
                  {currencyInfo.name}
                </ThemedText>
              </View>
            </View>

            {/* Network Info */}
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Red</ThemedText>
              <View style={styles.infoValue}>
                <View style={[styles.indicator, { backgroundColor: networkInfo.color }]} />
                <ThemedText style={styles.infoText}>
                  {networkInfo.name}
                </ThemedText>
              </View>
            </View>

            {/* Address Info */}
            <View style={styles.addressContainer}>
              <ThemedText style={styles.infoLabel}>Dirección</ThemedText>
              <View style={[styles.addressCard, { backgroundColor: cardColor, borderColor }]}>
                <ThemedText style={[styles.addressText, { color: subtextColor }]}>
                  {walletAddress}
                </ThemedText>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyAddress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="copy-outline" size={20} color={tintColor} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Transaction Limits */}
          <View style={styles.limitsContainer}>
            <View style={styles.limitRow}>
              <View style={styles.limitItem}>
                <ThemedText style={[styles.limitLabel, { color: subtextColor }]}>
                  Tiempo de acreditación
                </ThemedText>
                <ThemedText style={styles.limitValue}>5 min</ThemedText>
              </View>
              <View style={styles.limitItem}>
                <ThemedText style={[styles.limitLabel, { color: subtextColor }]}>
                  Máximo a depositar
                </ThemedText>
                <ThemedText style={styles.limitValue}>10,000 USDT</ThemedText>
              </View>
            </View>
          </View>

          {/* Share Button */}
          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Compartir"
              type="primary"
              size="large"
              onPress={handleShare}
              style={styles.shareButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
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
    marginBottom: 32,
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
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoValue: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addressContainer: {
    marginTop: 16,
  },
  addressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressText: {
    fontSize: 14,
    fontFamily: "monospace",
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    padding: 8,
  },
  limitsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  limitItem: {
    flex: 1,
    alignItems: "center",
  },
  limitLabel: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  shareButton: {
    width: "100%",
  },
}); 