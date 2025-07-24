import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { bridgeStatusService } from "@/app/services/bridgeStatusService";
import { useAuthStore } from "@/app/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PEYO_ID = "123456";
const BALANCE = "5 200,00 USDC";

const virtualAccounts = [
  { name: "USA", flag: "🇺🇸", bg: "#4A90E2" },
  { name: "Europa", flag: "🇪🇺", bg: "#4A90E2" },
  { name: "México", flag: "🇲🇽", bg: "#4A90E2" },
];

const transfers = [
  { name: "Amanda", flag: "🇺🇸", amount: "+300.00 USDC", positive: true },
  { name: "Diego", flag: "🇪🇺", amount: "-150.00 USDC", positive: false },
  { name: "Gabriela", flag: "🇧🇷", amount: "-1 200.00 USDC", positive: false },
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [isCheckingWallets, setIsCheckingWallets] = useState(false);
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const balanceTextColor = useThemeColor({}, "text");
  const router = useRouter();

  // Verificar estado de Bridge y crear wallets si es necesario
  useEffect(() => {
    const checkUserStatusAndWallets = async () => {
      if (!user) return;

      try {
        console.log("🔍 Verificando estado de usuario y wallets...");

        // 1. Verificar estado de Bridge (esto ya sincroniza las wallets automáticamente)
        const bridgeResult =
          await bridgeStatusService.checkAndUpdateBridgeStatus(user.id);

        if (
          bridgeResult.success &&
          bridgeResult.verificationStatus === "active"
        ) {
          console.log("✅ Usuario aprobado en Bridge");
          console.log(
            `💳 Bridge reporta ${bridgeResult.walletCount || 0} wallets`
          );

          // 2. Solo crear wallet si Bridge no tiene ninguna
          if (bridgeResult.walletCount === 0) {
            console.log(
              "💳 Usuario no tiene wallets en Bridge, creando primera wallet..."
            );
            setIsCheckingWallets(true);

            // 3. Crear primera wallet usando el authStore
            const { createWallet } = useAuthStore.getState();
            const createResult = await createWallet({
              chain: "solana",
              currency: "usdc",
              customerId: bridgeResult.bridgeCustomerId || "",
              bridgeTags: ["default"],
            });

            if (createResult) {
              console.log("✅ Primera wallet creada exitosamente");
              // Refresh Bridge status para sincronizar la nueva wallet
              await bridgeStatusService.checkAndUpdateBridgeStatus(user.id);
            } else {
              console.error("❌ Error creando primera wallet");
            }
          } else {
            console.log(
              `✅ Usuario ya tiene ${bridgeResult.walletCount} wallets en Bridge - sincronización completada automáticamente`
            );

            // Asegurar que las wallets están cargadas en el store
            const { loadUserWallets } = useAuthStore.getState();
            await loadUserWallets();
          }
        } else {
          console.log(
            "⚠️ Usuario no está aprobado o hay error:",
            bridgeResult.verificationStatus
          );
        }
      } catch (error) {
        console.error("💥 Error verificando estado y wallets:", error);
      } finally {
        setIsCheckingWallets(false);
      }
    };

    checkUserStatusAndWallets();
  }, [user]);

  const handleCopy = () => {
    Clipboard.setStringAsync(PEYO_ID);
    Alert.alert("Copiado", "PEYO ID copiado al portapapeles");
  };

  const handleDeposit = () => {
    router.push("/(private)/deposit/currency-selection");
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: cardColor }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View>
              <ThemedText style={styles.headerTitle}>Billetera</ThemedText>
              <View style={styles.headerSubtitleRow}>
                <ThemedText
                  style={[styles.headerSubtitle, { color: subtextColor }]}
                >
                  PEYO ID: {PEYO_ID}
                </ThemedText>
              </View>
            </View>
            <ThemedButton
              title="Copiar"
              type="outline"
              size="small"
              onPress={handleCopy}
              style={styles.copyButton}
            />
          </View>

          {/* Balance */}
          <View style={styles.balanceContainer}>
            <ThemedText
              style={[styles.balanceText, { color: balanceTextColor }]}
            >
              {BALANCE}
            </ThemedText>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionContainer}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: cardColor, borderColor },
                ]}
                onPress={handleDeposit}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={28}
                  color={tintColor}
                  style={styles.actionIcon}
                />
                <ThemedText style={styles.actionLabel}>Depósito</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: cardColor, borderColor },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={28}
                  color={tintColor}
                  style={styles.actionIcon}
                />
                <ThemedText style={styles.actionLabel}>Retiro</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: cardColor, borderColor },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="card-outline"
                  size={28}
                  color={tintColor}
                  style={styles.actionIcon}
                />
                <ThemedText style={styles.actionLabel}>
                  Tarjeta de débito
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Virtual Accounts */}
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>
              Cuentas virtuales
            </ThemedText>
            <View style={styles.accountsRow}>
              {virtualAccounts.map((acc, idx) => (
                <View
                  key={acc.name}
                  style={[
                    styles.accountCard,
                    { backgroundColor: acc.bg, marginRight: idx < 2 ? 12 : 0 },
                  ]}
                >
                  <Text style={styles.accountFlag}>{acc.flag}</Text>
                  <ThemedText style={styles.accountName}>{acc.name}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Transfers */}
          <View style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>
              Transferencias recientes
            </ThemedText>
            <View style={styles.transfersList}>
              {transfers.map((t, idx) => (
                <View key={t.name} style={styles.transferItem}>
                  <Text style={styles.transferFlag}>{t.flag}</Text>
                  <ThemedText style={styles.transferName}>{t.name}</ThemedText>
                  <ThemedText
                    style={[
                      styles.transferAmount,
                      { color: t.positive ? successColor : errorColor },
                    ]}
                  >
                    {t.amount}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 2,
  },
  headerSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  copyButton: {
    minWidth: 70,
    marginLeft: 12,
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  balanceContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 18,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0B1E3D",
  },
  actionContainer: {
    marginHorizontal: 20,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderWidth: 1.5,
    justifyContent: "center",
    minWidth: 0,
    marginHorizontal: 0,
  },
  actionIcon: {
    marginRight: 10,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  sectionContainer: {
    marginTop: 10,
    marginBottom: 0,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  accountsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 8,
    gap: 0,
  },
  accountCard: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 0,
    minWidth: 90,
    maxWidth: 120,
    opacity: 1,
  },
  accountFlag: {
    fontSize: 32,
    marginBottom: 4,
  },
  accountName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.2,
  },
  transfersList: {
    marginTop: 0,
  },
  transferItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8EA",
  },
  transferFlag: {
    fontSize: 22,
    marginRight: 10,
  },
  transferName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
});
