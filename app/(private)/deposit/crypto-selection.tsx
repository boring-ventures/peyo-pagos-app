import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CryptoOption {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  backgroundColor: string;
  route: string;
}

const cryptoOptions: CryptoOption[] = [
  {
    id: "usdt",
    title: "USDT",
    icon: "€",
    iconColor: "#FFFFFF",
    backgroundColor: "#26A69A",
    route: "/(private)/deposit/network-selection",
  },
  {
    id: "usdc",
    title: "USDC",
    icon: "€",
    iconColor: "#FFFFFF",
    backgroundColor: "#2775CA",
    route: "/(private)/deposit/network-selection",
  },
];

export default function CryptoSelectionScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");

  const handleCryptoSelect = (option: CryptoOption) => {
    // Navigate to network selection with crypto type
    router.push({
      pathname: option.route as any,
      params: {
        cryptoType: option.id,
        cryptoName: option.title,
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
              <ThemedText style={styles.headerTitle}>Depositar</ThemedText>
              <ThemedText
                style={[styles.headerSubtitle, { color: subtextColor }]}
              >
                Selecciona la crypto
              </ThemedText>
            </View>
          </View>

          {/* Crypto Options */}
          <View style={styles.optionsContainer}>
            {cryptoOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.cryptoCard,
                  {
                    backgroundColor: cardColor,
                    borderColor,
                  },
                ]}
                onPress={() => handleCryptoSelect(option)}
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
                        styles.cryptoIcon,
                        { color: option.iconColor },
                      ]}
                    >
                      {option.icon}
                    </ThemedText>
                  </View>
                  <View style={styles.cardTextContainer}>
                    <ThemedText style={styles.cryptoTitle}>
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
  cryptoCard: {
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
  cryptoIcon: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cardTextContainer: {
    flex: 1,
  },
  cryptoTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
}); 