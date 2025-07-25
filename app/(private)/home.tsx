import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { bridgeStatusService } from "@/app/services/bridgeStatusService";
import { useAuthStore } from "@/app/store/authStore";
import { useWalletBalanceStore } from "@/app/store/walletBalanceStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const virtualAccounts = [
  { name: "USA", flag: "🇺🇸", bg: "#4A90E2" },
  { name: "Europa", flag: "🇪🇺", bg: "#4A90E2" },
  { name: "México", flag: "🇲🇽", bg: "#4A90E2" },
];

export default function HomeScreen() {
  const { user, profile, isAuthenticated, userTag, loadUserTag } = useAuthStore();
  const {
    balanceData,
    transactions,
    isLoadingBalance,
    isLoadingTransactions,
    balanceError,
    transactionError,
    loadBalance,
    loadTransactions,
    refreshAll,
    clearBalanceError,
    clearTransactionError,
  } = useWalletBalanceStore();
  
  const [isCheckingWallets, setIsCheckingWallets] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bridgeCustomerId, setBridgeCustomerId] = useState<string | null>(null);
  
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

  // Load user tag on mount
  useEffect(() => {
    if (user && !userTag) {
      loadUserTag();
    }
  }, [user, userTag, loadUserTag]);

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

          const customerId = bridgeResult.bridgeCustomerId;
          setBridgeCustomerId(customerId || null);

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
              customerId: customerId || "",
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

          // 4. Load balance and transaction data if we have a Bridge customer ID
          if (customerId) {
            await Promise.all([
              loadBalance(customerId),
              loadTransactions(customerId, 3),
            ]);
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
  }, [user, loadBalance, loadTransactions]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    if (!user) return;
    
    setRefreshing(true);
    
    try {
      if (bridgeCustomerId) {
        // Use the store's refresh method for better state management
        await refreshAll(bridgeCustomerId);
      } else {
        // Fallback: re-check Bridge status and load data
        const bridgeResult = await bridgeStatusService.checkAndUpdateBridgeStatus(user.id);
        
        if (bridgeResult.success && bridgeResult.bridgeCustomerId) {
          setBridgeCustomerId(bridgeResult.bridgeCustomerId);
          await refreshAll(bridgeResult.bridgeCustomerId);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, bridgeCustomerId, refreshAll]);

  const handleCopy = async () => {
    const copyText = userTag || profile?.user_tag || "No ID available";
    await Clipboard.setStringAsync(copyText);
    Alert.alert("Copiado", "PEYO ID copiado al portapapeles");
  };

  const handleDeposit = () => {
    router.push("/(private)/deposit/currency-selection");
  };

  const handleBalanceErrorRetry = () => {
    clearBalanceError();
    if (bridgeCustomerId) {
      loadBalance(bridgeCustomerId, true);
    }
  };

  const handleTransactionErrorRetry = () => {
    clearTransactionError();
    if (bridgeCustomerId) {
      loadTransactions(bridgeCustomerId, 3, true);
    }
  };

  // Get display values
  const displayBalance = balanceData?.formattedBalance || "0,00 USDC";
  const displayPeyoId = userTag || profile?.user_tag || "Loading...";

  return (
    <ThemedView style={{ flex: 1, backgroundColor: cardColor }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={tintColor}
            />
          }
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View>
              <ThemedText style={styles.headerTitle}>Billetera</ThemedText>
              <View style={styles.headerSubtitleRow}>
                <ThemedText
                  style={[styles.headerSubtitle, { color: subtextColor }]}
                >
                  PEYO ID: {displayPeyoId}
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
            {isLoadingBalance ? (
              <View style={styles.balanceLoadingContainer}>
                <ActivityIndicator size="small" color={tintColor} />
                <ThemedText style={[styles.balanceLoadingText, { color: subtextColor }]}>
                  Cargando balance...
                </ThemedText>
              </View>
            ) : balanceError ? (
              <TouchableOpacity 
                onPress={handleBalanceErrorRetry}
                style={styles.balanceErrorContainer}
              >
                <ThemedText style={[styles.balanceErrorText, { color: errorColor }]}>
                  Error cargando balance
                </ThemedText>
                <ThemedText style={[styles.balanceRetryText, { color: subtextColor }]}>
                  Toca para reintentar
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText
                style={[styles.balanceText, { color: balanceTextColor }]}
              >
                {displayBalance}
              </ThemedText>
            )}
            {balanceData?.lastUpdated && (
              <ThemedText style={[styles.lastUpdatedText, { color: subtextColor }]}>
                Actualizado: {new Date(balanceData.lastUpdated).toLocaleTimeString()}
              </ThemedText>
            )}
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
                onPress={() => router.push('/(private)/cards' as any)}
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
            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.sectionTitle}>
                Transferencias recientes
              </ThemedText>
              {isLoadingTransactions && (
                <ActivityIndicator size="small" color={tintColor} />
              )}
            </View>
            
            {transactionError ? (
              <TouchableOpacity 
                onPress={handleTransactionErrorRetry}
                style={styles.transactionErrorContainer}
              >
                <ThemedText style={[styles.transactionErrorText, { color: errorColor }]}>
                  Error cargando transacciones
                </ThemedText>
                <ThemedText style={[styles.transactionRetryText, { color: subtextColor }]}>
                  Toca para reintentar
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.transfersList}>
                {transactions.map((t, idx) => (
                  <View key={t.id} style={styles.transferItem}>
                    <Text style={styles.transferFlag}>{t.flagIcon}</Text>
                    <ThemedText style={styles.transferName}>{t.counterparty}</ThemedText>
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
            )}
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
  balanceLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceLoadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  balanceErrorContainer: {
    alignItems: "center",
  },
  balanceErrorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  balanceRetryText: {
    fontSize: 12,
    marginTop: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    marginTop: 4,
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  transactionErrorContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  transactionErrorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  transactionRetryText: {
    fontSize: 12,
    marginTop: 4,
  },
});
