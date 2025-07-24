import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface NetworkOption {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  backgroundColor: string;
  selected: boolean;
}

export default function NetworkSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");

  // Get crypto data from navigation params
  const cryptoType = (params.cryptoType as string) || "usdt";
  const cryptoName = (params.cryptoName as string) || "USDT";

  // Network options with selection state
  const [networkOptions, setNetworkOptions] = useState<NetworkOption[]>([
    {
      id: "polygon",
      title: "Polygon POS",
      icon: "$",
      iconColor: "#FFFFFF",
      backgroundColor: "#8247E5",
      selected: false,
    },
    {
      id: "solana",
      title: "Solana",
      icon: "€",
      iconColor: "#FFFFFF",
      backgroundColor: "#9945FF",
      selected: true, // Default selected
    },
  ]);

  const handleNetworkSelect = (selectedNetwork: NetworkOption) => {
    // Update selection state
    const updatedOptions = networkOptions.map((option) => ({
      ...option,
      selected: option.id === selectedNetwork.id,
    }));
    setNetworkOptions(updatedOptions);

    // Navigate to crypto deposit details
    router.push({
      pathname: "/(private)/deposit/crypto-details",
      params: {
        cryptoType,
        cryptoName,
        networkType: selectedNetwork.id,
        networkName: selectedNetwork.title,
      },
    });
  };

  const handleBackPress = () => {
    router.back();
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
                Depositar Crypto
              </ThemedText>
              <ThemedText
                style={[styles.headerSubtitle, { color: subtextColor }]}
              >
                Selecciona la red
              </ThemedText>
            </View>
          </View>

          {/* Crypto Info */}
          <View style={styles.cryptoInfo}>
            <ThemedText style={styles.cryptoTitle}>
              {cryptoName}
            </ThemedText>
            <ThemedText style={[styles.cryptoSubtitle, { color: subtextColor }]}>
              Selecciona la red para continuar
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
                      {option.title}
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
    fontSize: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
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
  },
  selectionIndicator: {
    marginLeft: 12,
  },
}); 