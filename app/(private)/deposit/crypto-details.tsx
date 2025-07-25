import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { liquidationAddressService } from "@/app/services/liquidationAddressService";
import { useAuthStore } from "@/app/store/authStore";
import { useBridgeStore } from "@/app/store/bridgeStore";
import { useLiquidationAddressStore } from "@/app/store/liquidationAddressStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

export default function CryptoDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");

  // Auth and Bridge data - Fixed TypeScript errors
  const { user } = useAuthStore();
  const {
    bridgeCustomerId,
    wallets,
    loadCustomerWallets,
    isLoading: bridgeLoading,
  } = useBridgeStore();

  // Liquidation address store
  const {
    currentAddress,
    currentLiquidationData,
    isLoading,
    error,
    getOrCreateDepositAddress,
    refreshAddress,
    clearError,
  } = useLiquidationAddressStore();

  // Get route params (with defaults since crypto-selection is bypassed)
  const cryptoType = useMemo(
    () => (params.cryptoType as string) || "usdc",
    [params.cryptoType]
  );
  const cryptoName = useMemo(
    () => (params.cryptoName as string) || "USDC",
    [params.cryptoName]
  );
  const networkType = useMemo(
    () => (params.networkType as string) || "solana",
    [params.networkType]
  );
  const networkName = useMemo(
    () => (params.networkName as string) || "Solana (SPL)",
    [params.networkName]
  );
  const chain = useMemo(
    () => (params.chain as string) || "solana",
    [params.chain]
  );

  // Local state
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [maxRetries] = useState(3);
  const [initializationStatus, setInitializationStatus] = useState<
    "checking" | "loading_wallets" | "loading_address" | "ready" | "error"
  >("checking");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [liquidationAddressLoaded, setLiquidationAddressLoaded] =
    useState(false);

  // Memoized values to prevent unnecessary re-renders
  const hasUserData = useMemo(() => Boolean(user?.id), [user?.id]);
  const hasBridgeData = useMemo(
    () => Boolean(bridgeCustomerId),
    [bridgeCustomerId]
  );
  const hasWallets = useMemo(
    () => Boolean(wallets && wallets.length > 0),
    [wallets]
  );

  // Initialize data on mount - simplified dependencies
  const initializeData = useCallback(async () => {
    try {
      console.log("🚀 Initializing crypto-details data");

      if (!hasUserData) {
        console.log("⏳ Waiting for user authentication...");
        setInitializationStatus("checking");
        return;
      }

      if (!hasBridgeData) {
        console.log("⏳ Waiting for Bridge customer ID...");
        setInitializationStatus("checking");
        return;
      }

      // Check if we need to load wallets
      if (!hasWallets) {
        console.log("📱 Loading Bridge wallets...");
        setInitializationStatus("loading_wallets");

        try {
          const result = await loadCustomerWallets();
          if (!result.success) {
            console.error("❌ Failed to load wallets:", result.error);
            setInitializationStatus("error");
            return;
          }
          console.log("✅ Wallets loaded successfully");
        } catch (error) {
          console.error("💥 Exception loading wallets:", error);
          setInitializationStatus("error");
          return;
        }
      }

      setInitializationStatus("ready");
    } catch (error) {
      console.error("💥 Exception in initializeData:", error);
      setInitializationStatus("error");
    }
  }, [hasUserData, hasBridgeData, hasWallets, loadCustomerWallets]);

  const loadLiquidationAddress = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (liquidationAddressLoaded || isLoading) {
      console.log(
        "💰 Liquidation address already loaded or loading, skipping..."
      );
      return;
    }

    try {
      console.log("🔄 Starting liquidation address loading process");
      setLiquidationAddressLoaded(true); // Set flag immediately to prevent re-runs

      if (!user?.id || !bridgeCustomerId || !wallets?.length) {
        console.log(
          "⏳ Missing required data:",
          "user:",
          !!user?.id,
          "customerId:",
          !!bridgeCustomerId,
          "wallets:",
          wallets?.length || 0
        );
        setInitializationStatus("error");
        setLiquidationAddressLoaded(false);
        return;
      }

      // Find the primary wallet for the selected chain
      const primaryWallet =
        wallets.find(
          (wallet) =>
            wallet.network === chain ||
            (chain === "solana" && wallet.network === "solana") ||
            (chain === "ethereum" && wallet.network === "mainnet") ||
            (chain === "polygon" && wallet.network === "polygon")
        ) || wallets[0];

      if (!primaryWallet) {
        console.error("❌ No suitable wallet found for chain:", chain);
        console.log(
          "Available wallets:",
          wallets.map((w) => `${w.id}:${w.network}`)
        );
        setInitializationStatus("error");
        setLiquidationAddressLoaded(false);
        return;
      }

      console.log(
        `🔄 Loading liquidation address for ${chain}/${cryptoType} with wallet:`,
        primaryWallet.address
      );

      await getOrCreateDepositAddress(
        user.id,
        bridgeCustomerId,
        primaryWallet.address,
        chain,
        cryptoType
      );

      // Reset retry attempts on success
      setRetryAttempts(0);
      console.log("✅ Liquidation address loading completed successfully");
    } catch (error) {
      console.error("💥 Error loading liquidation address:", error);
      setInitializationStatus("error");
      setLiquidationAddressLoaded(false);
    }
  }, [
    user?.id,
    bridgeCustomerId,
    wallets,
    chain,
    cryptoType,
    getOrCreateDepositAddress,
    liquidationAddressLoaded,
    isLoading,
  ]);

  // Effect for initialization - only runs when core dependencies change
  useEffect(() => {
    console.log("🔄 useEffect: initialization check");
    initializeData();
  }, [hasUserData, hasBridgeData]); // Simplified dependencies

  // Effect for loading liquidation address - only when ready and not loaded
  useEffect(() => {
    console.log("🔄 useEffect: liquidation address check", {
      initializationStatus,
      hasWallets,
      liquidationAddressLoaded,
      currentAddress,
    });

    if (
      initializationStatus === "ready" &&
      hasWallets &&
      !liquidationAddressLoaded &&
      !currentAddress
    ) {
      console.log("🎯 Triggering liquidation address load");
      loadLiquidationAddress();
    }
  }, [
    initializationStatus,
    hasWallets,
    liquidationAddressLoaded,
    currentAddress,
  ]); // Removed loadLiquidationAddress from deps

  // Reset liquidation address loaded flag when key parameters change
  useEffect(() => {
    console.log("🔄 useEffect: resetting liquidation flag for new parameters");
    setLiquidationAddressLoaded(false);
  }, [chain, cryptoType]);

  const handleRetry = useCallback(async () => {
    if (retryAttempts >= maxRetries) {
      Alert.alert(
        "Error",
        "Se ha intentado varias veces sin éxito. Por favor, contacta soporte.",
        [{ text: "OK" }]
      );
      return;
    }

    setRetryAttempts((prev) => prev + 1);
    clearError();
    setLiquidationAddressLoaded(false); // Reset flag for retry
    setInitializationStatus("checking");
    await initializeData();
  }, [retryAttempts, maxRetries, clearError, initializeData]);

  const handleRefreshAddress = useCallback(async () => {
    if (!user?.id || !bridgeCustomerId || !wallets?.length) {
      return;
    }

    const primaryWallet =
      wallets.find(
        (wallet) =>
          wallet.network === chain ||
          (chain === "solana" && wallet.network === "solana")
      ) || wallets[0];

    if (!primaryWallet) {
      return;
    }

    await refreshAddress(
      user.id,
      bridgeCustomerId,
      primaryWallet.address,
      chain,
      cryptoType
    );
  }, [user?.id, bridgeCustomerId, wallets, chain, cryptoType, refreshAddress]);

  const handleCopyAddress = useCallback(() => {
    if (currentAddress) {
      Clipboard.setString(currentAddress);
      Alert.alert(
        "Dirección copiada",
        "La dirección de depósito ha sido copiada al portapapeles.",
        [{ text: "OK" }]
      );
    }
  }, [currentAddress]);

  const handleCopyQRData = useCallback(() => {
    try {
      if (currentLiquidationData) {
        const qrData = generateCompleteQRData();
        if (qrData) {
          Clipboard.setString(qrData);
          Alert.alert(
            "Datos copiados",
            "Los datos completos de depósito han sido copiados al portapapeles.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error("Error copying QR data:", error);
      Alert.alert("Error", "No se pudieron copiar los datos QR");
    }
  }, [currentLiquidationData]);

  const handleShareAddress = useCallback(async () => {
    try {
      if (currentAddress && currentLiquidationData) {
        const qrData = generateCompleteQRData();
        if (qrData) {
          await Share.share({
            message: `Dirección de depósito ${cryptoName} (${networkName}):\n\n${qrData}`,
            title: "Dirección de Depósito",
          });
        }
      }
    } catch (error) {
      console.error("Error sharing address:", error);
      Alert.alert("Error", "No se pudo compartir la información");
    }
  }, [currentAddress, currentLiquidationData, cryptoName, networkName]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  // Generate complete QR data with all liquidation address details
  const generateCompleteQRData = useCallback((): string => {
    try {
      if (!currentLiquidationData) {
        console.warn("No liquidation data available for QR generation");
        return "";
      }

      const qrData = {
        // Basic deposit info
        address: currentLiquidationData.liquidationAddress,
        currency: currentLiquidationData.currency.toUpperCase(),
        network: networkName,
        chain: currentLiquidationData.chain,

        // Bridge metadata
        bridge_liquidation_id: currentLiquidationData.bridgeLiquidationId,
        destination_currency:
          currentLiquidationData.destinationCurrency.toUpperCase(),
        destination_payment_rail: currentLiquidationData.destinationPaymentRail,
        destination_address: currentLiquidationData.destinationAddress,

        // Transaction limits and timing
        minimum_amount: "1.00 USD",
        processing_time: "1-3 minutes",

        // Network-specific instructions
        network_instructions: {
          binance_network: networkName,
          memo_required: currentLiquidationData.chain === "stellar",
          gas_token:
            currentLiquidationData.chain === "ethereum"
              ? "ETH"
              : currentLiquidationData.chain === "polygon"
              ? "MATIC"
              : "SOL",
        },

        // Security and verification
        state: currentLiquidationData.state,
        created_at: new Date().toISOString(),

        // App metadata
        app: "Peyo Pagos",
        version: "1.0",
        type: "crypto_deposit",
      };

      return JSON.stringify(qrData, null, 2);
    } catch (error) {
      console.error("Error generating QR data:", error);
      setRenderError("Error generando datos QR");
      return "";
    }
  }, [currentLiquidationData, networkName]);

  // Generate Binance instructions (memoized to prevent re-calculations)
  const binanceInstructions = useMemo(() => {
    try {
      if (!currentAddress) return null;
      return liquidationAddressService.generateBinanceInstructions(
        currentAddress,
        chain
      );
    } catch (error) {
      console.error("Error generating Binance instructions:", error);
      return null;
    }
  }, [currentAddress, chain]);

  // Determine what to show based on initialization status
  const isInitializing =
    initializationStatus === "checking" ||
    initializationStatus === "loading_wallets" ||
    initializationStatus === "loading_address";
  const hasInitializationError =
    initializationStatus === "error" && !currentAddress;
  const isLoadingLiquidation =
    isLoading || initializationStatus === "loading_address";
  const showSuccessState =
    currentAddress &&
    currentLiquidationData &&
    initializationStatus === "ready" &&
    !isLoadingLiquidation &&
    !renderError;

  // Safe address formatting
  const formattedAddress = useMemo(() => {
    try {
      if (!currentAddress) return "";
      return liquidationAddressService.formatAddressForDisplay(currentAddress);
    } catch (error) {
      console.error("Error formatting address:", error);
      return currentAddress || "";
    }
  }, [currentAddress]);

  // Early return for render errors
  if (renderError) {
    return (
      <ThemedView style={{ flex: 1, backgroundColor }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
            <ThemedText style={styles.errorTitle}>
              Error de Renderizado
            </ThemedText>
            <ThemedText style={[styles.errorMessage, { color: subtextColor }]}>
              {renderError}
            </ThemedText>
            <ThemedButton
              title="Volver"
              onPress={handleBackPress}
              style={styles.retryButton}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

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
                Depositar {cryptoName}
              </ThemedText>
              <ThemedText
                style={[styles.headerSubtitle, { color: subtextColor }]}
              >
                {networkName}
              </ThemedText>
            </View>
          </View>

          {/* Initialization Status */}
          {initializationStatus === "checking" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText style={[styles.loadingText, { color: subtextColor }]}>
                Verificando datos de usuario...
              </ThemedText>
            </View>
          )}

          {initializationStatus === "loading_wallets" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText style={[styles.loadingText, { color: subtextColor }]}>
                Cargando wallets de Bridge...
              </ThemedText>
              <ThemedText
                style={[styles.loadingSubtext, { color: subtextColor }]}
              >
                Esto puede tomar unos segundos
              </ThemedText>
            </View>
          )}

          {initializationStatus === "loading_address" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText style={[styles.loadingText, { color: subtextColor }]}>
                Generando dirección de depósito...
              </ThemedText>
              <ThemedText
                style={[styles.loadingSubtext, { color: subtextColor }]}
              >
                Configurando liquidation address
              </ThemedText>
            </View>
          )}

          {/* Error State */}
          {(hasInitializationError || (error && !isLoadingLiquidation)) && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
                <ThemedText style={styles.errorTitle}>
                  {initializationStatus === "error"
                    ? "Error de inicialización"
                    : "Error al cargar dirección"}
                </ThemedText>
                <ThemedText
                  style={[styles.errorMessage, { color: subtextColor }]}
                >
                  {error || "No se pudieron cargar los datos necesarios"}
                </ThemedText>
                {initializationStatus === "error" && (
                  <ThemedText
                    style={[styles.errorDetails, { color: subtextColor }]}
                  >
                    Verifica tu conexión a internet y que tu cuenta Bridge esté
                    activa.
                  </ThemedText>
                )}
              </View>
              <ThemedButton
                title={
                  retryAttempts < maxRetries
                    ? "Reintentar"
                    : "Contactar Soporte"
                }
                onPress={handleRetry}
                style={styles.retryButton}
              />
            </View>
          )}

          {/* Success State */}
          {showSuccessState && (
            <>
              {/* Success message */}
              <View
                style={[
                  styles.successBanner,
                  {
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    borderColor: "#4CAF50",
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <ThemedText style={[styles.successText, { color: "#4CAF50" }]}>
                  Dirección de depósito lista
                </ThemedText>
              </View>

              {/* QR Code and Address */}
              <View
                style={[
                  styles.addressContainer,
                  { backgroundColor: cardColor, borderColor },
                ]}
              >
                <View style={styles.qrContainer}>
                  {(() => {
                    try {
                      const qrData = generateCompleteQRData();
                      if (!qrData) {
                        return (
                          <View style={styles.qrErrorContainer}>
                            <Ionicons
                              name="alert-circle"
                              size={32}
                              color="#FF6B6B"
                            />
                            <ThemedText style={styles.qrErrorText}>
                              Error generando QR
                            </ThemedText>
                          </View>
                        );
                      }
                      // return (
                      //   <QRCode
                      //     value={qrData}
                      //     size={200}
                      //     backgroundColor="white"
                      //     color="black"
                      //   />
                      // );
                    } catch (error) {
                      console.error("QR Code render error:", error);
                      return (
                        <View style={styles.qrErrorContainer}>
                          <Ionicons
                            name="alert-circle"
                            size={32}
                            color="#FF6B6B"
                          />
                          <ThemedText style={styles.qrErrorText}>
                            Error QR
                          </ThemedText>
                        </View>
                      );
                    }
                  })()}
                </View>

                <View style={styles.addressTextContainer}>
                  <ThemedText style={styles.addressLabel}>
                    Dirección de Depósito
                  </ThemedText>
                  <View
                    style={[
                      styles.addressBox,
                      { backgroundColor, borderColor },
                    ]}
                  >
                    <ThemedText style={styles.addressText} selectable>
                      {currentAddress || "Error cargando dirección"}
                    </ThemedText>
                  </View>

                  {/* QR Data Preview */}
                  <View style={styles.qrDataContainer}>
                    <ThemedText
                      style={[styles.qrDataLabel, { color: subtextColor }]}
                    >
                      El código QR contiene información completa:
                    </ThemedText>
                    <ThemedText
                      style={[styles.qrDataText, { color: subtextColor }]}
                    >
                      • Dirección: {formattedAddress}
                    </ThemedText>
                    <ThemedText
                      style={[styles.qrDataText, { color: subtextColor }]}
                    >
                      • Red: {networkName}
                    </ThemedText>
                    <ThemedText
                      style={[styles.qrDataText, { color: subtextColor }]}
                    >
                      • Moneda: {cryptoName}
                    </ThemedText>
                    <ThemedText
                      style={[styles.qrDataText, { color: subtextColor }]}
                    >
                      • Tiempo: 1-3 minutos
                    </ThemedText>
                    <ThemedText
                      style={[styles.qrDataText, { color: subtextColor }]}
                    >
                      • Mínimo: $1.00 USD
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.addressActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: tintColor },
                    ]}
                    onPress={handleCopyAddress}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="copy" size={20} color="white" />
                    <ThemedText style={styles.actionButtonText}>
                      Copiar Dirección
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: "transparent",
                        borderColor: tintColor,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={handleCopyQRData}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="qr-code" size={20} color={tintColor} />
                    <ThemedText
                      style={[styles.actionButtonText, { color: tintColor }]}
                    >
                      Copiar QR
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Network Information */}
              <View
                style={[
                  styles.infoContainer,
                  { backgroundColor: cardColor, borderColor },
                ]}
              >
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <ThemedText
                      style={[styles.infoLabel, { color: subtextColor }]}
                    >
                      Red de blockchain
                    </ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {networkName}
                    </ThemedText>
                  </View>
                  <View style={styles.infoItem}>
                    <ThemedText
                      style={[styles.infoLabel, { color: subtextColor }]}
                    >
                      Criptomoneda
                    </ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {cryptoName}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <ThemedText
                      style={[styles.infoLabel, { color: subtextColor }]}
                    >
                      Tiempo de acreditación
                    </ThemedText>
                    <ThemedText style={styles.infoValue}>1-3 min</ThemedText>
                  </View>
                  <View style={styles.infoItem}>
                    <ThemedText
                      style={[styles.infoLabel, { color: subtextColor }]}
                    >
                      Mínimo a depositar
                    </ThemedText>
                    <ThemedText style={styles.infoValue}>$1.00 USD</ThemedText>
                  </View>
                </View>
              </View>

              {/* Binance Instructions */}
              {binanceInstructions && (
                <View
                  style={[
                    styles.instructionsContainer,
                    { backgroundColor: cardColor, borderColor },
                  ]}
                >
                  <ThemedText style={styles.instructionsTitle}>
                    {binanceInstructions.title}
                  </ThemedText>

                  <View style={styles.stepsContainer}>
                    {binanceInstructions.steps.map((step, index) => (
                      <View key={index} style={styles.stepItem}>
                        <ThemedText
                          style={[styles.stepText, { color: subtextColor }]}
                        >
                          {step}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  <View style={styles.warningsContainer}>
                    <ThemedText style={styles.warningsTitle}>
                      ⚠️ Importante:
                    </ThemedText>
                    {binanceInstructions.warnings.map((warning, index) => (
                      <ThemedText
                        key={index}
                        style={[styles.warningText, { color: subtextColor }]}
                      >
                        {warning}
                      </ThemedText>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.bottomActions}>
                <ThemedButton
                  title="Compartir Información"
                  type="primary"
                  onPress={handleShareAddress}
                  style={styles.bottomButton}
                />
                <ThemedButton
                  title="Actualizar Dirección"
                  type="outline"
                  onPress={handleRefreshAddress}
                  style={styles.bottomButton}
                />
              </View>
            </>
          )}
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  errorContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  errorDetails: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
    fontStyle: "italic",
  },
  retryButton: {
    minWidth: 140,
  },
  addressContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  qrContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
  },
  qrErrorContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  qrErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#FF6B6B",
  },
  addressTextContainer: {
    width: "100%",
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  addressBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
    lineHeight: 20,
  },
  qrDataContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    padding: 12,
  },
  qrDataLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  qrDataText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  infoContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  instructionsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepItem: {
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningsContainer: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#FF6B6B",
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  bottomActions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bottomButton: {
    minHeight: 48,
  },
  successBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
