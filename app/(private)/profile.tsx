import { UserTagDisplay } from "@/app/components/profile/UserTagDisplay";
import { ProfileInfoRow } from "@/app/components/ProfileInfoRow";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { ThemeSelector } from "@/app/components/ThemeSelector";
import { UserAvatar } from "@/app/components/UserAvatar";
import { CreateWalletModal } from "@/app/components/wallet/CreateWalletModal";
import { useBridgeRefreshOnScreen } from "@/app/hooks/useBridgeAutoRefresh";
import { kycService } from "@/app/services/kycService";
import { useBridgeStore } from "@/app/store";
import { useAuthStore } from "@/app/store/authStore";
import { Wallet } from "@/app/types/WalletTypes";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated, userTag, loadUserTag } =
    useAuthStore();
  const {
    bridgeCustomerId,
    isInitialized,
    isLoading: bridgeLoading,
    integrationError,
  } = useBridgeStore();

  // 💳 Use wallets from authStore instead of local state
  const {
    wallets: userWallets,
    walletsLoading,
    walletsError,
    loadUserWallets: authLoadUserWallets,
    syncWallets: authSyncWallets,
  } = useAuthStore();

  const [bridgeProgress, setBridgeProgress] = useState<
    "idle" | "in_progress" | "success" | "error"
  >("idle");
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserTag, setIsLoadingUserTag] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);

  // Auto-refresh Bridge status on profile screen
  useBridgeRefreshOnScreen("profile");

  // Early return if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <ThemedText>Redirigiendo...</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/(public)/login");
    }
  }, [isAuthenticated, user, router]);

  // Load user tag if not available
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

  // Load user wallets using authStore
  const loadUserWallets = async () => {
    if (!user?.id) return;
    console.log("💳 Loading wallets for user via authStore:", user.id);
    await authLoadUserWallets();
  };

  // Sync wallets from Bridge using authStore
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
        result.errors.length > 0
          ? result.errors.join(", ")
          : "Unknown error occurred.",
        [{ text: "OK" }]
      );
    }
  };

  // Handle wallet creation success
  const handleWalletCreated = async (wallet: Wallet) => {
    console.log("✅ New wallet created:", wallet.id);
    await authLoadUserWallets();
  };

  // Load wallets when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user?.id && !walletsLoading) {
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

  // Safe string helpers to prevent undefined errors
  const getDisplayName = () => {
    const firstName = profile?.first_name || "";
    const lastName = profile?.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Usuario";
  };

  const getUserEmail = () => {
    return user?.email || "No especificado";
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Avatar and Name Section */}
          <View style={styles.avatarContainer}>
            <UserAvatar imageUrl={profile?.avatar_url} size={100} />

            <ThemedText type="title" style={styles.displayName}>
              {getDisplayName()}
            </ThemedText>

            <ThemedText style={styles.email}>{getUserEmail()}</ThemedText>
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
              value={profile?.first_name || "No especificado"}
              icon="person-outline"
            />
            <ProfileInfoRow
              label="Apellido"
              value={profile?.last_name || "No especificado"}
              icon="people-outline"
            />
            <ProfileInfoRow
              label="Email"
              value={getUserEmail()}
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
          {/* <View style={styles.sectionContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Desarrollador
            </ThemedText>

            <ActionCard
              title="Bridge Debug Panel"
              subtitle="Panel de testing y depuración Bridge"
              icon="code-outline"
              onPress={() => router.push("/(private)/bridge-debug")}
            />
          </View> */}

          {/* Bridge Setup Button for existing users without Bridge customer */}
          {/* {!bridgeCustomerId && !isInitialized && (
            <View style={styles.setupContainer}>
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
                style={styles.setupButton}
                disabled={bridgeProgress === "in_progress" || bridgeLoading}
              />
              {bridgeProgress === "error" && bridgeError && (
                <ThemedText style={styles.errorText}>{bridgeError}</ThemedText>
              )}
              {bridgeProgress === "success" && (
                <ThemedText style={styles.successText}>
                  ¡Bridge configurado correctamente!
                </ThemedText>
              )}
            </View>
          )} */}

          {/* KYC Review Button */}
          {/* <View style={styles.setupContainer}>
            <ThemedButton
              title="Revisar Proceso KYC"
              onPress={() => router.push("/(auth)/document-review")}
              type="outline"
              style={styles.setupButton}
            />
            <ThemedText style={styles.helperText}>
              Accede al proceso completo de KYC y Bridge
            </ThemedText>
          </View> */}

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
        </ScrollView>

        {/* Create Wallet Modal */}
        <CreateWalletModal
          isVisible={showCreateWalletModal}
          onClose={() => setShowCreateWalletModal(false)}
          onSuccess={handleWalletCreated}
          profileId={user?.id || ""}
          customerId={bridgeCustomerId || ""}
        />
      </SafeAreaView>
    </ThemedView>
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
    paddingVertical: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  walletsContainer: {
    gap: 12,
  },
  walletItem: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  walletName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: "monospace",
  },
  progressContainer: {
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
  },
  bridgeInfoContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b2ebf2",
  },
  bridgeInfoText: {
    textAlign: "center",
    color: "#00796b",
    fontSize: 14,
  },
  setupContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  setupButton: {
    marginBottom: 8,
    width: 220,
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 4,
  },
  successText: {
    color: "#4ADE80",
    textAlign: "center",
    marginTop: 4,
  },
  helperText: {
    color: "#6B7280",
    textAlign: "center",
    fontSize: 12,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    width: "100%",
  },
});
