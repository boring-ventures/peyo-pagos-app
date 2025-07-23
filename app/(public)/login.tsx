import { BiometricLoginBottomSheet } from "@/app/components/auth/BiometricLoginBottomSheet";
import { FormField } from "@/app/components/FormField";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
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
import { biometricService } from "@/app/services/biometricService";
import { useAuthStore } from "@/app/store/authStore";
import useSettingsStore from "@/app/store/settingsStore";

// Validation schema with Yup
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginScreen() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const iconColor = useThemeColor({}, "icon");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  
  const { biometricEnabled, pinEnabled } = useSettingsStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricSheetVisible, setBiometricSheetVisible] = useState(false);
  const [isBiometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'none' | 'fingerprint' | 'facial' | 'iris'>('none');

  useEffect(() => {
    const checkBiometricStatus = async () => {
      const isAvailable = await biometricService.isBiometricAvailable();
      const type = await biometricService.getBiometricType();
      setBiometricAvailable(isAvailable && biometricEnabled);
      setBiometricType(type);
    };
    checkBiometricStatus();
  }, [biometricEnabled]);

  const handleLogin = async (values: { email: string; password: string }) => {
    setIsLoading(true);

    try {
      console.log('🔐 Attempting login with comprehensive validation...');
      
      const success = await login(values.email, values.password);

      if (success) {
        console.log('✅ Login successful, determining next step...');
        
        // Get current auth state to determine redirection
        const { user, profile } = useAuthStore.getState();
        
        if (!user || !profile) {
          console.error('❌ No user/profile data after login');
          Alert.alert(Strings.common.error, 'Error loading user data');
          return;
        }

        console.log('📋 User login details:', {
          userId: user.id,
          email: user.email,
          role: profile.role,
          status: profile.status
        });

        // Determine redirect based on user role and status
        if (profile.role === 'SUPERADMIN') {
          console.log('👑 SUPERADMIN login - redirecting to home');
          if (pinEnabled) {
            router.replace('/(private)/enter-pin');
          } else {
            router.replace('/(private)/home');
          }
          return;
        }

        // For regular users, we need to check Bridge status to determine next step
        if (profile.role === 'USER') {
          try {
            const { bridgeStatusService } = await import('@/app/services/bridgeStatusService');
            const bridgeAccessResult = await bridgeStatusService.canUserAccessHome(user.id);
            
            if (bridgeAccessResult.canAccess) {
              console.log('✅ Bridge status allows home access - redirecting to home');
              if (pinEnabled) {
                router.replace('/(private)/enter-pin');
              } else {
                router.replace('/(private)/home');
              }
            } else {
              console.log('⚠️ Bridge status prevents home access:', bridgeAccessResult.reason);
              router.replace('/(auth)/bridge-status');
            }
          } catch (error) {
            console.error('❌ Error checking Bridge status:', error);
            // If Bridge check fails, redirect to bridge status screen
            router.replace('/(auth)/bridge-status');
          }
        }
      } else {
        // Login failed - error should already be set in store
        const { error } = useAuthStore.getState();
        Alert.alert(
          Strings.common.error, 
          error || 'Login failed. Please check your credentials.'
        );
      }
    } catch (error) {
      console.error("💥 Login error:", error);
      Alert.alert(Strings.common.error, Strings.auth.errors.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricSheetVisible(false);
    setIsLoading(true);
    
    try {
      const result = await biometricService.authenticateWithBiometrics(
        'Autentícate para ingresar a la aplicación'
      );
      
      if (result) {
        // Mock successful authentication with demo credentials
        const success = await login('demo@peyopagos.com', 'demo123');
        
        if (success) {
          if (pinEnabled) {
            router.replace('/(private)/enter-pin');
          } else {
            router.replace('/(private)/home');
          }
        }
      } else {
        Alert.alert('Error', 'Autenticación biométrica fallida');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la autenticación biométrica');
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricButtonText = () => {
    switch (biometricType) {
      case 'facial': return 'Ingresar con Face ID';
      case 'fingerprint': return 'Ingresar con Touch ID';
      case 'iris': return 'Ingresar con Iris';
      default: return 'Ingresar con biometría';
    }
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

            {/* Biometric Login Button */}
            {isBiometricAvailable && (
              <ThemedButton
                title={getBiometricButtonText()}
                type="outline"
                size="large"
                onPress={() => setBiometricSheetVisible(true)}
                style={styles.biometricButton}
              />
            )}

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
                    placeholder="Correo electrónico"
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
                    disabled={isLoading}
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
  biometricButton: {
    marginBottom: 16,
  },
});
