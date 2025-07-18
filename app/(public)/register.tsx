import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import * as Yup from "yup";

import { TermsAndConditionsCheckbox } from "@/app/components/auth/TermsAndConditionsCheckbox";
import { useAuth } from "@/app/components/AuthContext";
import { FormField } from "@/app/components/FormField";
import CountrySelector, {
  Country,
  countries,
} from "@/app/components/shared/CountrySelector";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { Strings } from "@/app/constants/Strings";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { authService } from "@/app/services/authService";

// Phone number validation regex (international format)
const phoneRegex = /^[+]?[1-9]\d{1,14}$/;

// Validation schema with Yup
const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email(Strings.auth.validation.emailInvalid)
    .required(Strings.auth.validation.emailRequired),
  phone: Yup.string()
    .matches(phoneRegex, Strings.auth.validation.phoneInvalid)
    .required(Strings.auth.validation.phoneRequired),
  password: Yup.string()
    .min(6, Strings.auth.validation.passwordMin)
    .required(Strings.auth.validation.passwordRequired),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Password confirmation is required"),
  acceptTerms: Yup.boolean()
    .oneOf([true], "You must accept the terms and conditions")
    .required("You must accept the terms and conditions"),
});

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const iconColor = useThemeColor({}, "icon");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");
  const errorColor = useThemeColor({}, "error");
  const cardColor = useThemeColor({}, "card");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);

  const handleRegister = async (values: {
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) => {
    setIsLoading(true);

    try {
      // Format phone number to E.164 format using selected country
      const formattedPhone = authService.formatPhoneToE164(
        values.phone, 
        selectedCountry.dial_code
      );

      console.log("📧 Step 1: Creating user with email+password in auth.users");

      // Step 1: Create user with email+password first (as per user specifications)
      const { user, error: signUpError } = await authService.signUp(
        values.email,
        values.password,
        {
          email: values.email,
          first_name: "", // Will be filled during KYC
          last_name: "",  // Will be filled during KYC
          phone: formattedPhone, // Store phone in metadata for later
        }
      );

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!user) {
        throw new Error('User creation failed');
      }

      console.log("✅ User created successfully with email+password:", user.id);
      console.log("📱 Step 2: Initiating phone verification for existing user");

      // Step 2: Initiate phone verification for existing user
      const { error: otpError } = await authService.sendWhatsAppOTPToExistingUser(formattedPhone, user.id);
      
      if (otpError) {
        // Si es un error de límite de Twilio, permitir continuar ya que el código se envía al dashboard
        if (otpError.message && otpError.message.includes('exceeded the') && otpError.message.includes('daily messages limit')) {
          console.log("⚠️ Error de límite de Twilio, pero puedes ver el código en el dashboard");
          Alert.alert(
            "SMS en Dashboard", 
            "Límite de SMS alcanzado. Puedes ver el código de verificación en el dashboard de Twilio para continuar.",
            [{ text: "Entendido" }]
          );
        } else {
          throw new Error(otpError.message);
        }
      }

      console.log("✅ OTP process completed. Check Twilio dashboard if needed:", formattedPhone);

      // Navigate to OTP verification with user ID for phone verification
      router.push({
        pathname: "/(public)/otp-verification",
        params: { 
          phone: formattedPhone, 
          email: values.email,
          password: values.password,
          purpose: 'signup',
          userId: user.id // Pass user ID for phone verification
        },
      } as any);
    } catch (error) {
      console.error("Register error:", error);
      const errorMessage = error instanceof Error ? error.message : Strings.auth.errors.registerFailed;
      Alert.alert(Strings.common.error, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    Alert.alert("Google Signup", "Google authentication coming soon.");
  };

  const handleLogin = () => {
    router.push("/(public)/login" as any);
  };

  const handleTermsPress = () => {
    Alert.alert(
      "Terms & Conditions",
      "Terms & Conditions content will be displayed here."
    );
  };

  const handlePrivacyPress = () => {
    Alert.alert(
      "Privacy Policy",
      "Privacy Policy content will be displayed here."
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: "#1A2B42" }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="title" style={styles.title}>
              {Strings.auth.register.title}
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              {Strings.auth.register.subtitle}
            </ThemedText>

            <Formik
              initialValues={{
                email: "",
                phone: "",
                password: "",
                confirmPassword: "",
                acceptTerms: false,
              }}
              validationSchema={RegisterSchema}
              onSubmit={handleRegister}
            >
              {(formikProps) => (
                <View style={styles.formContainer}>
                  <FormField
                    label="Email"
                    formikKey="email"
                    formikProps={formikProps}
                    placeholder={Strings.auth.register.emailPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    leftIcon={
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={iconColor}
                      />
                    }
                    editable={!isLoading}
                  />

                  <View style={styles.phoneInputContainer}>
                    <View style={styles.countrySelector}>
                      <CountrySelector
                        selectedCountry={selectedCountry}
                        onSelectCountry={setSelectedCountry}
                      />
                    </View>
                    <View style={styles.phoneInput}>
                      <FormField
                        label=""
                        formikKey="phone"
                        formikProps={formikProps}
                        placeholder={Strings.auth.register.phonePlaceholder}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        leftIcon={
                          <Ionicons
                            name="call-outline"
                            size={20}
                            color={iconColor}
                          />
                        }
                        editable={!isLoading}
                      />
                    </View>
                  </View>

                  <FormField
                    label="Password"
                    formikKey="password"
                    formikProps={formikProps}
                    placeholder={Strings.auth.register.passwordPlaceholder}
                    secureTextEntry={true}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    passwordRules="minlength: 6;"
                    leftIcon={
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={iconColor}
                      />
                    }
                    editable={!isLoading}
                  />

                  <FormField
                    label="Confirm Password"
                    formikKey="confirmPassword"
                    formikProps={formikProps}
                    placeholder={
                      Strings.auth.register.confirmPasswordPlaceholder
                    }
                    secureTextEntry={true}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    passwordRules="minlength: 6;"
                    leftIcon={
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={iconColor}
                      />
                    }
                    editable={!isLoading}
                  />

                  <TermsAndConditionsCheckbox
                    formikProps={formikProps}
                    formikKey="acceptTerms"
                  />

                  <ThemedButton
                    title={Strings.auth.register.registerButton}
                    onPress={() => formikProps.handleSubmit()}
                    loading={isLoading}
                    disabled={
                      isLoading ||
                      !formikProps.isValid ||
                      formikProps.isSubmitting
                    }
                    style={styles.registerButton}
                    size="large"
                  />
                </View>
              )}
            </Formik>

            <View style={styles.loginContainer}>
              <ThemedText style={{ color: textSecondaryColor }}>
                {Strings.auth.register.hasAccount}
              </ThemedText>
              <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                <ThemedText style={[styles.loginLink, { color: tintColor }]}>
                  {Strings.auth.register.loginAction}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  formContainer: {
    width: "100%",
    marginBottom: 24,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  countrySelector: {
    flex: 2,
  },
  phoneInput: {
    flex: 3,
  },
  registerButton: {
    marginBottom: 16,
    width: "100%",
  },
  googleButton: {
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginLink: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
});
