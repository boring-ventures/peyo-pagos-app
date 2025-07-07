import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  View
} from "react-native";

export default function GetStartedScreen() {
  const router = useRouter();
  const cardColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");

  const handleLogin = () => {
    router.push("/(public)/login");
  };

  const handleRegister = () => {
    router.push("/(public)/register");
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Modal Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/icon-light.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Title and Subtitle */}
            <View style={styles.textContainer}>
              <ThemedText type="title" style={styles.title}>
                Empieza
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Empieza hoy y toma el control de tus pagos
              </ThemedText>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <ThemedButton
                title="Ingresar"
                onPress={handleLogin}
                type="primary"
                size="large"
                style={styles.button}
              />
              <ThemedButton
                title="Registrarse"
                onPress={handleRegister}
                type="outline"
                size="large"
                style={styles.button}
              />
            </View>
          </View>
        </View>
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 40,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.7,
    maxWidth: 280,
  },
  buttonsContainer: {
    width: "100%",
    gap: 16,
  },
  button: {
    width: "100%",
  },
});
