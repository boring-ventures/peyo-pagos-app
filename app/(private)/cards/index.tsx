import {
  CardCreation,
  CardDisplay,
  CardError,
  CardLoading,
} from "@/app/components/cards";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { useAuthStore } from "@/app/store/authStore";
import { useCardStore } from "@/app/store/cardStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CardsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    cards,
    isLoadingCards,
    error,
    loadUserCards,
    refreshCards,
    clearError,
  } = useCardStore();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");

  // Load cards when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserCards(user.id);
      }
    }, [user, loadUserCards])
  );

  const handleRefresh = useCallback(async () => {
    if (user) {
      await refreshCards(user.id);
    }
  }, [user, refreshCards]);

  const handleCardPress = (cardId: string) => {
    router.push(`/(private)/cards/${cardId}` as any);
  };

  const handleCreateCard = () => {
    router.push("/(private)/cards/create" as any);
  };

  const handleCardCreated = (cardId: string) => {
    router.push(`/(private)/cards/${cardId}` as any);
  };

  const activeCards = cards.filter(
    (card) => card.is_active && !card.terminated
  );

  if (isLoadingCards && cards.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <CardLoading message="Cargando tus tarjetas..." />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error && cards.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <CardError
              error={error}
              onRetry={() => {
                clearError();
                if (user) loadUserCards(user.id, true);
              }}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCards}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <ThemedText style={[styles.headerTitle, { color: textColor }]}>
              Mis Tarjetas
            </ThemedText>
            <ThemedText
              style={[styles.headerSubtitle, { color: subtextColor }]}
            >
              {activeCards.length > 0
                ? `${activeCards.length} tarjeta${
                    activeCards.length > 1 ? "s" : ""
                  } activa${activeCards.length > 1 ? "s" : ""}`
                : "No tienes tarjetas activas"}
            </ThemedText>
          </View>

          {activeCards.length > 0 && (
            <TouchableOpacity
              style={[styles.addButton, { borderColor: tintColor }]}
              onPress={handleCreateCard}
            >
              <Ionicons name="add-outline" size={20} color={tintColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Cards List */}
        <View style={styles.cardsContainer}>
          {activeCards.length > 0 ? (
            activeCards.map((card, index) => (
              <CardDisplay
                key={card.id}
                card={card}
                onPress={() => handleCardPress(card.id)}
                style={index > 0 ? styles.cardSpacing : undefined}
              />
            ))
          ) : (
            <CardCreation onCardCreated={handleCardCreated} />
          )}
        </View>

        {/* Info Section */}
        {activeCards.length > 0 && (
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <View
                style={[
                  styles.infoIconContainer,
                  { backgroundColor: `${tintColor}20` },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={tintColor}
                />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoTitle, { color: textColor }]}>
                  Usa tu tarjeta de débito
                </ThemedText>
                <ThemedText
                  style={[styles.infoDescription, { color: subtextColor }]}
                >
                  Realiza compras en línea, retira efectivo en cajeros
                  automáticos y controla tu tarjeta directamente desde la app.
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  cardsContainer: {
    paddingHorizontal: 0,
  },
  cardSpacing: {
    marginTop: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 16,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
