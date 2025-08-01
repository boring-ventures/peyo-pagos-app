import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useDepositNavigation } from "@/app/hooks/useDepositNavigation";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { liquidationAddressService } from "@/app/services/liquidationAddressService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface NetworkOption {
  id: string;
  name: string;
  displayName: string;
  chain: string;
  supportedCurrencies: string[];
  icon: string;
  iconColor: string;
  backgroundColor: string;
  selected: boolean;
}

export default function NetworkSelectionScreen() {
  const { navigateToCurrencySelection, navigateToCryptoDetails } = useDepositNavigation();
  const params = useLocalSearchParams();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");

  // Get crypto type from params or default to USDC
  const cryptoType = (params.cryptoType as string) || "usdc";
  const cryptoName = (params.cryptoName as string) || "USDC";

  // Network options state
  const [networkOptions, setNetworkOptions] = useState<NetworkOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load supported networks from Bridge.xyz
  useEffect(() => {
    const loadSupportedNetworks = () => {
      try {
        console.log('🌐 Loading supported networks from Bridge.xyz');
        
        const supportedNetworks = liquidationAddressService.getSupportedNetworks();
        
        // Filter networks that support the selected crypto and convert to NetworkOption format
        const networkOptionsWithSelection = supportedNetworks
          .filter(network => network.supportedCurrencies.includes(cryptoType))
          .map((network, index) => ({
            id: network.id,
            name: network.name,
            displayName: network.displayName,
            chain: network.chain,
            supportedCurrencies: network.supportedCurrencies,
            icon: network.icon,
            iconColor: network.iconColor,
            backgroundColor: network.backgroundColor,
            selected: network.id === 'solana', // Default to Solana
          }));

        setNetworkOptions(networkOptionsWithSelection);
        setIsLoading(false);
        
        console.log(`✅ Loaded ${networkOptionsWithSelection.length} supported networks for ${cryptoType}`);
      } catch (error) {
        console.error('❌ Error loading supported networks:', error);
        setIsLoading(false);
      }
    };

    loadSupportedNetworks();
  }, [cryptoType]);

  const handleNetworkSelect = (selectedNetwork: NetworkOption) => {
    // Update selection state
    const updatedOptions = networkOptions.map((option) => ({
      ...option,
      selected: option.id === selectedNetwork.id,
    }));
    setNetworkOptions(updatedOptions);

    console.log(`🔗 Selected network: ${selectedNetwork.displayName} (${selectedNetwork.chain})`);

    // Navigate to crypto deposit details
    navigateToCryptoDetails(
      cryptoType,
      cryptoName,
      selectedNetwork.id,
      selectedNetwork.displayName,
      selectedNetwork.chain
    );
  };

  const handleBackPress = () => {
    navigateToCurrencySelection();
  };

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, backgroundColor }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.loadingText}>
              Cargando redes disponibles...
            </ThemedText>
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
                Selecciona la red blockchain
              </ThemedText>
            </View>
          </View>

          {/* Crypto Info */}
          <View style={styles.cryptoInfo}>
            <ThemedText style={styles.cryptoTitle}>
              {cryptoName}
            </ThemedText>
            <ThemedText style={[styles.cryptoSubtitle, { color: subtextColor }]}>
              Estas son todas las redes disponibles en Bridge.xyz para recibir {cryptoName}
            </ThemedText>
          </View>

          {/* Network Options */}
          <View style={styles.optionsContainer}>
            {networkOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.networkCard,
                  {
                    backgroundColor: option.selected ? tintColor : cardColor,
                    borderColor: option.selected ? tintColor : borderColor,
                    borderWidth: option.selected ? 2 : 1,
                  },
                ]}
                onPress={() => handleNetworkSelect(option)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: option.backgroundColor },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.networkIcon,
                        { color: option.iconColor },
                      ]}
                    >
                      {option.icon}
                    </ThemedText>
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText 
                      style={[
                        styles.networkTitle,
                        { color: option.selected ? "white" : textColor }
                      ]}
                    >
                      {option.displayName}
                    </ThemedText>
                    <ThemedText 
                      style={[
                        styles.networkSubtitle,
                        { color: option.selected ? "rgba(255,255,255,0.8)" : subtextColor }
                      ]}
                    >
                      Soporta: {option.supportedCurrencies.map(c => c.toUpperCase()).join(", ")}
                    </ThemedText>
                  </View>
                  {option.selected && (
                    <View style={styles.selectionIndicator}>
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <View style={styles.helpItem}>
              <Ionicons name="information-circle-outline" size={20} color={subtextColor} />
              <ThemedText style={[styles.helpText, { color: subtextColor }]}>
                Cada red tiene diferentes tiempos de confirmación y comisiones
              </ThemedText>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="time-outline" size={20} color={subtextColor} />
              <ThemedText style={[styles.helpText, { color: subtextColor }]}>
                Solana es la más rápida (1-3 min), Ethereum puede tomar más tiempo
              </ThemedText>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="warning-outline" size={20} color={subtextColor} />
              <ThemedText style={[styles.helpText, { color: subtextColor }]}>
                Verifica siempre que seleccionas la red correcta en tu exchange
              </ThemedText>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
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
  cryptoInfo: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  cryptoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cryptoSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  networkCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    minHeight: 80,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  networkIcon: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cardTextContainer: {
    flex: 1,
  },
  networkTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  networkSubtitle: {
    fontSize: 14,
    fontWeight: "400",
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  helpContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
}); 