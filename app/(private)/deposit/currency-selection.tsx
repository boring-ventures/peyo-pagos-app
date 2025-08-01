import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useDepositNavigation } from "@/app/hooks/useDepositNavigation";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CurrencyOption {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  backgroundColor: string;
  route: string;
}

const currencyOptions: CurrencyOption[] = [
  {
    id: "bolivianos",
    title: "Bs Bolivianos",
    icon: "R",
    iconColor: "#FFFFFF",
    backgroundColor: "#4A90E2",
    route: "/(private)/deposit/bolivianos",
  },
  {
    id: "usdc",
    title: "USDC",
    icon: "€",
    iconColor: "#FFFFFF",
    backgroundColor: "#2775CA",
    route: "/(private)/deposit/network-selection",
  },
  {
    id: "usdt",
    title: "USDT",
    icon: "₿",
    iconColor: "#FFFFFF",
    backgroundColor: "#26A69A",
    route: "/(private)/deposit/network-selection",
  },
  {
    id: "dai",
    title: "DAI",
    icon: "◈",
    iconColor: "#FFFFFF",
    backgroundColor: "#F5AC37",
    route: "/(private)/deposit/network-selection",
  },
];

export default function CurrencySelectionScreen() {
  const { navigateToHome, navigateToNetworkSelection, navigateToBolivianosForm } = useDepositNavigation();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");

  const handleCurrencySelect = (option: CurrencyOption) => {
    if (option.id === "bolivianos") {
      navigateToBolivianosForm();
    } else {
      // Navigate to network selection with the selected crypto
      navigateToNetworkSelection(option.id, option.title);
    }
  };

  const handleBackPress = () => {
    navigateToHome();
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
              <ThemedText style={styles.headerTitle}>Depositar</ThemedText>
              <ThemedText
                style={[styles.headerSubtitle, { color: subtextColor }]}
              >
                Selecciona la moneda
              </ThemedText>
            </View>
          </View>

          {/* Currency Options */}
          <View style={styles.optionsContainer}>
            {currencyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.currencyCard,
                  {
                    backgroundColor: cardColor,
                    borderColor,
                  },
                ]}
                onPress={() => handleCurrencySelect(option)}
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
                        styles.currencyIcon,
                        { color: option.iconColor },
                      ]}
                    >
                      {option.icon}
                    </ThemedText>
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText style={styles.currencyTitle}>
                      {option.title}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={subtextColor}
                  />
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
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  currencyCard: {
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
  currencyIcon: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cardTextContainer: {
    flex: 1,
  },
  currencyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
}); 