import { ActionCard } from "@/app/components/ActionCard";
import { EventTimeline } from "@/app/components/analytics/EventTimeline";
import { BridgeIntegrationCard } from "@/app/components/bridge/BridgeIntegrationCard";
import { UserTagDisplay } from "@/app/components/profile/UserTagDisplay";
import { ProfileInfoRow } from "@/app/components/ProfileInfoRow";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { ThemeSelector } from "@/app/components/ThemeSelector";
import { UserAvatar } from "@/app/components/UserAvatar";
import { CreateWalletModal } from "@/app/components/wallet/CreateWalletModal";
import { WalletList } from "@/app/components/wallet/WalletList";
import { WalletSyncButton } from "@/app/components/wallet/WalletSyncButton";
import { useBridgeRefreshOnScreen } from "@/app/hooks/useBridgeAutoRefresh";
import { kycService } from "@/app/services/kycService";
import { walletService } from "@/app/services/walletService";
import { useBridgeStore } from "@/app/store";
import { useAuthStore } from "@/app/store/authStore";
import { Wallet } from "@/app/types/WalletTypes";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated, userTag, loadUserTag } =
    useAuthStore(); // 🏷️ NEW: Include userTag and loadUserTag
  const {
    bridgeCustomerId,
    isInitialized,
    isLoading: bridgeLoading,
    integrationError,
  } = useBridgeStore();
  
  // 💳 NEW: Use wallets from authStore instead of local state
  const { 
    wallets: userWallets, 
    walletsLoading, 
    walletsError, 
    loadUserWallets: authLoadUserWallets,
    syncWallets: authSyncWallets 
  } = useAuthStore();
  const [bridgeProgress, setBridgeProgress] = useState<
    "idle" | "in_progress" | "success" | "error"
  >("idle");
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  // Auto-refresh Bridge status on profile screen
  useBridgeRefreshOnScreen("profile");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserTag, setIsLoadingUserTag] = useState(false);

  // 💳 NEW: Wallet-related states (now using authStore)
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);

  // If not authenticated, ensure redirect happens (handled by _layout.tsx)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/(public)/login");
    }
  }, [isAuthenticated, user, router]);

  // 🏷️ NEW: Load user tag if not available
  useEffect(() => {
    const loadUserTagIfNeeded = async () => {
      if (isAuthenticated && user && !userTag) {
        console.log("🏷️ User tag not loaded, fetching from database...");
        setIsLoadingUserTag(true);
        try {
          await loadUserTag();
        } catch (error) {
          console.error("❌ Error loading user tag:", error);
        } finally {
          setIsLoadingUserTag(false);
        }
      }
    };

    loadUserTagIfNeeded();
  }, [isAuthenticated, user, userTag, loadUserTag]);

  // 💳 NEW: Load user wallets (now using authStore)
  const loadUserWallets = async () => {
    if (!user?.id) return;

    console.log("💳 Loading wallets for user via authStore:", user.id);
    await authLoadUserWallets();
  };

  // 💳 NEW: Sync wallets from Bridge (now using authStore)
  const syncWallets = async () => {
    if (!user?.id || !bridgeCustomerId) {
      Alert.alert(
        "Sync Not Available",
        "Bridge customer ID not found. Please complete KYC first.",
        [{ text: "OK" }]
      );
      return;
    }

    console.log("🔄 Syncing wallets from Bridge via authStore...");
    const result = await authSyncWallets();

    if (result.success) {
      Alert.alert(
        "Wallets Synchronized",
        `Successfully synced ${result.syncedCount} wallet${
          result.syncedCount !== 1 ? "s" : ""
        }${result.createdCount > 0 ? ` (${result.createdCount} new)` : ""}.`,
        [{ text: "Great!" }]
      );
    } else {
      Alert.alert(
        "Sync Failed", 
        result.errors.length > 0 ? result.errors.join(", ") : "Unknown error occurred.", 
        [{ text: "OK" }]
      );
    }
  };

  // 💳 NEW: Handle wallet creation success (now using authStore)
  const handleWalletCreated = async (wallet: Wallet) => {
    console.log("✅ New wallet created:", wallet.id);
    // Reload wallets to include the new one
    await authLoadUserWallets();
  };

  // Load wallets when component mounts or user changes (now using authStore)
  useEffect(() => {
    if (isAuthenticated && user?.id && !walletsLoading) {
      // Only load if not already loading and we don't have wallets
      if (!userWallets || userWallets.length === 0) {
        authLoadUserWallets();
      }
    }
  }, [isAuthenticated, user?.id]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await useAuthStore.getState().logout();
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push("/(private)/edit-profile");
  };

  const handleViewWallets = () => {
    // Could navigate to a dedicated wallets screen
    Alert.alert(
      "Bridge Wallets",
      "Función de wallets Bridge será implementada próximamente"
    );
  };

  // Handler para iniciar/reintentar Bridge integration
  const handleBridgeSetup = async () => {
    setBridgeProgress("in_progress");
    setBridgeError(null);
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error("No user found");
      // Forzar retry robusto
      const result = await kycService.forceRetryBridgeIntegration();
      if (result.success) {
        setBridgeProgress("success");
      } else {
        setBridgeProgress("error");
        setBridgeError(result.error || "Error desconocido");
      }
    } catch (err) {
      setBridgeProgress("error");
      setBridgeError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Avatar and Name Section */}
        <View style={styles.avatarContainer}>
          <UserAvatar imageUrl={profile?.avatar_url} size={100} />

          <ThemedText type="title" style={styles.displayName}>
            {`${profile?.first_name || ""} ${
              profile?.last_name || ""
            }`.trim() || "Usuario"}
          </ThemedText>

          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Editar Perfil"
            type="outline"
            onPress={handleEditProfile}
            style={styles.actionButton}
          />
          <ThemedButton
            title="Configuración"
            type="outline"
            onPress={() => router.push("/(private)/security-settings")}
            style={styles.actionButton}
          />
        </View>

        {/* Profile Information */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Información Personal
          </ThemedText>

          <ProfileInfoRow
            label="Nombre"
            value={profile?.first_name ?? "No especificado"}
            icon="person-outline"
          />
          <ProfileInfoRow
            label="Apellido"
            value={profile?.last_name ?? "No especificado"}
            icon="people-outline"
          />
          <ProfileInfoRow
            label="Email"
            value={user?.email ?? "No especificado"}
            icon="mail-outline"
          />
        </View>

        {/* User Tag Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Mi Código de Usuario
          </ThemedText>

          {userTag ? (
            <UserTagDisplay
              userTag={userTag}
              isLoading={isLoadingUserTag}
              size="medium"
              showCopyButton={true}
            />
          ) : (
            <ThemedText style={styles.noDataText}>
              {isLoadingUserTag ? "Cargando..." : "Código no disponible"}
            </ThemedText>
          )}
        </View>

        {/* 💳 NEW: Wallets Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.walletSectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Mis Wallets
            </ThemedText>
            <View style={styles.walletActions}>
              <WalletSyncButton
                onSync={syncWallets}
                isLoading={walletsLoading}
                showText={false}
                disabled={!bridgeCustomerId}
              />
              {walletService.canCreateWallets() && bridgeCustomerId && (
                <ThemedButton
                  title="+"
                  onPress={() => setShowCreateWalletModal(true)}
                  style={styles.createWalletButton}
                />
              )}
            </View>
          </View>

          <WalletList
            wallets={userWallets}
            isLoading={walletsLoading}
            error={walletsError}
            onRefresh={loadUserWallets}
            onWalletPress={(wallet: Wallet) => {
              console.log("Wallet pressed:", wallet.id);
              // Future: navigate to wallet details
            }}
          />

          {!walletsLoading && userWallets.length === 0 && !walletsError && (
            <ThemedText style={styles.noDataText}>
              No hay wallets disponibles.
              {bridgeCustomerId
                ? " Presiona el botón de sincronizar para obtener tus wallets de Bridge."
                : " Completa tu KYC para acceder a tus wallets."}
            </ThemedText>
          )}
        </View>

        {/* User Journey Progress Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Mi Progreso
          </ThemedText>

          {user?.id ? (
            <EventTimeline
              userId={user.id}
              maxEvents={10}
              showMetadata={false}
            />
          ) : (
            <ThemedText style={styles.noDataText}>
              No hay datos de progreso disponibles
            </ThemedText>
          )}
        </View>

        {/* Bridge Integration Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Bridge Wallet Integration
          </ThemedText>

          <BridgeIntegrationCard onViewWallets={handleViewWallets} />

          {/* Additional Bridge Info */}
          {bridgeCustomerId && (
            <View style={styles.bridgeInfoContainer}>
              <ThemedText style={styles.bridgeInfoText}>
                💡 Bridge está configurado. Puedes crear wallets y realizar
                transacciones.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Preferences Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Preferencias
          </ThemedText>

          <ThemeSelector />

          <ProfileInfoRow
            label="Notificaciones"
            value="Activadas"
            icon="notifications-outline"
          />
          <ProfileInfoRow
            label="Idioma"
            value="Español"
            icon="language-outline"
          />
        </View>

        {/* Developer Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Desarrollador
          </ThemedText>

          <ActionCard
            title="Bridge Debug Panel"
            subtitle="Panel de testing y depuración Bridge"
            icon="code-outline"
            onPress={() => router.push("/(private)/bridge-debug")}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <ThemedButton
            title="Cerrar Sesión"
            type="primary"
            onPress={handleLogout}
            loading={isLoading}
            style={styles.logoutButton}
          />
        </View>

        {/* Bridge Setup Button for existing users without Bridge customer */}
        {!bridgeCustomerId && !isInitialized && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ThemedButton
              title={
                bridgeProgress === "in_progress"
                  ? "Configurando Bridge..."
                  : bridgeProgress === "error"
                  ? "Reintentar Bridge"
                  : "Configurar Bridge"
              }
              onPress={handleBridgeSetup}
              loading={bridgeProgress === "in_progress" || bridgeLoading}
              type={bridgeProgress === "error" ? "primary" : "outline"}
              style={{ marginBottom: 8, width: 220 }}
              disabled={bridgeProgress === "in_progress" || bridgeLoading}
            />
            {bridgeProgress === "error" && bridgeError && (
              <ThemedText
                style={{ color: "#FF6B6B", textAlign: "center", marginTop: 4 }}
              >
                {bridgeError}
              </ThemedText>
            )}
            {bridgeProgress === "success" && (
              <ThemedText
                style={{ color: "#4ADE80", textAlign: "center", marginTop: 4 }}
              >
                ¡Bridge configurado correctamente!
              </ThemedText>
            )}
          </View>
        )}

        {/* KYC Review Button - Access to document-review screen */}
        <View style={{ padding: 20, alignItems: "center" }}>
          <ThemedButton
            title="Revisar Proceso KYC"
            onPress={() => router.push("/(auth)/document-review")}
            type="outline"
            style={{ marginBottom: 8, width: 220 }}
          />
          <ThemedText
            style={{ color: "#6B7280", textAlign: "center", fontSize: 12 }}
          >
            Accede al proceso completo de KYC y Bridge
          </ThemedText>
        </View>
      </ScrollView>

      {/* 💳 NEW: Create Wallet Modal */}
      <CreateWalletModal
        isVisible={showCreateWalletModal}
        onClose={() => setShowCreateWalletModal(false)}
        onSuccess={handleWalletCreated}
        profileId={user?.id || ""}
        customerId={bridgeCustomerId || ""}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  displayName: {
    marginTop: 16,
    textAlign: "center",
  },
  email: {
    marginTop: 4,
    textAlign: "center",
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    width: "100%",
  },
  noDataText: {
    textAlign: "center",
    color: "#888",
    paddingVertical: 10,
  },
  walletSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  walletActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  createWalletButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  bridgeInfoContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#e0f7fa", // Light teal background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b2ebf2", // Light teal border
  },
  bridgeInfoText: {
    textAlign: "center",
    color: "#00796b", // Dark teal text
    fontSize: 14,
  },
});
