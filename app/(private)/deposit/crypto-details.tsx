import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useDepositNavigation } from "@/app/hooks/useDepositNavigation";
import { useQRCode } from "@/app/hooks/useQRCode";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { bridgeService } from "@/app/services/bridgeService";
import { liquidationAddressService } from "@/app/services/liquidationAddressService";
import { useAuthStore } from "@/app/store/authStore";
import { useBridgeStore } from "@/app/store/bridgeStore";
import { useLiquidationAddressStore } from "@/app/store/liquidationAddressStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

export default function CryptoDetailsScreen() {
  const { navigateToNetworkSelection } = useDepositNavigation();
  const params = useLocalSearchParams();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const errorColor = useThemeColor({}, "error");

  // Auth and Bridge data - Fixed TypeScript errors
  const { user, profile } = useAuthStore();
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
    clearCurrentData,
    debugClearAllCache,
    debugGetCacheInfo,
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

  // QR Code state and hook
  const {
    generateQR,
    isGenerating: isGeneratingQR,
    error: qrError,
    clearError: clearQRError,
  } = useQRCode();
  const [qrSVG, setQrSVG] = useState<string | null>(null);

  // Memoized values to prevent unnecessary re-renders
  const hasUserData = useMemo(
    () => Boolean(user?.id && profile),
    [user?.id, profile]
  );
  const hasBridgeData = useMemo(
    () => Boolean(bridgeCustomerId),
    [bridgeCustomerId]
  );
  const hasWallets = useMemo(
    () => Boolean(wallets && wallets.length > 0),
    [wallets]
  );

  // Helper function to get the correct profile.id from profiles table
  const getProfileId = useCallback(async (): Promise<string | null> => {
    if (!user?.id) {
      console.error("❌ No user.id available");
      return null;
    }

    try {
      console.log("🔍 Getting profile.id from profiles table...");
      const { supabaseAdmin } = await import("@/app/services/supabaseAdmin");
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("userId", user.id)
        .single();

      if (profileError || !profileData) {
        console.error("❌ Failed to get profile.id:", profileError);
        console.error(
          "❌ This means the profile record is missing in the profiles table"
        );
        return null;
      }

      const profileId = profileData.id;
      console.log(`✅ Found profile.id: ${profileId} for user.id: ${user.id}`);
      return profileId;
    } catch (error) {
      console.error("💥 Error getting profile data:", error);
      return null;
    }
  }, [user?.id]);

  // Initialize data on mount - simplified dependencies
  const initializeData = useCallback(async () => {
    try {
      console.log("🚀 Initializing crypto-details data");
      console.log("📊 Debug data:", {
        hasUser: !!user?.id,
        userId: user?.id,
        hasProfile: !!profile,
        hasBridgeCustomerId: !!bridgeCustomerId,
        bridgeCustomerId,
        hasWallets: !!wallets?.length,
        walletsCount: wallets?.length || 0,
      });

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
  }, [
    hasUserData,
    hasBridgeData,
    hasWallets,
    loadCustomerWallets,
    user?.id,
    profile,
    bridgeCustomerId,
    wallets,
  ]);

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
      console.log("📊 Debug parameters for liquidation address:", {
        userId: user?.id,
        bridgeCustomerId,
        chain,
        cryptoType,
        walletsAvailable: wallets?.length || 0,
      });

      // Check if the combination is supported by Bridge.xyz
      const isSupported = bridgeService.isLiquidationPairSupported(
        chain,
        cryptoType,
        'solana', // Always liquidate to Solana
        'usdc'    // Always liquidate to USDC
      );

      if (!isSupported) {
        const supportedPairs = bridgeService.getSupportedLiquidationPairs(chain);
        const errorMessage = `La combinación ${cryptoName} (${networkName}) no está soportada por Bridge.xyz para liquidación a Solana USDC. ` +
          `Para ${networkName}, las opciones soportadas son: ${supportedPairs.map(p => p.currency.toUpperCase()).join(', ')}`;
        
        console.error("❌ Unsupported liquidation pair:", errorMessage);
        setInitializationStatus("error");
        setLiquidationAddressLoaded(false);
        // Set error in store
        useLiquidationAddressStore.getState().clearError();
        useLiquidationAddressStore.setState({ error: errorMessage });
        return;
      }

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

      // Get the actual profile.id from profiles table (not user.id)
      const profileId = await getProfileId();
      if (!profileId) {
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

      // Get the Supabase wallet.id for this Bridge wallet
      console.log(
        `🔍 Finding Supabase wallet.id for Bridge wallet: ${primaryWallet.id}`
      );
      let supabaseWalletId: string | undefined = undefined;

      try {
        const { supabaseAdmin } = await import("@/app/services/supabaseAdmin");
        const { data: walletData, error: walletError } = await supabaseAdmin
          .from("wallets")
          .select("id")
          .eq("bridge_wallet_id", primaryWallet.id)
          .single();

        if (walletError || !walletData) {
          console.warn(
            "⚠️ Could not find Supabase wallet for Bridge wallet:",
            primaryWallet.id
          );
          console.warn("⚠️ Continuing without wallet_id reference");
        } else {
          supabaseWalletId = walletData.id;
          console.log(
            `✅ Found Supabase wallet.id: ${supabaseWalletId} for Bridge: ${primaryWallet.id}`
          );
        }
      } catch (error) {
        console.warn("⚠️ Error looking up Supabase wallet:", error);
      }

      // Call with correct profile.id from profiles table
      await getOrCreateDepositAddress(
        profileId, // Using correct profile.id from profiles table
        bridgeCustomerId,
        primaryWallet.address,
        chain,
        cryptoType,
        supabaseWalletId // Pass Supabase wallet.id directly
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
    getProfileId,
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
      isLoading,
    });

    if (
      initializationStatus === "ready" &&
      hasWallets &&
      !liquidationAddressLoaded &&
      !currentAddress &&
      !isLoading
    ) {
      console.log("🎯 Triggering liquidation address load");
      loadLiquidationAddress();
    }
  }, [
    initializationStatus,
    hasWallets,
    liquidationAddressLoaded,
    currentAddress,
    isLoading,
  ]); // Removed loadLiquidationAddress from deps

  // Reset liquidation address loaded flag when key parameters change
  useEffect(() => {
    console.log("🔄 useEffect: resetting liquidation flag for new parameters");
    setLiquidationAddressLoaded(false);
    // Clear current address and liquidation data when parameters change
    clearCurrentData();
    setQrSVG(null); // Also clear QR code
  }, [chain, cryptoType, clearCurrentData]); // Removed problematic dependencies

  // Generate QR code when liquidation data is ready
  useEffect(() => {
    const generateQRCode = async () => {
      if (!currentLiquidationData || !currentAddress) {
        setQrSVG(null);
        return;
      }

      try {
        clearQRError();
        console.log("🔄 Generating QR for liquidation address...");

        const qrData = generateCompleteQRData();
        if (!qrData) {
          console.warn("⚠️ No QR data generated");
          return;
        }

        const dataURL = await generateQR(qrData, {
          width: 200,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: textColor, // Use theme text color for QR code
            light: backgroundColor, // Use theme background color for QR background
          },
        });

        setQrSVG(dataURL);
        console.log("✅ QR code generated successfully");
      } catch (error) {
        console.error("❌ Failed to generate QR code:", error);
        setQrSVG(null);
      }
    };

    generateQRCode();
  }, [currentLiquidationData, currentAddress, generateQR, clearQRError, textColor, backgroundColor]);

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

    try {
      // Get the actual profile.id from profiles table (not user.id)
      const profileId = await getProfileId();
      if (!profileId) {
        Alert.alert("Error", "No se pudo obtener la información del perfil");
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
        profileId, // Using correct profile.id from profiles table
        bridgeCustomerId,
        primaryWallet.address,
        chain,
        cryptoType,
        primaryWallet.id // Pass Bridge wallet ID for Supabase wallet lookup
      );
    } catch (error) {
      console.error("💥 Error in handleRefreshAddress:", error);
      Alert.alert("Error", "No se pudo actualizar la dirección");
    }
  }, [
    user?.id,
    bridgeCustomerId,
    wallets,
    chain,
    cryptoType,
    refreshAddress,
    getProfileId,
  ]);

  // DEBUG: Handle cache diagnostics
  const handleDebugCache = useCallback(() => {
    const cacheInfo = debugGetCacheInfo();
    console.log("🔍 Cache diagnostic info:", cacheInfo);

    Alert.alert(
      "Debug: Cache Info",
      `Cache entries: ${cacheInfo.cacheSize}\nKeys: ${cacheInfo.cacheKeys.join(
        ", "
      )}\n\nCheck console for details.`,
      [{ text: "OK" }]
    );
  }, [debugGetCacheInfo]);

  // DEBUG: Handle cache clearing
  const handleDebugClearCache = useCallback(() => {
    Alert.alert(
      "Debug: Clear Cache",
      "¿Estás seguro de que quieres limpiar todo el caché de liquidation addresses? Esto forzará que se vuelvan a obtener desde Supabase/Bridge.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          style: "destructive",
          onPress: async () => {
            try {
              await debugClearAllCache();
              setLiquidationAddressLoaded(false);
              setInitializationStatus("checking");
              await initializeData();
              Alert.alert("Éxito", "Caché limpiado. Reintentando...");
            } catch (error) {
              console.error("Error clearing cache:", error);
              Alert.alert("Error", "No se pudo limpiar el caché");
            }
          },
        },
      ]
    );
  }, [debugClearAllCache, initializeData]);

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
    navigateToNetworkSelection(cryptoType, cryptoName);
  }, [navigateToNetworkSelection, cryptoType, cryptoName]);

  // Generate complete QR data with all liquidation address details
  const generateCompleteQRData = useCallback((): string => {
    try {
      if (!currentLiquidationData) {
        console.warn("No liquidation data available for QR generation");
        return "";
      }

      // Return only the pure address for QR code
      return currentLiquidationData.liquidationAddress;
    } catch (error) {
      console.error("Error generating QR data:", error);
      setRenderError("Error generando datos QR");
      return "";
    }
  }, [currentLiquidationData]);

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

  // Show loading state when any loading is happening or when we don't have data yet
  const shouldShowLoading = isInitializing || isLoadingLiquidation || (!currentAddress && !hasInitializationError);

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
            <Ionicons name="alert-circle" size={48} color={errorColor} />
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
          {shouldShowLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tintColor} />
              <ThemedText style={[styles.loadingText, { color: subtextColor }]}>
                {initializationStatus === "checking"
                  ? "Verificando datos de usuario..."
                  : initializationStatus === "loading_wallets"
                  ? "Cargando wallets de Bridge..."
                  : isLoadingLiquidation
                  ? "Generando dirección de depósito..."
                  : "Cargando..."}
              </ThemedText>
              <ThemedText
                style={[styles.loadingSubtext, { color: subtextColor }]}
              >
                {initializationStatus === "checking"
                  ? "Esto puede tomar unos segundos"
                  : initializationStatus === "loading_wallets"
                  ? "Esto puede tomar unos segundos"
                  : isLoadingLiquidation
                  ? "Configurando liquidation address"
                  : "Por favor espera..."}
              </ThemedText>
              
              {/* Show progress indicator */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressStep, initializationStatus !== "checking" && styles.progressStepCompleted]}>
                  <ThemedText style={[styles.progressText, { color: subtextColor }]}>
                    1. Verificar datos
                  </ThemedText>
                </View>
                <View style={[styles.progressStep, initializationStatus === "loading_wallets" || initializationStatus === "loading_address" || initializationStatus === "ready" ? styles.progressStepCompleted : styles.progressStepPending]}>
                  <ThemedText style={[styles.progressText, { color: subtextColor }]}>
                    2. Cargar wallets
                  </ThemedText>
                </View>
                <View style={[styles.progressStep, initializationStatus === "loading_address" || initializationStatus === "ready" ? styles.progressStepCompleted : styles.progressStepPending]}>
                  <ThemedText style={[styles.progressText, { color: subtextColor }]}>
                    3. Generar dirección
                  </ThemedText>
                </View>
              </View>
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
                <Ionicons name="alert-circle" size={48} color={errorColor} />
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
                {error && error.includes("no está soportada") && (
                  <View style={styles.unsupportedInfo}>
                    <ThemedText
                      style={[styles.unsupportedTitle, { color: errorColor }]}
                    >
                      💡 Información importante:
                    </ThemedText>
                    <ThemedText
                      style={[styles.unsupportedText, { color: subtextColor }]}
                    >
                      Bridge.xyz tiene limitaciones en las combinaciones de criptomonedas y redes que soporta. 
                      Para depósitos en {networkName}, considera usar las opciones disponibles.
                    </ThemedText>
                    
                    {/* Show alternative options */}
                    <View style={styles.alternativesContainer}>
                      <ThemedText
                        style={[styles.alternativesTitle, { color: subtextColor }]}
                      >
                        Opciones disponibles para {networkName}:
                      </ThemedText>
                      {(() => {
                        const supportedPairs = bridgeService.getSupportedLiquidationPairs(chain);
                        return supportedPairs.map((pair, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.alternativeOption,
                              { backgroundColor: "rgba(76, 175, 80, 0.1)", borderColor: "#4CAF50" }
                            ]}
                            onPress={() => {
                              // Navigate to network selection with the supported option
                              navigateToNetworkSelection(pair.currency, pair.currency.toUpperCase());
                            }}
                          >
                            <ThemedText style={[styles.alternativeText, { color: "#4CAF50" }]}>
                              {pair.currency.toUpperCase()} en {networkName}
                            </ThemedText>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          </TouchableOpacity>
                        ));
                      })()}
                    </View>
                  </View>
                )}
                {initializationStatus === "error" && !error?.includes("no está soportada") && (
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
                  {isGeneratingQR ? (
                    <View style={styles.qrLoadingContainer}>
                      <ActivityIndicator size="large" color={tintColor} />
                      <ThemedText
                        style={[styles.qrLoadingText, { color: tintColor }]}
                      >
                        Generando código QR...
                      </ThemedText>
                    </View>
                  ) : qrSVG ? (
                    <View style={styles.qrImageContainer}>
                      <SvgXml xml={qrSVG} width={200} height={200} />
                    </View>
                  ) : qrError ? (
                    <View style={styles.qrErrorContainer}>
                      <Ionicons name="alert-circle" size={32} color={errorColor} />
                      <ThemedText style={[styles.qrErrorText, { color: errorColor }]}>
                        Error generando QR
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.qrErrorText,
                          { fontSize: 12, marginTop: 4, color: subtextColor },
                        ]}
                      >
                        {qrError}
                      </ThemedText>
                      <TouchableOpacity
                        style={[
                          styles.retryQRButton,
                          { borderColor: tintColor },
                        ]}
                        onPress={() => {
                          clearQRError();
                          setQrSVG(null);
                          // El useEffect se ejecutará automáticamente
                        }}
                      >
                        <ThemedText
                          style={[styles.retryQRText, { color: tintColor }]}
                        >
                          Reintentar
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : currentAddress && currentLiquidationData ? (
                    <View style={styles.qrLoadingContainer}>
                      <ActivityIndicator size="small" color={tintColor} />
                      <ThemedText
                        style={[styles.qrLoadingText, { color: subtextColor }]}
                      >
                        Preparando código QR...
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.qrErrorContainer}>
                      <Ionicons name="qr-code" size={64} color={subtextColor} />
                      <ThemedText
                        style={[styles.qrErrorText, { color: subtextColor }]}
                      >
                        Sin datos para QR
                      </ThemedText>
                    </View>
                  )}
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
                    <ThemedText
                      style={[styles.qrDataText, { color: subtextColor }]}
                    >
                      • Liquidación: Solana USDC
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

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <ThemedText
                      style={[styles.infoLabel, { color: subtextColor }]}
                    >
                      Destino de liquidación
                    </ThemedText>
                    <ThemedText style={styles.infoValue}>Solana USDC</ThemedText>
                  </View>
                  <View style={styles.infoItem}>
                    <ThemedText
                      style={[styles.infoLabel, { color: subtextColor }]}
                    >
                      Estado
                    </ThemedText>
                    <ThemedText style={styles.infoValue}>Activo</ThemedText>
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

                {/* DEBUG: Only show in development */}
                <>
                  {/* <ThemedButton
                    title="🔍 Debug: Info Cache"
                    type="outline"
                    onPress={handleDebugCache}
                    style={[
                      styles.bottomButton,
                      { backgroundColor: "rgba(255, 193, 7, 0.1)" },
                    ]}
                  />
                  <ThemedButton
                    title="🧹 Debug: Limpiar Cache"
                    type="outline"
                    onPress={handleDebugClearCache}
                    style={[
                      styles.bottomButton,
                      { backgroundColor: "rgba(220, 53, 69, 0.1)" },
                    ]}
                  /> */}
                </>
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
  qrLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qrLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  qrErrorContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  qrErrorText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
  retryQRButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryQRText: {
    fontSize: 14,
    fontWeight: "600",
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
  qrImageContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  unsupportedInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  unsupportedTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  unsupportedText: {
    fontSize: 13,
    lineHeight: 18,
  },
  alternativesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  alternativeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  alternativeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  progressStepCompleted: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  progressStepPending: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
