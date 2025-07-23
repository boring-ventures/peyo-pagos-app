import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useBridgeToS } from "@/app/hooks/useBridgeToS";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function BridgeToSCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { handleToSCallback } = useBridgeToS();
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
            [{ text: "OK", onPress: () => router.replace('/(private)/profile') }]
          );
          return;
        }

        console.log("✅ Processing ToS acceptance with ID:", signedAgreementId);

        // Handle ToS acceptance using the new hook
        const result = await handleToSCallback(`peyopagos://bridge-tos-callback?signed_agreement_id=${signedAgreementId}`);

        if (result.success) {
          console.log("✅ ToS acceptance processed successfully");
          
          // Show success message and redirect to profile
          Alert.alert(
            "Términos Aceptados",
            "Los términos de servicio han sido aceptados exitosamente.",
            [
              {
                text: "Continuar",
                onPress: () => {
                  // Navigate to profile screen
                  router.replace('/(private)/profile');
                }
              }
            ]
          );
        } else {
          console.error("❌ ToS acceptance processing failed:", result.error);
          Alert.alert(
            "Error",
            "Error al procesar la aceptación de términos: " + result.error,
            [
              {
                text: "OK",
                onPress: () => router.replace('/(private)/profile')
              }
            ]
          );
        }
      } catch (error) {
        console.error("💥 Error processing ToS callback:", error);
        Alert.alert(
          "Error",
          "Error inesperado al procesar la aceptación de términos.",
          [{ text: "OK", onPress: () => router.replace('/(private)/profile') }]
        );
      } finally {
        setIsProcessing(false);
      }
    };

    processToSCallback();
  }, [params, handleToSCallback, router]);

  const handleContinue = () => {
    router.replace('/(private)/profile');
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
