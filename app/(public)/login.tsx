import { BiometricLoginBottomSheet } from "@/app/components/auth/BiometricLoginBottomSheet";
import { FormField } from "@/app/components/FormField";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";

import { useAuth } from "@/app/components/AuthContext";
import { Strings } from "@/app/constants/Strings";
import { useThemeColor } from "@/app/hooks/useThemeColor";

// Validation schema with Yup
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const BIOMETRIC_ENABLED_KEY = "@biometric_enabled_mock";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const iconColor = useThemeColor({}, "icon");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricSheetVisible, setBiometricSheetVisible] = useState(false);
  const [isBiometricAvailable, setBiometricAvailable] = useState(false);

  // Mock check for biometrics
  useEffect(() => {
    const checkBiometricStatus = async () => {
      const isEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      // In a real app, you'd also check hardware compatibility
      setBiometricAvailable(isEnabled === "true");
    };
    checkBiometricStatus();
  }, []);

  const handleLogin = async (values: { email: string; password: string }) => {
    setIsLoading(true);

    try {
      const success = await login(values.email, values.password);

      if (!success) {
        Alert.alert(Strings.common.error, Strings.auth.errors.loginFailed);
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(Strings.common.error, Strings.auth.errors.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    setBiometricSheetVisible(false);
    setIsLoading(true);
    // Mock biometric auth logic
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Biometric Login Successful", "Welcome back!", [
        { text: "OK", onPress: () => router.replace("/(private)/enter-pin") },
      ]);
    }, 1000);
  };

  // Mock function to enable biometrics for testing
  const enableBiometricsForTesting = async () => {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
    setBiometricAvailable(true);
    Alert.alert(
      "Biometrics Enabled",
      "Biometric login option is now available for testing."
    );
  };

  const handleForgotPassword = () => {
    router.push("/(public)/forgot-password" as any);
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    Alert.alert("Google Login", "Google authentication coming soon.");
  };

  const handleRegister = () => {
    router.push("/(public)/register" as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: "#1A2B42" }]}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={"#fff"} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="title" style={styles.title}>
              Bienvenido de nuevo
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Inicia sesión en tu cuenta
            </ThemedText>

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {(formikProps) => (
                <View style={styles.formContainer}>
                  <FormField
                    formikProps={formikProps}
                    formikKey="email"
                    label="Correo electrónico"
                    placeholder="Enter Address"
                    keyboardType="email-address"
                  />

                  <FormField
                    formikProps={formikProps}
                    formikKey="password"
                    label="Contraseña"
                    placeholder="Introduce tu contraseña"
                    secureTextEntry
                  />

                  <TouchableOpacity
                    onPress={() => router.push("/(public)/forgot-password")}
                    style={styles.forgotPassword}
                  >
                    <ThemedText type="link">Olvidé mi contraseña</ThemedText>
                  </TouchableOpacity>

                  <ThemedButton
                    title="Iniciar sesión"
                    type="primary"
                    size="large"
                    onPress={() => formikProps.handleSubmit()}
                    loading={isLoading}
                    disabled={isLoading || !formikProps.isValid}
                    style={styles.button}
                  />
                </View>
              )}
            </Formik>
            <View style={styles.registerContainer}>
              <ThemedText>¿No tienes cuenta? </ThemedText>
              <TouchableOpacity onPress={handleRegister}>
                <ThemedText type="link">Regístrate</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BiometricLoginBottomSheet
        isVisible={isBiometricSheetVisible}
        onClose={() => setBiometricSheetVisible(false)}
        onAuthenticate={handleBiometricLogin}
      />
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
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    justifyContent: "center",
    flexGrow: 1,
  },
  card: {
    borderRadius: 24,
    padding: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  button: {
    marginTop: 8,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
});
