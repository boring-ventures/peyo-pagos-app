import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { useBridgeStore } from "@/app/store";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function BridgeToSCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { handleTosAcceptance } = useBridgeStore();
  const tintColor = useThemeColor({}, "tint");
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processToSCallback = async () => {
      try {
        console.log("🔐 Bridge ToS callback received:", params);

        // Extract signed_agreement_id from URL parameters
        const signedAgreementId = params.signed_agreement_id as string;

        if (!signedAgreementId) {
          console.error("❌ No signed_agreement_id received in callback");
          Alert.alert(
            "Error",
            "No se recibió confirmación de aceptación de términos.",
            [{ text: "OK", onPress: () => router.back() }]
          );
          return;
        }

        console.log("✅ Processing ToS acceptance with ID:", signedAgreementId);

        // Handle ToS acceptance in Bridge store
        const result = await handleTosAcceptance(signedAgreementId);

        if (result.success) {
          console.log("✅ ToS acceptance processed successfully");

          // Now that ToS is accepted, continue with Bridge customer creation
          console.log("🔄 Continuing with Bridge customer creation...");

          try {
            // Get current user and re-initialize Bridge integration
            const { kycService } = await import("@/app/services/kycService");
            const { authService } = await import("@/app/services/authService");
            const { profileService } = await import(
              "@/app/services/profileService"
            );

            const currentUser = await authService.getCurrentUser();
            if (!currentUser) {
              throw new Error("No current user found");
            }

            // Get profile data and create Bridge customer
            console.log(
              "🔍 Getting profile data for Bridge customer creation..."
            );
            const profileData = await profileService.getProfileForBridge(
              currentUser.id
            );

            if (!profileData) {
              throw new Error("Failed to get profile data for Bridge");
            }

            // Convert to Bridge format
            const bridgeProfile =
              await kycService.convertDatabaseProfileToBridge(profileData);
            if (!bridgeProfile) {
              throw new Error("Failed to convert profile to Bridge format");
            }

            // Create Bridge customer with the signed agreement ID
            const { createBridgeCustomer } = useBridgeStore.getState();
            const customerResult = await createBridgeCustomer(
              bridgeProfile,
              signedAgreementId
            );

            if (customerResult.success && customerResult.customerId) {
              console.log(
                "✅ Bridge customer created successfully:",
                customerResult.customerId
              );

              // Try to create default wallet
              const { createDefaultWallet } = useBridgeStore.getState();
              const walletResult = await createDefaultWallet();

              if (walletResult.success) {
                console.log("✅ Default wallet created successfully");
              } else {
                console.warn("⚠️ Wallet creation failed:", walletResult.error);
              }

              // Mark as initialized
              useBridgeStore.setState({
                isInitialized: true,
                lastSyncAt: new Date().toISOString(),
              });

              console.log("🎉 Bridge integration completed successfully!");
            } else {
              console.error(
                "❌ Bridge customer creation failed:",
                customerResult.error
              );
            }
          } catch (bridgeError) {
            console.error("💥 Error continuing Bridge flow:", bridgeError);
            // Don't show error to user - this is background process
          }

          // Return to previous screen
          router.back();
        } else {
          console.error("❌ ToS acceptance processing failed:", result.error);
          Alert.alert(
            "Error",
            "Error al procesar la aceptación de términos: " + result.error,
            [{ text: "OK", onPress: () => router.back() }]
          );
        }
      } catch (error) {
        console.error("💥 Error processing ToS callback:", error);
        Alert.alert(
          "Error",
          "Error inesperado al procesar la aceptación de términos.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } finally {
        setIsProcessing(false);
      }
    };

    processToSCallback();
  }, [params]);

  const handleContinue = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { borderColor: tintColor }]}>
          <Ionicons
            name={isProcessing ? "hourglass-outline" : "checkmark-circle"}
            size={64}
            color={tintColor}
          />
        </View>

        <ThemedText type="title" style={styles.title}>
          {isProcessing ? "Procesando..." : "Términos Aceptados"}
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          {isProcessing
            ? "Procesando la aceptación de términos de servicio de Bridge..."
            : "Los términos de servicio han sido aceptados exitosamente."}
        </ThemedText>

        {!isProcessing && (
          <ThemedButton
            title="Continuar"
            onPress={handleContinue}
            style={styles.button}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.8,
  },
  button: {
    minWidth: 200,
  },
});
